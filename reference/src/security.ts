// LNCP/1 security — mirrors spec/lncp-1/04-security.md.

import crypto, { KeyObject } from 'node:crypto';
import { decodePublicKey } from './identity.js';

/** Maximum clock drift for a signed beacon, in ms (spec §1.3). */
export const REPLAY_WINDOW_MS = 30_000;

/** The beacon fields that are covered by the signature (spec §1.1). */
export interface BeaconSignedFields {
  discriminator: string;
  fingerprint: string | null;
  id: string;
  nickname: string;
  port: number;
  publicKey: string;
  space: string;
  timestamp: number;
}

/**
 * Build the canonical signing string: a compact JSON object whose keys are in
 * strict ascending byte order, excluding `type` and `signature`.
 *
 * `includeSpace=false` reproduces the pre-realm layout used by older peers that
 * omit the field entirely; verifiers pass whether the received packet carried
 * `space` so signatures from both eras validate (spec §1.1, discovery §2.4).
 */
export function canonicalizeBeacon(
  f: BeaconSignedFields,
  includeSpace = true,
): string {
  const ordered: Record<string, unknown> = {
    discriminator: f.discriminator,
    fingerprint: f.fingerprint,
    id: f.id,
    nickname: f.nickname,
    port: f.port,
    publicKey: f.publicKey,
    ...(includeSpace ? { space: f.space } : {}),
    timestamp: f.timestamp,
  };
  return JSON.stringify(ordered);
}

/** Sign the canonical beacon string with an Ed25519 private key → base64. */
export function signBeacon(fields: BeaconSignedFields, privateKey: KeyObject): string {
  const canonical = canonicalizeBeacon(fields, true);
  return crypto.sign(null, Buffer.from(canonical), privateKey).toString('base64');
}

/** True if `timestamp` (ms epoch) is within the replay window of `now`. */
export function isWithinReplayWindow(timestamp: number, now: number = Date.now()): boolean {
  return Math.abs(now - timestamp) <= REPLAY_WINDOW_MS;
}

/**
 * Verify a signed beacon packet's Ed25519 signature. Reconstructs the canonical
 * string using the same conditional-`space` rule the wire format requires.
 * Returns false on any malformation rather than throwing.
 */
export function verifyBeaconSignature(packet: Record<string, unknown>): boolean {
  if (typeof packet.publicKey !== 'string' || typeof packet.signature !== 'string') return false;
  const fields: BeaconSignedFields = {
    discriminator: packet.discriminator as string,
    fingerprint: (packet.fingerprint ?? null) as string | null,
    id: packet.id as string,
    nickname: packet.nickname as string,
    port: packet.port as number,
    publicKey: packet.publicKey,
    space: (packet.space ?? '') as string,
    timestamp: packet.timestamp as number,
  };
  const canonical = canonicalizeBeacon(fields, packet.space !== undefined);
  try {
    const pub = decodePublicKey(packet.publicKey);
    return crypto.verify(null, Buffer.from(canonical), pub, Buffer.from(packet.signature, 'base64'));
  } catch {
    return false;
  }
}

export type TrustStatus = 'unknown' | 'match' | 'conflict';

/**
 * Trust-On-First-Use store mapping Peer ID → identity public key (spec §3).
 * In-memory here; a real deployment persists it (implementations MUST persist).
 */
export class TrustStore {
  private keys = new Map<string, string>();

  /** Classify a (peerId, publicKey) pair without mutating state. */
  check(peerId: string, publicKey: string): TrustStatus {
    const known = this.keys.get(peerId);
    if (known === undefined) return 'unknown';
    return known === publicKey ? 'match' : 'conflict';
  }

  /**
   * Record trust for a peer on first use. MUST NOT be used to overwrite an
   * existing, differing key — that is a conflict the caller resolves explicitly.
   */
  trust(peerId: string, publicKey: string): void {
    const known = this.keys.get(peerId);
    if (known !== undefined && known !== publicKey) {
      throw new Error('refusing to silently replace a trusted key (conflict)');
    }
    this.keys.set(peerId, publicKey);
  }

  /** Deliberate, explicit key replacement (e.g. after user confirmation). */
  replace(peerId: string, publicKey: string): void {
    this.keys.set(peerId, publicKey);
  }
}

/** Compare a peer's presented certificate DER against an expected fingerprint. */
export function verifyFingerprint(certDer: Buffer, expected: string | null): boolean {
  if (!expected) return true; // no pinning requested
  return crypto.createHash('sha256').update(certDer).digest('hex') === expected;
}
