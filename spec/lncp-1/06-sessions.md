# LNCP/1 — Sessions

A **session** is a connection between two peers over the stream transport, used
to exchange envelopes. Discovery tells a peer *who* is out there and *how to
reach them*; the session layer is where they actually talk.

## 1. Transport

- The LNCP/1 session transport is **TCP secured with TLS** (`04-security.md §2`).
- A peer that accepts sessions **MUST** listen on a TCP port and advertise that
  port in its beacon (`port` field, `05-discovery.md`). The conventional range is
  **9000–9009** (`registry.md`); a peer **MAY** use any port it advertises.
- A connecting peer resolves the target's IP (from the discovery observation) and
  port (from the beacon), performs the TLS handshake, and **MUST** pin the
  certificate fingerprint before sending any envelope (`04-security.md §2.1`).

## 2. Session modes

LNCP/1 defines two session modes. Both use the same framing and envelopes; they
differ only in lifetime. A peer chooses the mode appropriate to the exchange.

### 2.1 One-shot session

A short-lived connection that carries a small, self-contained exchange and then
closes. Suitable for fire-and-forget delivery and simple request/reply.

Lifecycle:

```
connect → TLS handshake → pin fingerprint → send frame(s) → [read reply] → close
```

- The initiator opens the connection, sends one or more frames, optionally reads
  a reply, and closes.
- A one-shot session **SHOULD** apply a connection timeout (reference value:
  **5,000 ms**) and abandon the exchange if it elapses.
- One-shot is the simplest correct way to deliver a `MESSAGE` or a `PING`, and it
  is the baseline every implementation **MUST** support.

### 2.2 Persistent session

A long-lived connection that carries an ongoing stream of envelopes in both
directions. Suitable for real-time modules (typing, presence, media signaling)
and for reducing per-message handshake cost between frequently talking peers.

Lifecycle:

```
connect → TLS handshake → pin fingerprint → HELLO/version exchange
        → (many frames, both directions) → GOODBYE → close
```

- The opener is the `SESSION_HELLO` packet (`08-core-packets.md §1`); it carries
  the `v` field (`02-envelope.md §2.1`) and the sender's identity. This is the
  version exchange. Each side selects the highest major.minor it shares with the
  peer. Clean close uses `GOODBYE` (`08-core-packets.md §2`).
- Either side **MAY** keep the connection open indefinitely and **SHOULD** apply
  transport keepalive.
- To close cleanly, a peer **SHOULD** send a `GOODBYE` packet, then close the
  transport. A peer **MUST** tolerate an abrupt close without a `GOODBYE`
  (networks fail); an abrupt close is not an error condition, just a
  disconnection.

An implementation **MUST** support one-shot sessions. Persistent sessions are
**RECOMMENDED** and are required in practice for modules whose packets flow
continuously.

## 3. Liveness: PING / PONG

Any session **MAY** carry liveness probes:

- `PING` — `{ "type": "PING", "timestamp": <number> }`. The `timestamp` is the
  sender's local send time.
- `PONG` — `{ "type": "PONG", "timestamp": <number> }`. A peer that receives a
  `PING` **MUST** reply on the **same** connection with a `PONG` echoing the
  received `timestamp`, so the initiator can measure round-trip time.

`PING`/`PONG` are fire-and-forget with respect to acknowledgement (`id` is not
required); their correlation is the echoed `timestamp`.

## 4. Reading and dispatch

On any session a peer **MUST**:

1. Read frames per `01-framing.md §3`.
2. Decode each envelope and read its `type`.
3. Dispatch to the handler for that packet type's module.
4. Silently ignore a packet type it does not implement (unless the sender
   requested acknowledgement via `id`, in which case it **MAY** reply
   `1000 UNKNOWN_PACKET`).

A malformed frame or envelope on a stream **MUST NOT** crash the peer: the peer
skips the packet, and **MAY** close the connection if the stream can no longer be
resynchronized.

## 5. Errors

Session-level failures are reported with the `ERROR` packet
(`08-core-packets.md §4`) and the numeric codes in `registry.md §5`. An `ERROR`
**SHOULD** set `re` to the `id` of the packet that caused it, when that packet
carried an `id`.
