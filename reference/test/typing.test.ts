// Tests for typing module

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildTyping, buildStopTyping, isTyping, isStopTyping } from '../src/typing.js';

describe('typing module', () => {
  describe('buildTyping', () => {
    it('creates a TYPING packet with version', () => {
      const packet = buildTyping();
      assert.strictEqual(packet.v, '1.0');
      assert.strictEqual(packet.type, 'TYPING');
    });
  });

  describe('buildStopTyping', () => {
    it('creates a STOP_TYPING packet with version', () => {
      const packet = buildStopTyping();
      assert.strictEqual(packet.v, '1.0');
      assert.strictEqual(packet.type, 'STOP_TYPING');
    });
  });

  describe('isTyping', () => {
    it('returns true for valid TYPING packet', () => {
      assert.strictEqual(isTyping(buildTyping()), true);
    });

    it('returns false for STOP_TYPING packet', () => {
      assert.strictEqual(isTyping(buildStopTyping()), false);
    });

    it('returns false for null', () => {
      assert.strictEqual(isTyping(null), false);
    });

    it('returns false for non-object', () => {
      assert.strictEqual(isTyping('TYPING'), false);
    });
  });

  describe('isStopTyping', () => {
    it('returns true for valid STOP_TYPING packet', () => {
      assert.strictEqual(isStopTyping(buildStopTyping()), true);
    });

    it('returns false for TYPING packet', () => {
      assert.strictEqual(isStopTyping(buildTyping()), false);
    });

    it('returns false for null', () => {
      assert.strictEqual(isStopTyping(null), false);
    });
  });
});
