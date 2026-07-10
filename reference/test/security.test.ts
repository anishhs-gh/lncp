// Security behavior: replay window, TOFU trust conflict, tamper rejection.

import test from 'node:test';
import assert from 'node:assert/strict';
import { generateIdentity } from '../src/identity.js';
import { isWithinReplayWindow, REPLAY_WINDOW_MS, TrustStore } from '../src/security.js';
import { buildBeacon, parseBeacon, verifyBeacon } from '../src/discovery.js';

function beaconFor(id: string) {
  const idt = generateIdentity();
  const now = Date.now();
  const beacon = buildBeacon(
    { id, nickname: 'alice', discriminator: 'a1b2', port: 9000, fingerprint: null, space: '', timestamp: now },
    idt.privateKey,
    idt.publicKey,
  );
  return { beacon, idt, now };
}

test('replay window accepts fresh and rejects stale timestamps', () => {
  const now = 1_000_000_000_000;
  assert.equal(isWithinReplayWindow(now, now), true);
  assert.equal(isWithinReplayWindow(now - REPLAY_WINDOW_MS, now), true);
  assert.equal(isWithinReplayWindow(now - REPLAY_WINDOW_MS - 1, now), false);
  assert.equal(isWithinReplayWindow(now + REPLAY_WINDOW_MS + 1, now), false);
});

test('a valid signed beacon passes the full pipeline', () => {
  const { beacon, now } = beaconFor('11111111-1111-4111-8111-111111111111');
  const res = verifyBeacon(parseBeacon(Buffer.from(JSON.stringify(beacon)))!, { now, trustStore: new TrustStore() });
  assert.equal(res.ok, true);
});

test('a tampered beacon fails signature verification', () => {
  const { beacon, now } = beaconFor('22222222-2222-4222-8222-222222222222');
  beacon.nickname = 'mallory'; // change a signed field without re-signing
  const res = verifyBeacon(parseBeacon(Buffer.from(JSON.stringify(beacon)))!, { now });
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'bad-signature');
});

test('a changed key for a known Peer ID is a trust conflict', () => {
  const trust = new TrustStore();
  const id = '33333333-3333-4333-8333-333333333333';

  const first = beaconFor(id);
  assert.equal(verifyBeacon(parseBeacon(Buffer.from(JSON.stringify(first.beacon)))!, { now: first.now, trustStore: trust }).ok, true);

  // Same Peer ID, different identity key → impersonation signal.
  const second = beaconFor(id);
  const res = verifyBeacon(parseBeacon(Buffer.from(JSON.stringify(second.beacon)))!, { now: second.now, trustStore: trust });
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'trust-conflict');
});

test('realm filter drops beacons from a different realm', () => {
  const { beacon, now } = beaconFor('44444444-4444-4444-8444-444444444444');
  const res = verifyBeacon(parseBeacon(Buffer.from(JSON.stringify(beacon)))!, { now, realm: 'team-x' });
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'realm-mismatch');
});
