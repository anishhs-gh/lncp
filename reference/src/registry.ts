// LNCP/1 registry constants — mirrors spec/lncp-1/registry.md.
// The single source of truth for reserved values in code form.

/** Current protocol version this library implements. */
export const LNCP_VERSION = '1.0';

/** Packet type names. String names are canonical in LNCP/1's JSON encoding. */
export const PacketType = {
  // Core (0x00xx)
  HELLO: 'HELLO',
  GOODBYE: 'GOODBYE',
  SESSION_HELLO: 'SESSION_HELLO',
  PING: 'PING',
  PONG: 'PONG',
  ERROR: 'ERROR',
  CAPABILITIES: 'CAPABILITIES',
  // Messaging module (0x0100-0x010F)
  MESSAGE: 'MESSAGE',
  MESSAGE_ACK: 'MESSAGE_ACK',
  // Typing module (0x0110-0x011F)
  TYPING: 'TYPING',
  STOP_TYPING: 'STOP_TYPING',
  // Presence module (0x0120-0x012F)
  PRESENCE: 'PRESENCE',
  // File-transfer module (0x0200-0x02FF)
  FILE_OFFER: 'FILE_OFFER',
  FILE_ACCEPT: 'FILE_ACCEPT',
  FILE_REJECT: 'FILE_REJECT',
  FILE_READY: 'FILE_READY',
  FILE_CANCEL: 'FILE_CANCEL',
  FILE_PAUSE: 'FILE_PAUSE',
  FILE_RESUME: 'FILE_RESUME',
  FILE_RESUME_REQUEST: 'FILE_RESUME_REQUEST',
  // Voice module (0x0300-0x03FF)
  CALL_OFFER: 'CALL_OFFER',
  CALL_ACCEPT: 'CALL_ACCEPT',
  CALL_REJECT: 'CALL_REJECT',
  CALL_BUSY: 'CALL_BUSY',
  CALL_END: 'CALL_END',
} as const;
export type PacketTypeName = (typeof PacketType)[keyof typeof PacketType];

/** Numeric type codes, reserved for future binary encodings (registry §1.2). */
export const TypeCode: Record<string, number> = {
  // Core (0x00xx)
  HELLO: 0x0001,
  GOODBYE: 0x0002,
  SESSION_HELLO: 0x0003,
  PING: 0x0020,
  PONG: 0x0021,
  ERROR: 0x0050,
  CAPABILITIES: 0x0060,
  // Messaging module (0x0100-0x010F)
  MESSAGE: 0x0100,
  MESSAGE_ACK: 0x0101,
  // Typing module (0x0110-0x011F)
  TYPING: 0x0110,
  STOP_TYPING: 0x0111,
  // Presence module (0x0120-0x012F)
  PRESENCE: 0x0120,
  // File-transfer module (0x0200-0x02FF)
  FILE_OFFER: 0x0200,
  FILE_ACCEPT: 0x0201,
  FILE_REJECT: 0x0202,
  FILE_READY: 0x0203,
  FILE_CANCEL: 0x0204,
  FILE_PAUSE: 0x0205,
  FILE_RESUME: 0x0206,
  FILE_RESUME_REQUEST: 0x0207,
  // Voice module (0x0300-0x03FF)
  CALL_OFFER: 0x0300,
  CALL_ACCEPT: 0x0301,
  CALL_REJECT: 0x0302,
  CALL_BUSY: 0x0303,
  CALL_END: 0x0304,
};

/** Frame body content types (registry §3). */
export const ContentType = {
  JSON: 1,
  CBOR: 2, // reserved, not implemented in LNCP/1
} as const;

/** Default port ranges (registry §2). */
export const Ports = {
  DISCOVERY_START: 41234,
  DISCOVERY_COUNT: 5,
  SESSION_START: 9000,
  SESSION_COUNT: 10,
} as const;

/** Capability names (registry §4). */
export const Capability = {
  MESSAGING: 'messaging',
  TYPING: 'typing',
  PRESENCE: 'presence',
  BROADCAST: 'broadcast',
  FILE_TRANSFER: 'file-transfer',
  COMPRESSION: 'compression',
  VOICE: 'voice',
  VIDEO: 'video',
  EXTENSIONS: 'extensions',
} as const;

/** Error codes (registry §5). */
export const ErrorCode = {
  UNKNOWN_PACKET: 1000,
  INVALID_PACKET: 1001,
  AUTH_FAILED: 1002,
  UNSUPPORTED_VERSION: 1003,
  UNKNOWN_PEER: 1004,
  TIMEOUT: 1005,
  CANCELLED: 1006,
  PERMISSION_DENIED: 1007,
  INVALID_CAPABILITY: 1008,
  INTEGRITY_FAILURE: 1009,
} as const;
