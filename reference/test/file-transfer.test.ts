// Tests for file-transfer module

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildFileOffer,
  buildFileAccept,
  buildFileReject,
  buildFileReady,
  buildFileCancel,
  buildFilePause,
  buildFileResumeRequest,
  buildFileResume,
  generateTransferId,
  isFileOffer,
  isFileAccept,
  isFileReject,
  isFileReady,
  isFileCancel,
  isFilePause,
  isFileResumeRequest,
  isFileResume,
} from '../src/file-transfer.js';

describe('file-transfer module', () => {
  const transferId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  describe('generateTransferId', () => {
    it('generates a UUID v4', () => {
      const id = generateTransferId();
      assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('generates unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateTransferId());
      }
      assert.strictEqual(ids.size, 100);
    });
  });

  describe('buildFileOffer', () => {
    it('creates a FILE_OFFER with required fields', () => {
      const packet = buildFileOffer('document.pdf', 1024);
      assert.strictEqual(packet.v, '1.0');
      assert.strictEqual(packet.type, 'FILE_OFFER');
      assert.strictEqual(packet.filename, 'document.pdf');
      assert.strictEqual(packet.size, 1024);
      assert.ok(packet.id);
    });

    it('creates a FILE_OFFER with optional fields', () => {
      const packet = buildFileOffer('test.txt', 2048, {
        id: transferId,
        hash: 'sha256:abc123',
        chunkSize: 65536,
      });
      assert.strictEqual(packet.id, transferId);
      assert.strictEqual(packet.hash, 'sha256:abc123');
      assert.strictEqual(packet.chunkSize, 65536);
    });
  });

  describe('buildFileAccept', () => {
    it('creates a FILE_ACCEPT with required fields', () => {
      const packet = buildFileAccept(transferId);
      assert.strictEqual(packet.v, '1.0');
      assert.strictEqual(packet.type, 'FILE_ACCEPT');
      assert.strictEqual(packet.re, transferId);
    });

    it('creates a FILE_ACCEPT with chunkSize', () => {
      const packet = buildFileAccept(transferId, 32768);
      assert.strictEqual(packet.chunkSize, 32768);
    });
  });

  describe('buildFileReject', () => {
    it('creates a FILE_REJECT with required fields', () => {
      const packet = buildFileReject(transferId);
      assert.strictEqual(packet.v, '1.0');
      assert.strictEqual(packet.type, 'FILE_REJECT');
      assert.strictEqual(packet.re, transferId);
    });

    it('creates a FILE_REJECT with reason', () => {
      const packet = buildFileReject(transferId, 'busy');
      assert.strictEqual(packet.reason, 'busy');
    });
  });

  describe('buildFileReady', () => {
    it('creates a FILE_READY packet', () => {
      const packet = buildFileReady(transferId);
      assert.strictEqual(packet.v, '1.0');
      assert.strictEqual(packet.type, 'FILE_READY');
      assert.strictEqual(packet.re, transferId);
    });
  });

  describe('buildFileCancel', () => {
    it('creates a FILE_CANCEL with required fields', () => {
      const packet = buildFileCancel(transferId);
      assert.strictEqual(packet.v, '1.0');
      assert.strictEqual(packet.type, 'FILE_CANCEL');
      assert.strictEqual(packet.re, transferId);
    });

    it('creates a FILE_CANCEL with reason', () => {
      const packet = buildFileCancel(transferId, 'user_cancelled');
      assert.strictEqual(packet.reason, 'user_cancelled');
    });
  });

  describe('buildFilePause', () => {
    it('creates a FILE_PAUSE packet', () => {
      const packet = buildFilePause(transferId);
      assert.strictEqual(packet.v, '1.0');
      assert.strictEqual(packet.type, 'FILE_PAUSE');
      assert.strictEqual(packet.re, transferId);
    });
  });

  describe('buildFileResumeRequest', () => {
    it('creates a FILE_RESUME_REQUEST without offset', () => {
      const packet = buildFileResumeRequest(transferId);
      assert.strictEqual(packet.v, '1.0');
      assert.strictEqual(packet.type, 'FILE_RESUME_REQUEST');
      assert.strictEqual(packet.re, transferId);
      assert.strictEqual('offset' in packet, false);
    });

    it('creates a FILE_RESUME_REQUEST with offset', () => {
      const packet = buildFileResumeRequest(transferId, 1024);
      assert.strictEqual(packet.offset, 1024);
    });
  });

  describe('buildFileResume', () => {
    it('creates a FILE_RESUME packet', () => {
      const packet = buildFileResume(transferId, 2048);
      assert.strictEqual(packet.v, '1.0');
      assert.strictEqual(packet.type, 'FILE_RESUME');
      assert.strictEqual(packet.re, transferId);
      assert.strictEqual(packet.offset, 2048);
    });
  });

  describe('type guards', () => {
    it('isFileOffer validates correctly', () => {
      assert.strictEqual(isFileOffer(buildFileOffer('test', 100)), true);
      assert.strictEqual(isFileOffer(buildFileAccept(transferId)), false);
      assert.strictEqual(isFileOffer(null), false);
    });

    it('isFileAccept validates correctly', () => {
      assert.strictEqual(isFileAccept(buildFileAccept(transferId)), true);
      assert.strictEqual(isFileAccept(buildFileOffer('test', 100)), false);
    });

    it('isFileReject validates correctly', () => {
      assert.strictEqual(isFileReject(buildFileReject(transferId)), true);
      assert.strictEqual(isFileReject(buildFileAccept(transferId)), false);
    });

    it('isFileReady validates correctly', () => {
      assert.strictEqual(isFileReady(buildFileReady(transferId)), true);
      assert.strictEqual(isFileReady(buildFileCancel(transferId)), false);
    });

    it('isFileCancel validates correctly', () => {
      assert.strictEqual(isFileCancel(buildFileCancel(transferId)), true);
      assert.strictEqual(isFileCancel(buildFileReady(transferId)), false);
    });

    it('isFilePause validates correctly', () => {
      assert.strictEqual(isFilePause(buildFilePause(transferId)), true);
      assert.strictEqual(isFilePause(buildFileCancel(transferId)), false);
    });

    it('isFileResumeRequest validates correctly', () => {
      assert.strictEqual(isFileResumeRequest(buildFileResumeRequest(transferId)), true);
      assert.strictEqual(isFileResumeRequest(buildFileResume(transferId, 0)), false);
    });

    it('isFileResume validates correctly', () => {
      assert.strictEqual(isFileResume(buildFileResume(transferId, 100)), true);
      assert.strictEqual(isFileResume(buildFileResumeRequest(transferId)), false);
    });
  });
});
