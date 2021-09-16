import type { VoiceConnection } from "./connection.ts";
import {
  CHANNELS,
  DEFAULT_CHUNK_SIZE,
  FRAME_DURATION,
  FRAME_SIZE,
  MAX_PACKET_SIZE,
  SAMPLE_RATE,
} from "./types.ts";
import { Encoder, readableStreamFromIterable } from "../../deps.ts";
import { FFmpegStream, OpusStream, PCMStream } from "./ffmpeg.ts";
import { readerFromStreamReader } from "https://deno.land/std@0.98.0/io/streams.ts";

const frame = new Uint8Array(MAX_PACKET_SIZE);
frame.set([0x80, 0x78], 0);

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

export class VoicePlayer {
  public static index = 0;
  #startTime = Date.now();
  #playTime = 0;
  #pausedTime = 0;
  #nextFrame?: number;
  playing = false;
  paused = false;
  #readable?: ReadableStream<Uint8Array>;
  #readableCtx?: ReadableStreamDefaultController<Uint8Array>;
  writable: WritableStream<Uint8Array>;

  constructor(public conn: VoiceConnection) {
    this.writable = new WritableStream({
      start: () => {
        this.resetPlayer();

        const iter = encoder.encode_pcm_stream(FRAME_SIZE, this.#readable);
        const reader = readableStreamFromIterable(iter).getReader();

        const frame = async () => {
          if (!this.playing) return;

          if (this.paused) {
            this.#pausedTime += FRAME_DURATION;
          } else {
            const res = await reader.read();

            if (res.done) {
              this.playing = false;
              this.conn.setSpeaking();
              return;
            } else {
              const opus = res.value;
              try {
                await this.conn.udp!.sendVoice(opus);
                // deno-lint-ignore no-empty
              } catch (_e) {}
            }

            this.#playTime += FRAME_DURATION;
          }

          this.#nextFrame = setTimeout(
            frame,
            this.#startTime + this.#playTime + this.#pausedTime - Date.now(),
          );
        };

        this.conn.setSpeaking("MICROPHONE");
        frame().catch(() => {
          this.playing = false;
        });
      },
      write: (chunk) => {
        this.#readableCtx?.enqueue(chunk);
      },
      close: () => {
        this.#readableCtx?.close();
      },
    });
  }

  public play(file: string) {
    this.resetPlayer();
    const reader = new OpusStream(file).getReader();
    const frame = async () => {
      if (!this.playing) return;

      if (this.paused) {
        this.#pausedTime += FRAME_DURATION;
      } else {
        const res = await reader.read();

        if (res.done) {
          this.playing = false;
          this.conn.setSpeaking();
          return;
        } else {
          const opus = res.value;
          try {
            await this.conn.udp!.sendVoice(opus);
          } catch (e) {
            console.error(e);
          }
        }

        this.#playTime += FRAME_DURATION;
      }

      this.#nextFrame = setTimeout(
        frame,
        this.#startTime + this.#playTime + this.#pausedTime - Date.now(),
      );
    };
    this.conn.setSpeaking("MICROPHONE");
    frame().catch((e) => {
      console.error(e);
      this.playing = false;
    });
  }

  private resetPlayer() {
    this.#startTime = Date.now();
    this.#playTime = 0;
    this.#pausedTime = 0;
    this.playing = true;
    if (this.#nextFrame) {
      clearTimeout(this.#nextFrame);
      this.#nextFrame = undefined;
    }
    this.#readable = new ReadableStream({
      start: (ctx) => {
        this.#readableCtx = ctx;
      },
    });
  }
}

export class PRCTransform extends TransformStream<Uint8Array, Uint8Array> {
  constructor(public encoder: Encoder) {
    super(
      {
        // start() {},
        transform(
          chunk: Uint8Array,
          controller: TransformStreamDefaultController<Uint8Array>,
        ) {
          console.error(chunk.byteLength);
          if (chunk === undefined || chunk === null) {
            controller.terminate();
          } else {
            controller.enqueue(
              encoder.encode(FRAME_SIZE / (2 * CHANNELS), chunk),
            );
          }
        },
      },
    );
  }
}
