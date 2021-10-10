import { Collection, secretbox } from "../../deps.ts";
import { waitUntil } from "../util/util.ts";
import { OpusStream } from "./ffmpeg.ts";
import { Audio, VoiceQueue } from "./queue.ts";
import { EncryptionMode, FRAME_DURATION, Speaking } from "./types.ts";
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
  private static connections = new Collection<string, VoiceConnection>();

  token?: string;
  endpoint?: string;

  mode?: EncryptionMode;
  receive?: "opus" | "pcm";

  ws: VoiceWebSocket;
  udp: VoiceUDP;
  vq: VoiceQueue;

  #key = new Uint8Array(secretbox.key_length);

  #startTime = Date.now();
  #playTime = 0;
  #pauseTime = 0;
  #nextFrame?: number;
  private playing = false;
  private paused = false;
  private audioReader?: ReadableStreamDefaultReader<Uint8Array>;

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
  static get(guildID: string): VoiceConnection {
    const conn = VoiceConnection.connections.get(guildID);
    if (!conn) {
      throw new Error("VoiceConnection not found");
    }
    return conn;
  }

  get key(): Uint8Array {
    return this.#key;
  }

  set key(val: Uint8Array) {
    this.#key.set(val);
  }

  get ready() {
    return this.ws.ready;
  }

  get currentAudio() {
    return this.vq.current;
  }

  constructor(
    public userID: string,
    public guildID: string,
    public channelID: string,
    public sessionID: string,
    config: VoiceConnectionConfig = {},
  ) {
    const { mode = "xsalsa20_poly1305", receive } = config;
    this.ws = new VoiceWebSocket(this);
    this.udp = new VoiceUDP(this);
    this.vq = new VoiceQueue();
    this.mode = mode;
    this.receive = receive;
  }

  /**
   * Enstablish a connection with the voice channel.
   * @param param0 token and endpoint sent by Discord
   */
  connect({ token, endpoint }: VoiceConnectionInfo) {
    VoiceConnection.connections.set(this.guildID, this);
    this.token = token;
    this.endpoint = endpoint;
    this.ws.connect();
    return waitUntil(() => this.ready);
  }

  /**
   * Set the speaking state of the client.
   * @param flags bitmask of speaking states:
   * - "MICROPHONE" => normal speaking
   * - "SOUNDSHARE"
   * - "PRIORITY" => priority over other users
   * @returns whether the operation was sucessful
   */
  private setSpeaking(...flags: Speaking[]): boolean {
    return this.ws.sendSpeaking(flags.reduce((a, b) => a | b, 0));
  }

  private async play(file: string) {
    await this.resetPlayer();
    this.playing = true;
    this.audioReader = new OpusStream(file).getReader();
    console.log("Connection", this.udp);
    this.setSpeaking(Speaking.MICROPHONE);
    this.audioFrame().catch((e) => {
      console.error(e);
      this.playing = false;
      this.closeStreams();
    });
  }

  private audioFrame = async () => {
    if (!this.playing || this.audioReader === undefined) return;
    if (this.paused) {
      this.#pauseTime += FRAME_DURATION;
    } else {
      const res = await this.audioReader.read();
      if (res.done) {
        this.skip();
        return;
      } else {
        const opus = res.value;
        try {
          await this.udp!.sendVoice(opus);
        } catch (e) {
          console.error(e);
        }
      }
      this.#playTime += FRAME_DURATION;
    }

    this.#nextFrame = setTimeout(
      this.audioFrame,
      this.#startTime + this.#pauseTime + this.#playTime - Date.now(),
    );
  };

  /**
   * Add an audio to the queue.
   * @param path path or url of the audio to play
   * @returns whether the audio added was played immedialy or just added to the queue
   */
  public addToQueue(path: Audio): boolean {
    this.vq.addAudio(path);
    if (this.vq.onlyOne()) {
      this.play(this.vq.current.path);
      return true;
    }
    return false;
  }

  public pause() {
    this.paused = true;
    this.setSpeaking();
  }

  public resume() {
    this.paused = false;
    this.setSpeaking(Speaking.MICROPHONE);
  }

  public clear() {
    this.vq.clear();
  }

  public async skip() {
    this.playing = false;
    this.paused = false;
    this.vq.pop();
    await this.closeStreams();
    if (this.vq.isEmpty()) {
      this.setSpeaking();
    } else {
      this.play(this.vq.current.path);
      return this.vq.current;
    }
  }

  /**
   * Reset the audio player parameters.
   */
  private async resetPlayer() {
    this.#playTime = 0;
    this.#pauseTime = 0;
    this.#startTime = Date.now();
    await this.closeStreams();
    if (this.#nextFrame) {
      clearTimeout(this.#nextFrame);
      this.#nextFrame = undefined;
    }
  }

  private async closeStreams() {
    if (this.audioReader) {
      await this.audioReader.cancel();
    }
    this.audioReader = undefined;
  }

  /**
   * Disconnect the client from the voice channel.
   * To finalise the disconnect, the client must also leave the voice channel.
   */
  disconnect() {
    if (this.#nextFrame) {
      clearTimeout(this.#nextFrame);
      this.#nextFrame = undefined;
    }
    this.ws?.close();
    this.udp?.close();
    VoiceConnection.connections.delete(this.guildID);
  }
}
