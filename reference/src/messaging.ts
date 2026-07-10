// LNCP/1 messaging module — mirrors spec/lncp-1/07-module-messaging.md.

import { LNCP_VERSION, PacketType } from './registry.js';
import { PeerSummary } from './envelope.js';

export interface Message {
  v: string;
  type: 'MESSAGE';
  id?: string;
  from: PeerSummary;
  message: string;
}

export interface MessageAck {
  v: string;
  type: 'MESSAGE_ACK';
  re: string;
}

/**
 * Build a MESSAGE. Field order (v, type, id, from, message) matches the
 * conformance vector so serialization is byte-identical. Include `id` when a
 * MESSAGE_ACK is wanted; omit for fire-and-forget.
 */
export function buildMessage(opts: { from: PeerSummary; message: string; id?: string; v?: string }): Message {
  const msg: Message = {
    v: opts.v ?? LNCP_VERSION,
    type: PacketType.MESSAGE,
    ...(opts.id ? { id: opts.id } : {}),
    from: opts.from,
    message: opts.message,
  } as Message;
  return msg;
}

/** Build a MESSAGE_ACK acknowledging the MESSAGE whose id is `re`. */
export function buildMessageAck(re: string, v: string = LNCP_VERSION): MessageAck {
  return { v, type: PacketType.MESSAGE_ACK, re };
}
