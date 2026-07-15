# LNCP/1 — Presence Module

The presence module provides **online status indicators** — signals that
communicate a peer's availability state (online, away, busy, etc.). It is
optional; a conformant implementation MAY implement it.

- **Module name (capability):** `presence`
- **Packet types:** `PRESENCE`
- **Reserved type-code range:** see `registry.md`

## 1. Purpose

Presence allows peers to signal their availability before or during a
conversation. This is distinct from discovery (which indicates whether a peer
is reachable on the network) — presence conveys user intent ("I'm here but
busy", "I'm away from my desk").

## 2. PRESENCE

Announces the sender's current presence state. The receiver MAY display this
status in the peer list or conversation UI.

```json
{
  "v": "1.0",
  "type": "PRESENCE",
  "status": "away",
  "message": "lunch break"
}
```

| Field | Type | Presence | Meaning |
|-------|------|----------|---------|
| `status` | string | REQUIRED | The presence status. See §2.1 for defined values. |
| `message` | string | OPTIONAL | A free-form status message (e.g., "in a meeting", "back in 5 min"). UTF-8, max 256 characters recommended. |

### 2.1 Status values

| Status | Meaning |
|--------|---------|
| `online` | The peer is active and available. This is the implicit default; a peer need not send `PRESENCE` with `online` unless changing from another status. |
| `away` | The peer is online but idle or temporarily unavailable. |
| `busy` | The peer is online but prefers not to be disturbed. |
| `offline` | The peer is going offline. This is a courtesy notification before disconnect; the receiver SHOULD treat the peer as offline upon receipt. |

Implementations **MAY** define additional status values for local use. Unknown
status values **MUST** be ignored per `02-envelope.md §3`, though the receiver
MAY display the raw `status` string if it has no mapping.

### 2.2 Status message

The optional `message` field allows a peer to provide context:

```json
{
  "v": "1.0",
  "type": "PRESENCE",
  "status": "busy",
  "message": "in a video call"
}
```

The message is free-form UTF-8 text. Implementations **SHOULD** limit display
to a reasonable length (256 characters recommended). The message is not
localized; it is the sender's responsibility to provide text appropriate for
their expected audience.

## 3. Delivery

`PRESENCE` is typically sent over a **persistent session** (`06-sessions.md §2`).

### 3.1 Initial advertisement

When a persistent session is established, a peer that supports presence **SHOULD**
send its current `PRESENCE` state after capability negotiation completes. This
allows the other peer to display accurate status from the start of the session.

### 3.2 State changes

When a peer's presence state changes (user sets status, idle timeout triggers,
etc.), the peer **SHOULD** send an updated `PRESENCE` packet on all active
persistent sessions.

### 3.3 Graceful disconnect

Before closing a session, a peer **MAY** send `PRESENCE` with `status: "offline"`
as a courtesy. The receiver **SHOULD** treat this as "peer is going away" and
update UI accordingly. This is optional; peers also go offline unexpectedly
(network issues, crashes) and discovery timeout (`05-discovery.md`) handles
those cases.

## 4. Interaction with discovery

Discovery (`HELLO` beacons) signals network reachability. Presence signals
user availability. They are orthogonal:

- A peer can be **discoverable** (sending `HELLO`) but **away** (`PRESENCE` with
  `status: "away"`).
- A peer can be **online** (`PRESENCE` with `status: "online"`) but not discoverable
  (outside the realm, UDP blocked).

Implementations **SHOULD NOT** infer presence from discovery alone. A peer not
sending `PRESENCE` has unknown status — they may be `online` (the implicit default)
or may not implement the presence module.

## 5. Capability advertisement

A peer that implements this module **SHOULD** advertise the `presence` capability
during capability negotiation (`registry.md → Capabilities`). Peers that do not
advertise `presence` will not send or receive presence updates, but can still
communicate via the mandatory `messaging` module.

## 6. Acknowledgement classification

Per `02-envelope.md §4`, this module classifies its packets:

| Packet | Class |
|--------|-------|
| `PRESENCE` | fire-and-forget |

Presence is informational; no acknowledgement is expected.

## 7. Persistence

Presence is **ephemeral**. Implementations **MUST NOT** persist presence state
across restarts. A peer's presence is only valid for the duration of the session
in which it was received. When a session closes, the receiver **SHOULD** discard
the last-known presence for that peer.
