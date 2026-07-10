// Framing behavior: partial reads, multiple frames per chunk, oversize rejection.

import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeJsonFrame, FrameDecoder, MAX_FRAME_BODY } from '../src/framing.js';

test('decoder reassembles a frame split across several chunks', () => {
  const frame = encodeJsonFrame({ type: 'MESSAGE', message: 'hi' });
  const decoder = new FrameDecoder();
  let out = decoder.push(frame.subarray(0, 3));
  assert.equal(out.length, 0, 'partial header yields nothing');
  out = decoder.push(frame.subarray(3, 6));
  assert.equal(out.length, 0, 'still incomplete');
  out = decoder.push(frame.subarray(6));
  assert.equal(out.length, 1, 'completes once all bytes arrive');
});

test('decoder yields multiple frames from one chunk in order', () => {
  const a = encodeJsonFrame({ type: 'PING', n: 1 });
  const b = encodeJsonFrame({ type: 'PING', n: 2 });
  const decoder = new FrameDecoder();
  const out = decoder.push(Buffer.concat([a, b]));
  assert.equal(out.length, 2);
  assert.deepEqual(JSON.parse(out[0].body.toString()), { type: 'PING', n: 1 });
  assert.deepEqual(JSON.parse(out[1].body.toString()), { type: 'PING', n: 2 });
});

test('decoder rejects a frame claiming more than the max body size', () => {
  const header = Buffer.alloc(5);
  header.writeUInt32BE(MAX_FRAME_BODY + 1, 0);
  header.writeUInt8(1, 4);
  const decoder = new FrameDecoder();
  assert.throws(() => decoder.push(header), /exceeds max/);
});
