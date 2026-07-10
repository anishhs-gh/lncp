// @lncp/core — the LNCP/1 reference implementation.
//
// This library is the executable form of spec/lncp-1. It implements the
// protocol layers a peer needs to interoperate: identity, security, framing,
// discovery, sessions' packets, and the mandatory messaging module. Transport
// wiring (opening UDP/TCP sockets) is intentionally left to the host program;
// everything here is pure, deterministic, and conformance-tested against
// ../vectors/vectors.json.

export * from './registry.js';
export * from './envelope.js';
export * from './identity.js';
export * from './security.js';
export * from './framing.js';
export * from './discovery.js';
export * from './messaging.js';
export * from './core-packets.js';
