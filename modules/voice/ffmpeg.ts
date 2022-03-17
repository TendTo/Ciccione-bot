import { Encoder, readableStreamFromReader } from "../../deps.ts";
import {
  CHANNELS,
  DEFAULT_CHUNK_SIZE,
  FRAME_SIZE,
  SAMPLE_RATE,
} from "./types.ts";

export interface FFmpegStreamOptions {
  exePath?: string;
  args: string[];
  chunkSize?: number;
  stderr?: boolean;
}

export class FFmpegStream {
  #proc?: Deno.Process;
  #stdout?: ReadableStream<Uint8Array>;
  #stderr?: ReadableStream<string>;
  #transformer?: TransformStream;

  get transformer() {
    if (!this.#transformer) {
      const chunkEncoder = this.chunkEncoder.bind(this);
      this.#transformer = new TransformStream({
        transform(chunk, controller) {
          controller.enqueue(chunkEncoder(chunk));
        },
        flush(controller) {
          controller.terminate();
        },
      });
    }
    return this.#transformer;
  }

  get proc() {
    if (!this.#proc) {
      this.#proc = Deno.run({
        cmd: [this.options.exePath || "ffmpeg", ...this.options.args],
        stdout: "piped",
        stderr: this.options.stderr ? "piped" : "null",
      });
    }
    return this.#proc;
  }

  get stderr() {
    if (!this.#stderr) {
      if (this.proc.stderr) {
        this.#stderr = readableStreamFromReader(this.proc.stderr).pipeThrough(
          new TextDecoderStream(),
        );
      }
    }

    return this.#stderr;
  }

  get stdout() {
    if (!this.#stdout && this.proc.stdout) {
      this.#stdout = readableStreamFromReader(this.proc.stdout, {
        chunkSize: DEFAULT_CHUNK_SIZE,
      }).pipeThrough(
        this.transformer,
      );
    }

    return this.#stdout;
  }

  constructor(public options: FFmpegStreamOptions) {}

  /**
   * Encode the audio stream with the provided encoding.
   * This version just returns the chunk provided.
   * Should be overriden by subclasses.
   * @param chunk chunk read from the original stream, to be encoded
   * @returns encoded chunk
   */
  chunkEncoder(chunk: Uint8Array): Uint8Array {
    return chunk;
  }
}

export class PCMStream extends FFmpegStream {
  constructor(path: string) {
    super({
      args: [
        "-i",
        path,
        "-f",
        "s16le",
        "-acodec",
        "pcm_s16le",
        "-ac",
        "2",
        "-ar",
        "48000",
        "pipe:1",
      ],
    });
  }
}

export class OpusStream extends PCMStream {
  #encoder?: Encoder;

  /**
   * Encoder getter.
   * If encoder has not yet been initialized, it will be initialized
   * and stored in a static variable for future reuse.
   * @returns encoder
   */
  get encoder(): Encoder {
    if (this.#encoder) return this.#encoder;

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

    this.#encoder = encoder;

    return this.#encoder;
  }

  constructor(path: string) {
    super(path);
  }

  override chunkEncoder(chunk: Uint8Array): Uint8Array {
    return this.encoder.encode(FRAME_SIZE, new Int16Array(chunk.buffer));
  }
}

const I16_MIN = 2 ** 16 / 2 - 1;
const I16_MAX = -1 * I16_MIN;

export class VolumeTransformer extends TransformStream<Uint8Array, Uint8Array> {
  constructor(public options: { volume: number }) {
    super({
      transform(chunk, ctx) {
        chunk = chunk.slice(); // todo: do we have to copy to prevent mutating passed buffer?
        const view = new DataView(chunk.buffer);

        for (let i = 0; i < chunk.length; i += 2) {
          view.setInt16(
            i,
            Math.max(
              I16_MAX,
              Math.min(I16_MIN, options.volume * view.getInt16(i, true)),
            ),
            true,
          );
        }

        ctx.enqueue(chunk);
      },
    });
  }
}
