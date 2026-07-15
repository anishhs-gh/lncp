// LNCP/1 — Voice Module
//
// Implements real-time audio calls over LAN.
// Per spec/lncp-1/12-module-voice.md.

import { randomBytes } from 'crypto';
import type { PeerSummary } from './envelope.js';

// Re-export PeerSummary for convenience
export type { PeerSummary };

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CallOfferPacket {
  v: string;
  type: 'CALL_OFFER';
  callId: string;
  from: PeerSummary;
  mediaPort: number;
  key: string; // hex-encoded AES-256 key (64 chars)
}

export interface CallAcceptPacket {
  v: string;
  type: 'CALL_ACCEPT';
  callId: string;
  from: PeerSummary;
  mediaPort: number;
}

export interface CallRejectPacket {
  v: string;
  type: 'CALL_REJECT';
  callId: string;
}

export interface CallBusyPacket {
  v: string;
  type: 'CALL_BUSY';
  callId: string;
}

export interface CallEndPacket {
  v: string;
  type: 'CALL_END';
  callId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Builders
// ─────────────────────────────────────────────────────────────────────────────

/** Generate a unique call ID (same format as transfer IDs). */
export function generateCallId(): string {
  // Use crypto for randomness without uuid dependency
  const bytes = randomBytes(16);
  // Set version (4) and variant bits per RFC 4122
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Generate a fresh AES-256 key for media encryption. */
export function generateMediaKey(): Buffer {
  return randomBytes(32);
}

/** Build a CALL_OFFER packet. */
export function buildCallOffer(
  from: PeerSummary,
  mediaPort: number,
  mediaKey: Buffer,
  callId?: string,
): CallOfferPacket {
  return {
    v: '1.0',
    type: 'CALL_OFFER',
    callId: callId ?? generateCallId(),
    from,
    mediaPort,
    key: mediaKey.toString('hex'),
  };
}

/** Build a CALL_ACCEPT packet. */
export function buildCallAccept(
  callId: string,
  from: PeerSummary,
  mediaPort: number,
): CallAcceptPacket {
  return {
    v: '1.0',
    type: 'CALL_ACCEPT',
    callId,
    from,
    mediaPort,
  };
}

/** Build a CALL_REJECT packet. */
export function buildCallReject(callId: string): CallRejectPacket {
  return { v: '1.0', type: 'CALL_REJECT', callId };
}

/** Build a CALL_BUSY packet. */
export function buildCallBusy(callId: string): CallBusyPacket {
  return { v: '1.0', type: 'CALL_BUSY', callId };
}

/** Build a CALL_END packet. */
export function buildCallEnd(callId: string): CallEndPacket {
  return { v: '1.0', type: 'CALL_END', callId };
}

// ─────────────────────────────────────────────────────────────────────────────
// Type guards
// ─────────────────────────────────────────────────────────────────────────────

function isObjectWith(packet: unknown, type: string): packet is Record<string, unknown> {
  return (
    typeof packet === 'object' &&
    packet !== null &&
    (packet as Record<string, unknown>).type === type
  );
}

function isPeerSummary(value: unknown): value is PeerSummary {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return typeof p.id === 'string' && typeof p.nickname === 'string';
}

export function isCallOffer(packet: unknown): packet is CallOfferPacket {
  if (!isObjectWith(packet, 'CALL_OFFER')) return false;
  return (
    typeof packet.callId === 'string' &&
    isPeerSummary(packet.from) &&
    typeof packet.mediaPort === 'number' &&
    typeof packet.key === 'string' &&
    packet.key.length === 64 &&
    /^[0-9a-f]+$/i.test(packet.key)
  );
}

export function isCallAccept(packet: unknown): packet is CallAcceptPacket {
  if (!isObjectWith(packet, 'CALL_ACCEPT')) return false;
  return (
    typeof packet.callId === 'string' &&
    isPeerSummary(packet.from) &&
    typeof packet.mediaPort === 'number'
  );
}

export function isCallReject(packet: unknown): packet is CallRejectPacket {
  if (!isObjectWith(packet, 'CALL_REJECT')) return false;
  return typeof packet.callId === 'string';
}

export function isCallBusy(packet: unknown): packet is CallBusyPacket {
  if (!isObjectWith(packet, 'CALL_BUSY')) return false;
  return typeof packet.callId === 'string';
}

export function isCallEnd(packet: unknown): packet is CallEndPacket {
  if (!isObjectWith(packet, 'CALL_END')) return false;
  return typeof packet.callId === 'string';
}
