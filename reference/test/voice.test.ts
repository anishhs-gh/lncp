// Tests for voice module

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildCallOffer,
  buildCallAccept,
  buildCallReject,
  buildCallBusy,
  buildCallEnd,
  generateCallId,
  generateMediaKey,
  isCallOffer,
  isCallAccept,
  isCallReject,
  isCallBusy,
  isCallEnd,
} from '../src/voice.js';
import type { PeerSummary } from '../src/envelope.js';

describe('voice module', () => {
  const callId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const peer: PeerSummary = { id: 'peer-id-123', nickname: 'alice', discriminator: 'a1b2' };

  describe('generateCallId', () => {
    it('generates a UUID v4', () => {
      const id = generateCallId();
      assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('generates unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateCallId());
      }
      assert.strictEqual(ids.size, 100);
    });
  });

  describe('generateMediaKey', () => {
    it('generates a 32-byte key', () => {
      const key = generateMediaKey();
      assert.strictEqual(key.length, 32);
    });

    it('generates unique keys', () => {
      const keys = new Set<string>();
      for (let i = 0; i < 100; i++) {
        keys.add(generateMediaKey().toString('hex'));
      }
      assert.strictEqual(keys.size, 100);
    });
  });

  describe('buildCallOffer', () => {
    it('creates a CALL_OFFER with required fields', () => {
      const mediaKey = generateMediaKey();
      const packet = buildCallOffer(peer, 49152, mediaKey);
      assert.strictEqual(packet.v, '1.0');
      assert.strictEqual(packet.type, 'CALL_OFFER');
      assert.ok(packet.callId);
      assert.deepStrictEqual(packet.from, peer);
      assert.strictEqual(packet.mediaPort, 49152);
      assert.strictEqual(packet.key, mediaKey.toString('hex'));
      assert.strictEqual(packet.key.length, 64);
    });

    it('creates a CALL_OFFER with explicit callId', () => {
      const mediaKey = generateMediaKey();
      const packet = buildCallOffer(peer, 49153, mediaKey, callId);
      assert.strictEqual(packet.callId, callId);
    });
  });

  describe('buildCallAccept', () => {
    it('creates a CALL_ACCEPT with required fields', () => {
      const packet = buildCallAccept(callId, peer, 49154);
      assert.strictEqual(packet.v, '1.0');
      assert.strictEqual(packet.type, 'CALL_ACCEPT');
      assert.strictEqual(packet.callId, callId);
      assert.deepStrictEqual(packet.from, peer);
      assert.strictEqual(packet.mediaPort, 49154);
    });
  });

  describe('buildCallReject', () => {
    it('creates a CALL_REJECT packet', () => {
      const packet = buildCallReject(callId);
      assert.strictEqual(packet.v, '1.0');
      assert.strictEqual(packet.type, 'CALL_REJECT');
      assert.strictEqual(packet.callId, callId);
    });
  });

  describe('buildCallBusy', () => {
    it('creates a CALL_BUSY packet', () => {
      const packet = buildCallBusy(callId);
      assert.strictEqual(packet.v, '1.0');
      assert.strictEqual(packet.type, 'CALL_BUSY');
      assert.strictEqual(packet.callId, callId);
    });
  });

  describe('buildCallEnd', () => {
    it('creates a CALL_END packet', () => {
      const packet = buildCallEnd(callId);
      assert.strictEqual(packet.v, '1.0');
      assert.strictEqual(packet.type, 'CALL_END');
      assert.strictEqual(packet.callId, callId);
    });
  });

  describe('type guards', () => {
    const mediaKey = generateMediaKey();

    it('isCallOffer validates correctly', () => {
      assert.strictEqual(isCallOffer(buildCallOffer(peer, 49152, mediaKey)), true);
      assert.strictEqual(isCallOffer(buildCallAccept(callId, peer, 49152)), false);
      assert.strictEqual(isCallOffer(null), false);
    });

    it('isCallOffer rejects invalid key format', () => {
      const invalidPacket = {
        v: '1.0',
        type: 'CALL_OFFER',
        callId,
        from: peer,
        mediaPort: 49152,
        key: 'not-hex!',
      };
      assert.strictEqual(isCallOffer(invalidPacket), false);
    });

    it('isCallOffer rejects wrong key length', () => {
      const invalidPacket = {
        v: '1.0',
        type: 'CALL_OFFER',
        callId,
        from: peer,
        mediaPort: 49152,
        key: 'abc123', // too short
      };
      assert.strictEqual(isCallOffer(invalidPacket), false);
    });

    it('isCallAccept validates correctly', () => {
      assert.strictEqual(isCallAccept(buildCallAccept(callId, peer, 49152)), true);
      assert.strictEqual(isCallAccept(buildCallOffer(peer, 49152, mediaKey)), false);
    });

    it('isCallReject validates correctly', () => {
      assert.strictEqual(isCallReject(buildCallReject(callId)), true);
      assert.strictEqual(isCallReject(buildCallBusy(callId)), false);
    });

    it('isCallBusy validates correctly', () => {
      assert.strictEqual(isCallBusy(buildCallBusy(callId)), true);
      assert.strictEqual(isCallBusy(buildCallReject(callId)), false);
    });

    it('isCallEnd validates correctly', () => {
      assert.strictEqual(isCallEnd(buildCallEnd(callId)), true);
      assert.strictEqual(isCallEnd(buildCallReject(callId)), false);
    });
  });
});
