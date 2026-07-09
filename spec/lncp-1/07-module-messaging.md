# LNCP/1 — Messaging Module

The messaging module is the one **mandatory** module in LNCP/1. Every conformant
implementation **MUST** implement it. It defines direct text messages between
peers and the acknowledgement that confirms delivery.

- **Module name (capability):** `messaging`
- **Packet types:** `MESSAGE`, `MESSAGE_ACK`
- **Reserved type-code range:** see `registry.md`

## 1. MESSAGE

A single text message from one peer to another.

```json
{
  "v": "1.0",
  "type": "MESSAGE",
  "id": "11111111-2222-4333-8444-555555555555",
  "from": {
    "id": "9f8b7c6d-1e2f-4a3b-8c9d-0e1f2a3b4c5d",
    "nickname": "alice",
    "discriminator": "a1b2"
  },
  "message": "hello world"
}
```

| Field | Type | Presence | Meaning |
|-------|------|----------|---------|
| `from` | object | REQUIRED | Sender identity summary: `{ id, nickname, discriminator }`. `id` is the sender's Peer ID; `nickname`/`discriminator` are presentation. |
| `message` | string | REQUIRED | The message text, UTF-8. |
| `id` | string | OPTIONAL | Message ID (`02-envelope.md`). Present when the sender wants a `MESSAGE_ACK`. |

Notes:

- The authoritative sender identity is `from.id` (the Peer ID). A receiver
  **SHOULD** verify that `from.id` matches the peer it is connected to (the peer
  whose fingerprint it pinned) and **MAY** ignore a `MESSAGE` whose `from.id`
  contradicts the connection's authenticated identity.
- `message` length is bounded by the frame limit (`01-framing.md §4`). Larger
  content is the province of a file-transfer module, not `MESSAGE`.
- There is no separate "recipient" field: the recipient is the peer on the other
  end of the connection. Broadcast (sending to all peers) is performed by the
  sender opening a session to each peer in turn, not by a special packet.

### 1.1 Delivery

`MESSAGE` **MAY** be delivered over a one-shot or a persistent session
(`06-sessions.md §2`). The reference behavior for a direct message is a one-shot
session: connect, send one `MESSAGE` frame, close.

## 2. MESSAGE_ACK

Acknowledges receipt of a `MESSAGE` that carried an `id`.

```json
{
  "v": "1.0",
  "type": "MESSAGE_ACK",
  "re": "11111111-2222-4333-8444-555555555555"
}
```

| Field | Type | Presence | Meaning |
|-------|------|----------|---------|
| `re` | string | REQUIRED | The `id` of the `MESSAGE` being acknowledged (`02-envelope.md §4`). |

Rules:

- If a received `MESSAGE` has an `id`, the receiver **SHOULD** reply with a
  `MESSAGE_ACK` whose `re` equals that `id`.
  - On a **persistent** session, the ack is sent back on the same connection.
  - On a **one-shot** session, the receiver **MAY** send the ack on the open
    connection before it closes; if the connection is already closing, delivery
    is considered best-effort and the sender treats absence of an ack as
    "delivered, unconfirmed" rather than "failed".
- If a `MESSAGE` has **no** `id`, it is fire-and-forget: no ack is expected and
  none **SHOULD** be sent.
- `MESSAGE_ACK` confirms **receipt by the LNCP layer**, not that a human has read
  the message. Read receipts, if ever defined, are a separate future packet type.

## 3. Acknowledgement classification

Per `02-envelope.md §4`, this module classifies its packets:

| Packet | Class |
|--------|-------|
| `MESSAGE` with `id` | acknowledged (expects `MESSAGE_ACK`) |
| `MESSAGE` without `id` | fire-and-forget |
| `MESSAGE_ACK` | fire-and-forget (it is itself the acknowledgement) |

## 4. Capability advertisement

A peer that implements this module **MUST** advertise the `messaging` capability
during capability negotiation (see `registry.md → Capabilities`). Because
`messaging` is mandatory in LNCP/1, every LNCP/1 peer advertises it; the
capability exists so that future profiles and non-LNCP/1 peers can reason about
its presence explicitly rather than assuming it.

## 5. Future messaging packets (reserved, not defined in LNCP/1)

The messaging type-code range reserves space for capabilities anticipated but not
specified here, so they can be added in a later minor version without disturbing
LNCP/1 peers: reply threading, edit, delete, delivery vs. read receipts, and
reactions. Until specified, these type codes **MUST NOT** be sent, and a peer
that receives an unknown type in this range **MUST** ignore it per the envelope
rules (`02-envelope.md §3`).
