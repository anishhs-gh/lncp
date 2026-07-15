# LNCP/1 — Typing Module

The typing module provides **ephemeral typing indicators** — signals that a peer
is currently composing a message. It is optional; a conformant implementation
MAY implement it.

- **Module name (capability):** `typing`
- **Packet types:** `TYPING`, `STOP_TYPING`
- **Reserved type-code range:** see `registry.md`

## 1. Purpose

Typing indicators improve the conversational feel of real-time messaging by
showing when the other party is actively composing. They are purely presentational
and carry no application data.

## 2. TYPING

Signals that the sender is currently composing a message. The receiver MAY
display a visual indicator (e.g., "alice is typing…").

```json
{
  "v": "1.0",
  "type": "TYPING"
}
```

| Field | Type | Presence | Meaning |
|-------|------|----------|---------|
| (none beyond envelope) | — | — | The packet body is empty; the presence of the packet itself is the signal. |

Rules:

- The sender **SHOULD** send `TYPING` when the user begins typing in the
  composition field.
- The sender **SHOULD** send `STOP_TYPING` when the user stops typing for a
  significant period, sends the message, or clears the composition field.
- `TYPING` is **ephemeral**: it **MUST NOT** be persisted to storage, and it
  **MUST NOT** be retransmitted if lost.
- The receiver **SHOULD** treat `TYPING` as valid for a short time window
  (recommended: 4 seconds). If no subsequent `TYPING` or `STOP_TYPING` arrives
  within this window, the receiver **SHOULD** clear the typing indicator.
- The receiver **MAY** throttle or deduplicate rapid `TYPING` packets to avoid
  UI flicker.

### 2.1 Delivery

`TYPING` is sent over a **persistent session** (`06-sessions.md §2`). It has
no meaning on a one-shot session. A peer that receives `TYPING` on a one-shot
session **MUST** ignore it.

## 3. STOP_TYPING

Signals that the sender is no longer composing a message. The receiver **SHOULD**
clear any typing indicator for that peer immediately.

```json
{
  "v": "1.0",
  "type": "STOP_TYPING"
}
```

| Field | Type | Presence | Meaning |
|-------|------|----------|---------|
| (none beyond envelope) | — | — | The packet body is empty. |

Rules:

- The sender **SHOULD** send `STOP_TYPING` when:
  - The user sends the composed message.
  - The user clears the composition field.
  - The user has been idle for a significant period (implementation-defined;
    commonly 3–5 seconds of no keystrokes).
- `STOP_TYPING` is **ephemeral**: it **MUST NOT** be persisted.
- A receiver that has no active typing indicator for the sender **MUST** ignore
  `STOP_TYPING` (it is informational, not an error condition).

### 3.1 Idempotency

`STOP_TYPING` is idempotent. Receiving multiple `STOP_TYPING` packets from the
same peer has the same effect as receiving one.

## 4. Interaction with MESSAGE

When a peer sends a `MESSAGE`, the receiver **SHOULD** clear any active typing
indicator for that peer, as the message itself implies the sender finished
composing. The sender **MAY** omit `STOP_TYPING` immediately before `MESSAGE` as
an optimization, since the message serves the same purpose.

## 5. Capability advertisement

A peer that implements this module **SHOULD** advertise the `typing` capability
during capability negotiation (`registry.md → Capabilities`). Because `typing`
is optional, a peer that does not advertise `typing` will simply not send or
receive typing indicators — it does not affect core messaging.

## 6. Acknowledgement classification

Per `02-envelope.md §4`, this module classifies its packets:

| Packet | Class |
|--------|-------|
| `TYPING` | fire-and-forget |
| `STOP_TYPING` | fire-and-forget |

Neither packet expects an acknowledgement. They are best-effort signals.
