// Conformance: the reference library MUST reproduce every value in the
// language-independent vectors. This is what proves @lncp/core speaks LNCP/1.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { keyPairFromSeed, encodePublicKey } from '../src/identity.js';
import { canonicalizeBeacon, signBeacon, verifyBeaconSignature, TrustStore, type BeaconSignedFields } from '../src/security.js';
import { buildBeacon, parseBeacon, verifyBeacon } from '../src/discovery.js';
import { buildMessage } from '../src/messaging.js';
import { encodeJsonFrame, FrameDecoder, decodeJsonFrame } from '../src/framing.js';

const here = dirname(fileURLToPath(import.meta.url));
const vectors = JSON.parse(readFileSync(join(here, '..', '..', 'vectors', 'vectors.json'), 'utf8'));

const seed = Buffer.from(vectors.identity.seedHex, 'hex');
const { privateKey, publicKey } = keyPairFromSeed(seed);

test('identity: public key derivation matches vector', () => {
  assert.equal(encodePublicKey(publicKey), vectors.identity.publicKeyB64);
});

test('security: canonical signing string matches vector', () => {
  const b = vectors.discoveryBeacon;
  const fields: BeaconSignedFields = {
    discriminator: b.inputs.discriminator,
    fingerprint: b.inputs.fingerprint,
    id: b.inputs.id,
    nickname: b.inputs.nickname,
    port: b.inputs.port,
    publicKey: vectors.identity.publicKeyB64,
    space: b.inputs.space,
    timestamp: b.inputs.timestamp,
  };
  assert.equal(canonicalizeBeacon(fields, true), b.canonicalSignInput);
  assert.equal(signBeacon(fields, privateKey), b.signatureB64);
});

test('discovery: buildBeacon reproduces the exact wire packet and bytes', () => {
  const b = vectors.discoveryBeacon;
  const beacon = buildBeacon(
    {
      id: b.inputs.id,
      nickname: b.inputs.nickname,
      discriminator: b.inputs.discriminator,
      port: b.inputs.port,
      fingerprint: b.inputs.fingerprint,
      space: b.inputs.space,
      timestamp: b.inputs.timestamp,
    },
    privateKey,
    publicKey,
  );
  assert.deepEqual(beacon, b.wirePacketJson);
  assert.equal(Buffer.from(JSON.stringify(beacon)).toString('hex'), b.wirePacketBytesHex);
});

test('discovery: signature verifies and full pipeline accepts the beacon', () => {
  const packet = parseBeacon(Buffer.from(vectors.discoveryBeacon.wirePacketBytesHex, 'hex'));
  assert.ok(packet, 'beacon should parse');
  assert.equal(verifyBeaconSignature(packet!), true);

  const trust = new TrustStore();
  const res = verifyBeacon(packet!, {
    realm: '',
    now: vectors.discoveryBeacon.inputs.timestamp, // within replay window
    trustStore: trust,
  });
  assert.equal(res.ok, true);
  assert.equal(res.reason, 'ok');
  // Second observation of the same key still matches (TOFU).
  assert.equal(trust.check(packet!.id as string, packet!.publicKey as string), 'match');
});

test('messaging/framing: MESSAGE frame reproduces the exact wire bytes', () => {
  const env = vectors.streamMessageFrame.envelope;
  const msg = buildMessage({ from: env.from, message: env.message, id: env.id, v: env.v });
  assert.deepEqual(msg, env);

  const frame = encodeJsonFrame(msg);
  assert.equal(frame.toString('hex'), vectors.streamMessageFrame.frameBytesHex);
});

test('framing: decoder round-trips the MESSAGE frame', () => {
  const bytes = Buffer.from(vectors.streamMessageFrame.frameBytesHex, 'hex');
  const decoder = new FrameDecoder();
  const frames = decoder.push(bytes);
  assert.equal(frames.length, 1);
  assert.equal(frames[0].contentType, 1);
  const decoded = decodeJsonFrame(frames[0]) as { type: string };
  assert.equal(decoded.type, 'MESSAGE');
});
