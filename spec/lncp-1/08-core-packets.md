# LNCP/1 — Core Packets

This document defines the **core session packets** — those in the core type-code
range (`0x00xx`, `registry.md §1`) that are not tied to a single module. They are
available on any session regardless of which modules are negotiated.

The core packets are:

| Packet | Code | Purpose |
|--------|------|---------|
| `SESSION_HELLO` | `0x0003` | Opens a persistent session; exchanges version and identity. |
| `GOODBYE` | `0x0002` | Signals a clean close of a persistent session. |
| `PING` / `PONG` | `0x0020` / `0x0021` | Liveness and round-trip measurement (defined in `06-sessions.md §3`). |
| `CAPABILITIES` | `0x0060` | Advertises supported capabilities for negotiation. |
| `ERROR` | `0x0050` | Reports a failure, optionally correlated to an offending packet. |

> **`HELLO` vs. `SESSION_HELLO`.** `HELLO` (`0x0001`) is exclusively the **signed
> discovery beacon** carried over the datagram transport (`05-discovery.md`). The
> **persistent-session opener** is a distinct packet, `SESSION_HELLO` (`0x0003`),
> carried over the stream transport. They are not interchangeable: a beacon is
> signed and self-authenticating; a session opener rides inside an already
> fingerprint-pinned TLS connection and is not separately signed.

## 1. SESSION_HELLO

The first packet each side sends on a **persistent session** (`06-sessions.md
§2.2`). It performs the version exchange and states who is speaking.

```json
{
  "v": "1.0",
  "type": "SESSION_HELLO",
  "from": {
    "id": "9f8b7c6d-1e2f-4a3b-8c9d-0e1f2a3b4c5d",
    "nickname": "alice",
    "discriminator": "a1b2"
  }
}
```

| Field | Type | Presence | Meaning |
|-------|------|----------|---------|
| `v` | string | REQUIRED | Sender's highest supported version, `"MAJOR.MINOR"`. |
| `from` | object | REQUIRED | Sender identity summary `{ id, nickname, discriminator }`. |

Rules:

- Both sides **MUST** send `SESSION_HELLO` as their first stream packet before any
  module packet.
- Each side selects the effective version as the highest `MAJOR.MINOR` it shares
  with the peer's advertised `v`. If there is no common **major**, a peer
  **SHOULD** send `ERROR 1003 UNSUPPORTED_VERSION` and close.
- `from.id` **MUST** be consistent with the identity whose certificate
  fingerprint was pinned for this connection (`04-security.md §2.1`). A peer
  **MAY** close the connection if it is not.
- One-shot sessions (`06-sessions.md §2.1`) do **not** use `SESSION_HELLO`; they
  carry their single exchange directly, with `v` on the first (and only) packet.

## 2. GOODBYE

Signals that the sender is closing a persistent session cleanly.

```json
{ "v": "1.0", "type": "GOODBYE", "reason": "shutting down" }
```

| Field | Type | Presence | Meaning |
|-------|------|----------|---------|
| `reason` | string | OPTIONAL | Human-readable, non-normative close reason. |

Rules:

- `GOODBYE` has no required body beyond `type`.
- After sending `GOODBYE` a peer **SHOULD** close the transport and send no
  further packets on it.
- A peer **MUST** tolerate a transport close that arrives without a preceding
  `GOODBYE`; an abrupt close is a normal disconnection, not an error
  (`06-sessions.md §2.2`).

## 3. CAPABILITIES

Advertises the capabilities the sender supports, for negotiation on a persistent
session. Capability names are listed in `registry.md §4`.

```json
{ "v": "1.0", "type": "CAPABILITIES", "capabilities": ["messaging"] }
```

| Field | Type | Presence | Meaning |
|-------|------|----------|---------|
| `capabilities` | array of string | REQUIRED | Capabilities the sender supports. |

Rules:

- Exchanged after `SESSION_HELLO` when either side wants to negotiate optional
  modules.
- The effective capability set for the session is the **intersection** of both
  peers' advertised sets.
- Absent a `CAPABILITIES` exchange, only mandatory capabilities (`messaging`) are
  assumed.
- Unknown capability names **MUST** be ignored, never treated as an error.

## 4. ERROR

Reports a failure. The numeric `code` values are defined in `registry.md §5`.

```json
{ "v": "1.0", "type": "ERROR", "code": 1003, "re": "<offending packet id>", "detail": "unsupported version" }
```

| Field | Type | Presence | Meaning |
|-------|------|----------|---------|
| `code` | number | REQUIRED | Error code (`registry.md §5`). |
| `re` | string | OPTIONAL | `id` of the packet that caused the error, if it had one. |
| `detail` | string | OPTIONAL | Human-readable, non-normative context. |

Rules:

- An `ERROR` **SHOULD** set `re` to the `id` of the offending packet when that
  packet carried an `id`.
- `ERROR` is fire-and-forget: it is never itself acknowledged, and receiving an
  `ERROR` **MUST NOT** generate another `ERROR` in response.
- Sending an `ERROR` **MAY** be followed by closing the connection when the error
  is fatal to the session (e.g. `1002`, `1003`).
