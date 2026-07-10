// LNCP/1 registry constants — mirrors spec/lncp-1/registry.md.
// The single source of truth for reserved values in code form.

/** Current protocol version this library implements. */
export const LNCP_VERSION = '1.0';

/** Packet type names. String names are canonical in LNCP/1's JSON encoding. */
export const PacketType = {
  HELLO: 'HELLO',
  GOODBYE: 'GOODBYE',
  SESSION_HELLO: 'SESSION_HELLO',
  PING: 'PING',
  PONG: 'PONG',
  ERROR: 'ERROR',
  CAPABILITIES: 'CAPABILITIES',
  MESSAGE: 'MESSAGE',
  MESSAGE_ACK: 'MESSAGE_ACK',
} as const;
export type PacketTypeName = (typeof PacketType)[keyof typeof PacketType];

/** Numeric type codes, reserved for future binary encodings (registry §1.2). */
export const TypeCode: Record<string, number> = {
  HELLO: 0x0001,
  GOODBYE: 0x0002,
  SESSION_HELLO: 0x0003,
  PING: 0x0020,
  PONG: 0x0021,
  ERROR: 0x0050,
  CAPABILITIES: 0x0060,
  MESSAGE: 0x0100,
  MESSAGE_ACK: 0x0101,
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
