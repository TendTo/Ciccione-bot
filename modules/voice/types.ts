export enum OpCode {
  IDENTIFY = 0,
  SELECT_PROTOCOL = 1,
  READY = 2,
  HEARTBEAT = 3,
  SESSION_DESCRIPTION = 4,
  SPEAKING = 5,
  HEARTBEAT_ACK = 6,
  RESUME = 7,
  HELLO = 8,
  RESUMED = 9,
  CLIENT_DISCONNECT = 13,
}

export enum Speaking {
  MICROPHONE = 1 << 0,
  SOUNDSHARE = 1 << 1,
  PRIORITY = 1 << 2,
}

export type EncryptionMode =
  | "xsalsa20_poly1305"
  | "xsalsa20_poly1305_lite"
  | "xsalsa20_poly1305_suffix";

export const VOICE_VERSION = 4; // protocol version
export const CHANNELS = 2; // 1 for the client, 1 for the server
export const SAMPLE_RATE = 48000; // 48KHz
export const MAX_PACKET_SIZE = 3856; // 28 bytes header + 1276 samples * 3 channels
export const FRAME_DURATION = 20; // 20ms
export const FRAME_SIZE = 960; // SAMPLE_RATE * FRAME_DURATION / 1000 = 20ms
export const MAX_SEQ = 65536; // 2^16
export const MAX_TIMESTAMP = 4294967296; // 2^32
export const ENCRYPTION_MODE = "xsalsa20_poly1305"; // default encryption mode
