// LNCP/1 identity — mirrors spec/lncp-1/03-identity.md.

import crypto, { KeyObject } from 'node:crypto';
import { randomUUID } from 'node:crypto';

/** Fixed ASN.1 prefix for a PKCS8-wrapped Ed25519 private key: header || 32-byte seed. */
const PKCS8_ED25519_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');

export interface Identity {
  /** Permanent Peer ID (UUID). */
  peerId: string;
  /** Ed25519 identity key pair. */
  privateKey: KeyObject;
  publicKey: KeyObject;
}

/**
 * Derive a deterministic Ed25519 key pair from a 32-byte seed. Given the same
 * seed, every LNCP implementation (any language) MUST produce the same keys;
 * this is what makes the conformance vectors reproducible.
 */
export function keyPairFromSeed(seed: Buffer): { privateKey: KeyObject; publicKey: KeyObject } {
  if (seed.length !== 32) throw new Error('Ed25519 seed must be 32 bytes');
  const pkcs8 = Buffer.concat([PKCS8_ED25519_PREFIX, seed]);
  const privateKey = crypto.createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' });
  const publicKey = crypto.createPublicKey(privateKey);
  return { privateKey, publicKey };
}

/** Mint a fresh identity: random Peer ID + random Ed25519 key pair. */
export function generateIdentity(): Identity {
  const { privateKey, publicKey } = keyPairFromSeed(crypto.randomBytes(32));
  return { peerId: randomUUID(), privateKey, publicKey };
}

/** Base64 SPKI DER encoding of an Ed25519 public key (the on-wire `publicKey`). */
export function encodePublicKey(publicKey: KeyObject): string {
  return publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
}

/** Reconstruct a public KeyObject from its base64 SPKI DER wire form. */
export function decodePublicKey(publicKeyB64: string): KeyObject {
  return crypto.createPublicKey({
    key: Buffer.from(publicKeyB64, 'base64'),
    format: 'der',
    type: 'spki',
  });
}

/** Deterministic 4-char discriminator: Peer ID, hyphens removed, first 4 chars. */
export function deriveDiscriminator(peerId: string): string {
  return peerId.replace(/-/g, '').slice(0, 4);
}

/** Lowercase hex SHA-256 of a DER-encoded certificate (the fingerprint). */
export function certFingerprint(der: Buffer): string {
  return crypto.createHash('sha256').update(der).digest('hex');
}
