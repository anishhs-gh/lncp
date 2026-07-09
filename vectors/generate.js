'use strict';

// LNCP/1 conformance test-vector generator.
//
// Deterministic: every value below is fixed, so re-running this script MUST
// reproduce vectors.json byte-for-byte. The identity key is derived from a
// fixed 32-byte seed via the standard PKCS8 Ed25519 wrapper, so the same
// public key and signatures come out on every machine and every language.
//
//   node generate.js            # prints vectors.json to stdout
//   node generate.js > vectors.json

const crypto = require('crypto');

// ── Fixed identity seed ──────────────────────────────────────────────────────
// 32-byte Ed25519 seed. PKCS8 DER = fixed ASN.1 prefix || seed.
const SEED = Buffer.from(
  '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
  'hex'
);
const PKCS8_ED25519_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');
const pkcs8 = Buffer.concat([PKCS8_ED25519_PREFIX, SEED]);

const privateKey = crypto.createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' });
const publicKey  = crypto.createPublicKey(privateKey);
const publicKeyB64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');

// ── Fixed beacon (HELLO) inputs ──────────────────────────────────────────────
const beacon = {
  id:            '9f8b7c6d-1e2f-4a3b-8c9d-0e1f2a3b4c5d',
  nickname:      'alice',
  discriminator: 'a1b2',
  port:          9000,
  fingerprint:   'a'.repeat(64), // stand-in SHA-256 hex of the TLS cert
  space:         '',
  timestamp:     1751000000000,
};

// Canonical signing input: JSON with keys in strict ascending byte order,
// excluding `type` and `signature`. This exact string is what gets signed and
// what a verifier reconstructs. (See spec/lncp-1/04-security.md §Canonicalization.)
const canonical = JSON.stringify({
  discriminator: beacon.discriminator,
  fingerprint:   beacon.fingerprint,
  id:            beacon.id,
  nickname:      beacon.nickname,
  port:          beacon.port,
  publicKey:     publicKeyB64,
  space:         beacon.space,
  timestamp:     beacon.timestamp,
});

const signature = crypto
  .sign(null, Buffer.from(canonical), privateKey)
  .toString('base64');

// Full HELLO datagram as it appears on the wire (UDP payload).
const helloPacket = {
  type: 'HELLO',
  ...beacon,
  publicKey: publicKeyB64,
  signature,
};

// ── Framed MESSAGE vector (stream transport) ─────────────────────────────────
// Envelope is a JSON object; on a stream it is wrapped in one length-prefixed
// frame: [uint32 BE payloadLength][uint8 contentType=1(json)][payload bytes].
const messageEnvelope = {
  v:    '1.0',
  type: 'MESSAGE',
  id:   '11111111-2222-4333-8444-555555555555',
  from: { id: beacon.id, nickname: beacon.nickname, discriminator: beacon.discriminator },
  message: 'hello world',
};
const messageBody = Buffer.from(JSON.stringify(messageEnvelope));
const CONTENT_TYPE_JSON = 1;
const frameHeader = Buffer.alloc(5);
frameHeader.writeUInt32BE(messageBody.length, 0);
frameHeader.writeUInt8(CONTENT_TYPE_JSON, 4);
const messageFrame = Buffer.concat([frameHeader, messageBody]);

// ── Emit ─────────────────────────────────────────────────────────────────────
const out = {
  note: 'LNCP/1 conformance vectors. Regenerate with: node generate.js',
  identity: {
    seedHex:      SEED.toString('hex'),
    pkcs8Hex:     pkcs8.toString('hex'),
    publicKeyB64,
  },
  discoveryBeacon: {
    inputs:              beacon,
    canonicalSignInput:  canonical,
    signatureB64:        signature,
    wirePacketJson:      helloPacket,
    wirePacketBytesHex:  Buffer.from(JSON.stringify(helloPacket)).toString('hex'),
  },
  streamMessageFrame: {
    envelope:       messageEnvelope,
    contentType:    CONTENT_TYPE_JSON,
    bodyLength:     messageBody.length,
    frameBytesHex:  messageFrame.toString('hex'),
  },
};

process.stdout.write(JSON.stringify(out, null, 2) + '\n');
