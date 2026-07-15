// LNCP/1 — Presence Module
//
// Implements online status indicators (PRESENCE).
// Per spec/lncp-1/10-module-presence.md.

/** Presence status values. */
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

/** PRESENCE packet structure. */
export interface PresencePacket {
  v: string;
  type: 'PRESENCE';
  status: PresenceStatus;
  message?: string;
}

/** Build a PRESENCE packet. */
export function buildPresence(
  status: PresenceStatus,
  message?: string,
): PresencePacket {
  const packet: PresencePacket = { v: '1.0', type: 'PRESENCE', status };
  if (message !== undefined) {
    packet.message = message;
  }
  return packet;
}

/** Type guard for PRESENCE packets. */
export function isPresence(packet: unknown): packet is PresencePacket {
  if (
    typeof packet !== 'object' ||
    packet === null ||
    (packet as Record<string, unknown>).type !== 'PRESENCE'
  ) {
    return false;
  }
  const p = packet as Record<string, unknown>;
  return (
    typeof p.status === 'string' &&
    ['online', 'away', 'busy', 'offline'].includes(p.status)
  );
}

/** Valid presence status values. */
export const PRESENCE_STATUSES: PresenceStatus[] = ['online', 'away', 'busy', 'offline'];
