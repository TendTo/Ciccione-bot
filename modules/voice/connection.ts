import {
  Collection,
  Encoder,
  readableStreamFromIterable,
  secretbox,
} from "../../deps.ts";
import { VoicePlayer } from "./player.ts";
import {
  CHANNELS,
  EncryptionMode,
  FRAME_DURATION,
  FRAME_SIZE,
  SAMPLE_RATE,
  Speaking,
} from "./types.ts";
import { VoiceUDP } from "./udp.ts";
import { VoiceWebSocket } from "./ws.ts";

export interface VoiceConnectionConfig {
  mode?: EncryptionMode;
  receive?: "opus" | "pcm";
}

export interface VoiceConnectionInfo {
  token: string;
  endpoint: string;
}

export class VoiceConnection {
  private static _encoder: Encoder;
  private static connections = new Collection<string, VoiceConnection>();

  token?: string;
  endpoint?: string;

  mode?: EncryptionMode;
  receive?: "opus" | "pcm";

  ws: VoiceWebSocket;
  udp: VoiceUDP;

  #key = new Uint8Array(secretbox.key_length);
  #closables: CallableFunction[] = [];

  /**
   * Encoder getter.
   * If encoder has not yet been initialized, it will be initialized
   * and stored in a static variable for future reuse.
   * @returns encoder
   */
  static get encoder(): Encoder {
    if (this._encoder) return this._encoder;

    const encoder = new Encoder({
      channels: CHANNELS,
      application: "audio",
      max_opus_size: undefined,
      sample_rate: SAMPLE_RATE,
    });

    encoder.bitrate = 96000;
    encoder.complexity = 10;
    encoder.packet_loss = 2;
    encoder.signal = "music";
    encoder.inband_fec = true;

    this._encoder = encoder;

    return this._encoder;
  }

  /**
   * Check if the client is connected to the voice channel.
   * @param userID id of the client
   * @returns whether the client connected to the voice channel
   */
  static isJoined(guildID: string): boolean {
    return this.connections.has(guildID);
  }

  /**
   * Returns the voice connection of the provided user.
   * @param userID id of the client
   * @returns voice connection already initialized
   */
  static get(guildID: string): VoiceConnection | undefined {
    return this.connections.get(guildID);
  }

  /**
   * Player getter.
   * If player has not yet been initialized, it will be initialized
   * and stored in a variable for future reuse.
   * @returns voice player
   */
  get player(): VoicePlayer {
    return new VoicePlayer(this);
  }

  get key(): Uint8Array {
    return this.#key;
  }

  set key(val: Uint8Array) {
    this.#key.set(val);
  }

  #startTime = Date.now();
  #playTime = 0;
  #pausedTime = 0;
  #nextFrame?: number;
  paused = false;

  get ready() {
    return this.ws.ready;
  }

  constructor(
    public userID: string,
    public guildID: string,
    public channelID: string,
    public sessionID: string,
    config: VoiceConnectionConfig = {},
  ) {
    this.ws = new VoiceWebSocket(this);
    this.udp = new VoiceUDP(this);
    this.mode = config.mode;
    this.receive = config.receive;
  }

  connect({ token, endpoint }: VoiceConnectionInfo) {
    VoiceConnection.connections.set(this.guildID, this);
    this.token = token;
    this.endpoint = endpoint;
    this.ws.connect();
  }

  setSpeaking(...flags: (keyof typeof Speaking)[]) {
    return this.ws.sendSpeaking(
      flags.map((e) => Speaking[e]).reduce((a, b) => a | b, 0),
    );
  }

  async playPCM(pcm: Iterable<Uint8Array> | AsyncIterable<Uint8Array>) {
    if (this.#nextFrame) {
      clearTimeout(this.#nextFrame);
      this.#nextFrame = undefined;
    }

    const iter = VoiceConnection.encoder.encode_pcm_stream(FRAME_SIZE, pcm);
    const stream = readableStreamFromIterable(
      iter as AsyncIterable<Uint8Array>,
    );
    const reader = stream.getReader();

    this.#startTime = Date.now();
    this.#playTime = 0;
    this.#pausedTime = 0;

    const frame = async () => {
      if (this.paused) {
        this.#pausedTime += FRAME_DURATION;
      } else {
        const res = await reader.read();

        if (res.done) {
          this.ws?.sendSpeaking(0);
          return;
        } else {
          const opus = res.value;
          await this.udp!.sendVoice(opus);
        }

        this.#playTime += FRAME_DURATION;
      }

      this.#nextFrame = setTimeout(
        frame,
        this.#startTime + this.#playTime + this.#pausedTime - Date.now(),
      );
    };

    this.ws?.sendSpeaking(Speaking.MICROPHONE);
    await frame();
  }

  readable(userID: string) {
    return this.udp.readable(userID);
  }

  close() {
    if (this.#nextFrame) {
      clearTimeout(this.#nextFrame);
      this.#nextFrame = undefined;
    }
    // this.ws?.close();
    this.udp?.close();
    VoiceConnection.connections.delete(this.guildID);
  }
}
