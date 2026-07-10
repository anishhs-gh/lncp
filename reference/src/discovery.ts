// LNCP/1 discovery — mirrors spec/lncp-1/05-discovery.md (UDP beacon profile).

import { KeyObject } from 'node:crypto';
import { PacketType } from './registry.js';
import { encodePublicKey } from './identity.js';
import {
  BeaconSignedFields,
  signBeacon,
  verifyBeaconSignature,
  isWithinReplayWindow,
  TrustStore,
} from './security.js';

/** A HELLO beacon exactly as it appears on the wire. Field order matches the vectors. */
export interface Beacon {
  type: 'HELLO';
  id: string;
  nickname: string;
  discriminator: string;
  port: number;
  fingerprint: string | null;
  space: string;
  timestamp: number;
  publicKey: string;
  signature: string;
}

export interface BeaconInputs {
  id: string;
  nickname: string;
  discriminator: string;
  port: number;
  fingerprint: string | null;
  space?: string;
  timestamp?: number;
}

/** Build and sign a HELLO beacon. Key order matches the on-wire canonical form. */
export function buildBeacon(inputs: BeaconInputs, privateKey: KeyObject, publicKey: KeyObject): Beacon {
  const space = inputs.space ?? '';
  const timestamp = inputs.timestamp ?? Date.now();
  const publicKeyB64 = encodePublicKey(publicKey);

  const signed: BeaconSignedFields = {
    discriminator: inputs.discriminator,
    fingerprint: inputs.fingerprint,
    id: inputs.id,
    nickname: inputs.nickname,
    port: inputs.port,
    publicKey: publicKeyB64,
    space,
    timestamp,
  };
  const signature = signBeacon(signed, privateKey);

  return {
    type: PacketType.HELLO,
    id: inputs.id,
    nickname: inputs.nickname,
    discriminator: inputs.discriminator,
    port: inputs.port,
    fingerprint: inputs.fingerprint,
    space,
    timestamp,
    publicKey: publicKeyB64,
    signature,
  } as Beacon;
}

/** Parse a datagram payload into a HELLO packet, or null if not a valid-looking beacon. */
export function parseBeacon(payload: Buffer): Record<string, unknown> | null {
  let packet: Record<string, unknown>;
  try {
    packet = JSON.parse(payload.toString('utf8'));
  } catch {
    return null;
  }
  if (
    packet.type !== PacketType.HELLO ||
    typeof packet.id !== 'string' ||
    typeof packet.nickname !== 'string' ||
    typeof packet.port !== 'number'
  ) {
    return null;
  }
  return packet;
}

export interface VerifyOptions {
  /** Our own Peer ID, so we can drop self-echoes. */
  selfId?: string;
  /** Our realm; beacon is dropped unless its `space` matches. Default ''. */
  realm?: string;
  now?: number;
  trustStore?: TrustStore;
}

export type VerifyReason =
  | 'ok'
  | 'self'
  | 'realm-mismatch'
  | 'replayed'
  | 'bad-signature'
  | 'trust-conflict';

export interface VerifyResult {
  ok: boolean;
  reason: VerifyReason;
  packet: Record<string, unknown>;
}

/**
 * Apply the full receive pipeline of spec §2.4 to a parsed beacon: self-echo,
 * realm filter, replay window, signature, and TOFU trust. Returns a structured
 * result; on trust-conflict the caller surfaces a security warning.
 */
export function verifyBeacon(packet: Record<string, unknown>, opts: VerifyOptions = {}): VerifyResult {
  const realm = opts.realm ?? '';
  const fail = (reason: VerifyReason): VerifyResult => ({ ok: false, reason, packet });

  if (opts.selfId && packet.id === opts.selfId) return fail('self');
  if (((packet.space as string) ?? '') !== realm) return fail('realm-mismatch');

  // Signed beacons carry publicKey + signature; verify them fully.
  const signed = typeof packet.publicKey === 'string' && typeof packet.signature === 'string';
  if (signed) {
    if (typeof packet.timestamp !== 'number' || !isWithinReplayWindow(packet.timestamp, opts.now)) {
      return fail('replayed');
    }
    if (!verifyBeaconSignature(packet)) return fail('bad-signature');

    if (opts.trustStore) {
      const status = opts.trustStore.check(packet.id as string, packet.publicKey as string);
      if (status === 'conflict') return fail('trust-conflict');
      if (status === 'unknown') opts.trustStore.trust(packet.id as string, packet.publicKey as string);
    }
  }

  return { ok: true, reason: 'ok', packet };
}
