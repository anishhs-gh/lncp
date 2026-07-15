// Tests for presence module

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildPresence, isPresence, PRESENCE_STATUSES, PresenceStatus } from '../src/presence.js';

describe('presence module', () => {
  describe('buildPresence', () => {
    it('creates a PRESENCE packet with required fields', () => {
      const packet = buildPresence('online');
      assert.strictEqual(packet.v, '1.0');
      assert.strictEqual(packet.type, 'PRESENCE');
      assert.strictEqual(packet.status, 'online');
      assert.strictEqual('message' in packet, false);
    });

    it('creates a PRESENCE packet with message', () => {
      const packet = buildPresence('busy', 'in a meeting');
      assert.strictEqual(packet.status, 'busy');
      assert.strictEqual(packet.message, 'in a meeting');
    });

    it('accepts all valid status values', () => {
      const statuses: PresenceStatus[] = ['online', 'away', 'busy', 'offline'];
      for (const status of statuses) {
        const packet = buildPresence(status);
        assert.strictEqual(packet.status, status);
      }
    });
  });

  describe('isPresence', () => {
    it('returns true for valid PRESENCE packet', () => {
      assert.strictEqual(isPresence(buildPresence('online')), true);
    });

    it('returns true for PRESENCE with message', () => {
      assert.strictEqual(isPresence(buildPresence('away', 'lunch')), true);
    });

    it('returns false for invalid status', () => {
      assert.strictEqual(
        isPresence({ v: '1.0', type: 'PRESENCE', status: 'invalid' }),
        false
      );
    });

    it('returns false for missing status', () => {
      assert.strictEqual(
        isPresence({ v: '1.0', type: 'PRESENCE' }),
        false
      );
    });

    it('returns false for wrong type', () => {
      assert.strictEqual(isPresence({ type: 'MESSAGE' }), false);
    });

    it('returns false for null', () => {
      assert.strictEqual(isPresence(null), false);
    });
  });

  describe('PRESENCE_STATUSES', () => {
    it('contains all valid statuses', () => {
      assert.deepStrictEqual(PRESENCE_STATUSES, ['online', 'away', 'busy', 'offline']);
    });
  });
});
