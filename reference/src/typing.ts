// LNCP/1 — Typing Module
//
// Implements ephemeral typing indicators (TYPING, STOP_TYPING).
// Per spec/lncp-1/09-module-typing.md.

/** Build a TYPING packet. */
export function buildTyping(): { v: string; type: 'TYPING' } {
  return { v: '1.0', type: 'TYPING' };
}

/** Build a STOP_TYPING packet. */
export function buildStopTyping(): { v: string; type: 'STOP_TYPING' } {
  return { v: '1.0', type: 'STOP_TYPING' };
}

/** Type guard for TYPING packets. */
export function isTyping(packet: unknown): packet is { v: string; type: 'TYPING' } {
  return (
    typeof packet === 'object' &&
    packet !== null &&
    (packet as Record<string, unknown>).type === 'TYPING'
  );
}

/** Type guard for STOP_TYPING packets. */
export function isStopTyping(packet: unknown): packet is { v: string; type: 'STOP_TYPING' } {
  return (
    typeof packet === 'object' &&
    packet !== null &&
    (packet as Record<string, unknown>).type === 'STOP_TYPING'
  );
}
