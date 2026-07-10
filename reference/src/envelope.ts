// LNCP/1 envelope types — mirrors spec/lncp-1/02-envelope.md.

/** Reserved envelope fields common to every packet. */
export interface Envelope {
  /** Protocol version "MAJOR.MINOR". Required on the first packet of a connection. */
  v?: string;
  /** Packet type name (registry §1). */
  type: string;
  /** Message id for correlation/acknowledgement (UUID). */
  id?: string;
  /** "In reply to": the id of the packet this one answers. */
  re?: string;
  /** Realm namespace (wire field name is `space` on beacons). */
  realm?: string;
  /** Extension / module-specific fields. */
  [key: string]: unknown;
}

/** Sender identity summary carried by several packets. */
export interface PeerSummary {
  id: string;
  nickname: string;
  discriminator: string;
}
