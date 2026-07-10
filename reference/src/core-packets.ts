// LNCP/1 core session packets — mirrors spec/lncp-1/08-core-packets.md.

import { LNCP_VERSION, PacketType } from './registry.js';
import { PeerSummary } from './envelope.js';

export function buildSessionHello(from: PeerSummary, v: string = LNCP_VERSION) {
  return { v, type: PacketType.SESSION_HELLO, from };
}

export function buildGoodbye(reason?: string, v: string = LNCP_VERSION) {
  return { v, type: PacketType.GOODBYE, ...(reason ? { reason } : {}) };
}

export function buildCapabilities(capabilities: string[], v: string = LNCP_VERSION) {
  return { v, type: PacketType.CAPABILITIES, capabilities };
}

export function buildError(code: number, opts: { re?: string; detail?: string } = {}, v: string = LNCP_VERSION) {
  return {
    v,
    type: PacketType.ERROR,
    code,
    ...(opts.re ? { re: opts.re } : {}),
    ...(opts.detail ? { detail: opts.detail } : {}),
  };
}

export function buildPing(timestamp: number = Date.now()) {
  return { type: PacketType.PING, timestamp };
}

export function buildPong(timestamp: number) {
  return { type: PacketType.PONG, timestamp };
}

/**
 * Select the effective version between our supported "MAJOR.MINOR" versions and
 * a peer's advertised one: highest shared major.minor, or null if no common
 * major (spec §1). `ours` is assumed sorted highest-last is not required.
 */
export function negotiateVersion(ours: string[], peer: string): string | null {
  const [pMaj, pMin] = peer.split('.').map(Number);
  let best: { maj: number; min: number; s: string } | null = null;
  for (const s of ours) {
    const [maj, min] = s.split('.').map(Number);
    if (maj !== pMaj) continue; // different major cannot interoperate
    const usable = min <= pMin ? min : Math.min(min, pMin);
    if (!best || usable > best.min) best = { maj, min: usable, s: `${maj}.${usable}` };
  }
  return best ? best.s : null;
}
