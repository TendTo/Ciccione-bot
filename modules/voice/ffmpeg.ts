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

export class FFmpegStream extends ReadableStream<Uint8Array> {
  #proc?: Deno.Process;
  #stderr?: ReadableStream<string>;

  get proc() {
    if (!this.#proc) {
      this.#proc = Deno.run({
        cmd: [(this.options.exePath || "ffmpeg"), ...this.options.args],
        stdout: "piped",
        stderr: this.options.stderr ? "piped" : "null",
      });
      this.proc.status().then((status) => {
        console.log(`processEnded: ${status.code}`);
      });
    }

    if (this.#proc.stderr) {
      this.#stderr = readableStreamFromReader(this.#proc.stderr).pipeThrough(
        new TextDecoderStream(),
      );
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

  constructor(public options: FFmpegStreamOptions) {
    const { chunkSize = DEFAULT_CHUNK_SIZE } = options;
    super({
      pull: async (ctx: ReadableStreamDefaultController<Uint8Array>) => {
        const chunk = new Uint8Array(chunkSize);
        let currentRead = 0;
        try {
          // Keep reading until we have a full chunk
          while (currentRead < DEFAULT_CHUNK_SIZE) {
            const missingChunk = new Uint8Array(chunkSize - currentRead);
            const read = await this.proc.stdout?.read(missingChunk);

            // If the stream has ended, close both the stream and the process
            if (read === undefined || read === null) {
              ctx.close();
              this.proc.close();
              return;
            }

            chunk.set(missingChunk.subarray(0, read), currentRead);
            currentRead += read;
          }

          // Enqueue the chunk after applying the encoding
          const encoded = this.chunkEncoder(chunk);
          ctx.enqueue(encoded);
        } catch (e) {
          console.error(e);
          ctx.error(e);
          this.proc.close();
        }
      },
      cancel: () => {
        console.log("readable stream cancel");
        this.proc.stderr?.close();
        this.proc.stdout?.close();
        this.proc.close();
      },
    });
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
        "-",
      ],
    });
  }
}

export class OpusStream extends PCMStream {
  private static _encoder?: Encoder;

  constructor(path: string) {
    super(path);
  }

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

  override chunkEncoder(chunk: Uint8Array): Uint8Array {
    return OpusStream.encoder.encode(FRAME_SIZE, new Int16Array(chunk.buffer));
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
