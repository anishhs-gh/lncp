// LNCP/1 — File Transfer Module
//
// Implements peer-to-peer file exchange.
// Per spec/lncp-1/11-module-file-transfer.md.

import { randomBytes } from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type FileRejectionReason =
  | 'declined'
  | 'busy'
  | 'insufficient_space'
  | 'unsupported_type'
  | 'too_large';

export type FileCancelReason =
  | 'user_cancelled'
  | 'error'
  | 'peer_left';

export interface FileOfferPacket {
  v: string;
  type: 'FILE_OFFER';
  id: string;
  filename: string;
  size: number;
  hash?: string;
  chunkSize?: number;
}

export interface FileAcceptPacket {
  v: string;
  type: 'FILE_ACCEPT';
  re: string;
  chunkSize?: number;
}

export interface FileRejectPacket {
  v: string;
  type: 'FILE_REJECT';
  re: string;
  reason?: FileRejectionReason;
}

export interface FileReadyPacket {
  v: string;
  type: 'FILE_READY';
  re: string;
}

export interface FileCancelPacket {
  v: string;
  type: 'FILE_CANCEL';
  re: string;
  reason?: FileCancelReason;
}

export interface FilePausePacket {
  v: string;
  type: 'FILE_PAUSE';
  re: string;
}

export interface FileResumeRequestPacket {
  v: string;
  type: 'FILE_RESUME_REQUEST';
  re: string;
  offset?: number;
}

export interface FileResumePacket {
  v: string;
  type: 'FILE_RESUME';
  re: string;
  offset: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Generate a UUID v4 using crypto (same format as voice.ts). */
function generateUuid(): string {
  const bytes = randomBytes(16);
  // Set version (4) and variant bits per RFC 4122
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Builders
// ─────────────────────────────────────────────────────────────────────────────

/** Generate a unique transfer ID. */
export function generateTransferId(): string {
  return generateUuid();
}

/** Build a FILE_OFFER packet. */
export function buildFileOffer(
  filename: string,
  size: number,
  options?: {
    hash?: string;
    chunkSize?: number;
    id?: string;
  },
): FileOfferPacket {
  const packet: FileOfferPacket = {
    v: '1.0',
    type: 'FILE_OFFER',
    id: options?.id ?? generateTransferId(),
    filename,
    size,
  };
  if (options?.hash !== undefined) {
    packet.hash = options.hash;
  }
  if (options?.chunkSize !== undefined) {
    packet.chunkSize = options.chunkSize;
  }
  return packet;
}

/** Build a FILE_ACCEPT packet. */
export function buildFileAccept(transferId: string, chunkSize?: number): FileAcceptPacket {
  const packet: FileAcceptPacket = { v: '1.0', type: 'FILE_ACCEPT', re: transferId };
  if (chunkSize !== undefined) {
    packet.chunkSize = chunkSize;
  }
  return packet;
}

/** Build a FILE_REJECT packet. */
export function buildFileReject(
  transferId: string,
  reason?: FileRejectionReason,
): FileRejectPacket {
  const packet: FileRejectPacket = { v: '1.0', type: 'FILE_REJECT', re: transferId };
  if (reason !== undefined) {
    packet.reason = reason;
  }
  return packet;
}

/** Build a FILE_READY packet. */
export function buildFileReady(transferId: string): FileReadyPacket {
  return { v: '1.0', type: 'FILE_READY', re: transferId };
}

/** Build a FILE_CANCEL packet. */
export function buildFileCancel(
  transferId: string,
  reason?: FileCancelReason,
): FileCancelPacket {
  const packet: FileCancelPacket = { v: '1.0', type: 'FILE_CANCEL', re: transferId };
  if (reason !== undefined) {
    packet.reason = reason;
  }
  return packet;
}

/** Build a FILE_PAUSE packet. */
export function buildFilePause(transferId: string): FilePausePacket {
  return { v: '1.0', type: 'FILE_PAUSE', re: transferId };
}

/** Build a FILE_RESUME_REQUEST packet. */
export function buildFileResumeRequest(
  transferId: string,
  offset?: number,
): FileResumeRequestPacket {
  const packet: FileResumeRequestPacket = {
    v: '1.0',
    type: 'FILE_RESUME_REQUEST',
    re: transferId,
  };
  if (offset !== undefined) {
    packet.offset = offset;
  }
  return packet;
}

/** Build a FILE_RESUME packet. */
export function buildFileResume(transferId: string, offset: number): FileResumePacket {
  return { v: '1.0', type: 'FILE_RESUME', re: transferId, offset };
}

// ─────────────────────────────────────────────────────────────────────────────
// Type guards
// ─────────────────────────────────────────────────────────────────────────────

function hasRequiredFields(
  packet: unknown,
  type: string,
  fields: string[],
): packet is Record<string, unknown> {
  if (typeof packet !== 'object' || packet === null) return false;
  const p = packet as Record<string, unknown>;
  if (p.type !== type) return false;
  return fields.every((f) => f in p);
}

export function isFileOffer(packet: unknown): packet is FileOfferPacket {
  return (
    hasRequiredFields(packet, 'FILE_OFFER', ['id', 'filename', 'size']) &&
    typeof (packet as Record<string, unknown>).id === 'string' &&
    typeof (packet as Record<string, unknown>).filename === 'string' &&
    typeof (packet as Record<string, unknown>).size === 'number'
  );
}

export function isFileAccept(packet: unknown): packet is FileAcceptPacket {
  return (
    hasRequiredFields(packet, 'FILE_ACCEPT', ['re']) &&
    typeof (packet as Record<string, unknown>).re === 'string'
  );
}

export function isFileReject(packet: unknown): packet is FileRejectPacket {
  return (
    hasRequiredFields(packet, 'FILE_REJECT', ['re']) &&
    typeof (packet as Record<string, unknown>).re === 'string'
  );
}

export function isFileReady(packet: unknown): packet is FileReadyPacket {
  return (
    hasRequiredFields(packet, 'FILE_READY', ['re']) &&
    typeof (packet as Record<string, unknown>).re === 'string'
  );
}

export function isFileCancel(packet: unknown): packet is FileCancelPacket {
  return (
    hasRequiredFields(packet, 'FILE_CANCEL', ['re']) &&
    typeof (packet as Record<string, unknown>).re === 'string'
  );
}

export function isFilePause(packet: unknown): packet is FilePausePacket {
  return (
    hasRequiredFields(packet, 'FILE_PAUSE', ['re']) &&
    typeof (packet as Record<string, unknown>).re === 'string'
  );
}

export function isFileResumeRequest(packet: unknown): packet is FileResumeRequestPacket {
  return (
    hasRequiredFields(packet, 'FILE_RESUME_REQUEST', ['re']) &&
    typeof (packet as Record<string, unknown>).re === 'string'
  );
}

export function isFileResume(packet: unknown): packet is FileResumePacket {
  return (
    hasRequiredFields(packet, 'FILE_RESUME', ['re', 'offset']) &&
    typeof (packet as Record<string, unknown>).re === 'string' &&
    typeof (packet as Record<string, unknown>).offset === 'number'
  );
}
