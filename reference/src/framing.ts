// LNCP/1 stream framing — mirrors spec/lncp-1/01-framing.md.

import { ContentType } from './registry.js';

/** Maximum body length for one frame: 1 MiB (spec §4). */
export const MAX_FRAME_BODY = 1 << 20;

/** A decoded frame: its content-type byte and raw body bytes. */
export interface Frame {
  contentType: number;
  body: Buffer;
}

/** Encode one length-prefixed frame: [uint32 BE length][uint8 c-type][body]. */
export function encodeFrame(body: Buffer, contentType: number = ContentType.JSON): Buffer {
  if (body.length > MAX_FRAME_BODY) {
    throw new Error(`frame body ${body.length} exceeds max ${MAX_FRAME_BODY}`);
  }
  const header = Buffer.alloc(5);
  header.writeUInt32BE(body.length, 0);
  header.writeUInt8(contentType, 4);
  return Buffer.concat([header, body]);
}

/** Encode a value as a JSON frame (content-type 1). */
export function encodeJsonFrame(value: unknown): Buffer {
  return encodeFrame(Buffer.from(JSON.stringify(value)), ContentType.JSON);
}

/**
 * Incremental frame decoder for a stream transport. Feed it transport chunks;
 * it buffers across reads and yields whole frames. Frames whose content-type is
 * not JSON are surfaced too (callers skip unknown encodings per spec §3.1); a
 * frame exceeding the max size throws, signalling the stream must be closed.
 */
export class FrameDecoder {
  private buf: Buffer = Buffer.alloc(0);

  /** Append a transport chunk and return every complete frame now available. */
  push(chunk: Buffer): Frame[] {
    this.buf = this.buf.length === 0 ? chunk : Buffer.concat([this.buf, chunk]);
    const frames: Frame[] = [];

    while (this.buf.length >= 5) {
      const length = this.buf.readUInt32BE(0);
      if (length > MAX_FRAME_BODY) {
        throw new Error(`frame length ${length} exceeds max ${MAX_FRAME_BODY}`);
      }
      if (this.buf.length < 5 + length) break; // wait for more bytes

      const contentType = this.buf.readUInt8(4);
      const body = this.buf.subarray(5, 5 + length);
      frames.push({ contentType, body: Buffer.from(body) });
      this.buf = this.buf.subarray(5 + length);
    }
    return frames;
  }
}

/** Decode a JSON frame body into a value; throws if the content-type is not JSON. */
export function decodeJsonFrame(frame: Frame): unknown {
  if (frame.contentType !== ContentType.JSON) {
    throw new Error(`unsupported content-type ${frame.contentType}`);
  }
  return JSON.parse(frame.body.toString('utf8'));
}
