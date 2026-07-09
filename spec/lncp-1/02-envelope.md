# LNCP/1 — Envelope

Every LNCP packet — a discovery beacon, a chat message, a ping — is an
**envelope**: a single JSON object sharing one common structure. There are no
packet-specific headers. A peer can inspect any packet's version, type, and
routing fields without knowing the module it belongs to.

## 1. Structure

An envelope is a JSON object. It carries a small set of **reserved fields** plus
whatever **module fields** the packet type defines.

```json
{
  "v":     "1.0",
  "type":  "MESSAGE",
  "id":    "11111111-2222-4333-8444-555555555555",
  "re":    null,
  "realm": "",
  "...":   "module-specific fields"
}
```

## 2. Reserved fields

| Field   | Type   | Presence | Meaning |
|---------|--------|----------|---------|
| `v`     | string | see §2.1 | Protocol version, `"MAJOR.MINOR"`. |
| `type`  | string | REQUIRED | Packet type name (see `registry.md`). |
| `id`    | string | OPTIONAL | Message ID: a unique identifier for this packet, used for correlation and acknowledgement. Format: UUID. |
| `re`    | string | OPTIONAL | "In reply to": the `id` of the packet this one answers. |
| `realm` | string | OPTIONAL | Namespace; see `05-discovery.md`. Absent or `""` = the default (global) realm. |

Any field name not reserved here and not defined by the packet's module is an
**extension field**. Receivers **MUST** ignore extension fields they do not
recognize and **MUST NOT** treat them as an error.

Reserved field names are reserved across all of LNCP/1. A module **MUST NOT**
define a field that collides with a reserved name.

### 2.1 The `v` field

- On a **stream transport**, the first envelope a peer sends after connecting
  **MUST** include `v`. Subsequent envelopes on the same connection **MAY** omit
  it; the value from the connection's opening exchange applies.
- On a **datagram transport**, discovery beacons carry version information in
  their own advertised form (`05-discovery.md`) rather than in `v`.
- A receiver that reads a `v` whose **major** version it does not implement
  **MUST** ignore the packet (and, on a stream, **SHOULD** close the connection
  with error `1003 UNSUPPORTED_VERSION`; see `registry.md`).

## 3. The `type` field

`type` is a case-sensitive string naming the packet type. Every type is listed
in `registry.md`, which also assigns each a stable numeric code reserved for
future binary encodings. In LNCP/1's JSON encoding, the **string name is
canonical** on the wire.

A receiver that reads a `type` it does not recognize **MUST** ignore the packet
(silently on a datagram; on a stream it **MAY** reply with `1000 UNKNOWN_PACKET`
if the sender requested acknowledgement via `id`).

## 4. Correlation and acknowledgement

`id` and `re` provide request/response correlation without a dedicated
transaction layer:

- A sender that wants a reply or an acknowledgement sets `id` on its packet.
- A responder sets `re` on its reply to the originating packet's `id`.
- Whether a given packet type requires acknowledgement is defined by its module.
  Modules classify their packet types as **acknowledged** or **fire-and-forget**
  (see each `07-module-*.md`). Fire-and-forget packets **MAY** omit `id`.

`id` values **MUST** be unique per sender for long enough to prevent confusing
one exchange with another; UUIDs satisfy this.

## 5. Minimality

Envelopes are intentionally small. A reserved field that carries no information
for a given packet (`re` when it is not a reply, `realm` when default) **SHOULD**
be omitted rather than sent as `null`. Receivers **MUST** treat an absent
optional field and its documented default identically.

## 6. Example

The mandatory `MESSAGE` packet (see `07-module-messaging.md`), as it rides inside
a stream frame:

```json
{
  "v": "1.0",
  "type": "MESSAGE",
  "id": "11111111-2222-4333-8444-555555555555",
  "from": { "id": "9f8b7c6d-1e2f-4a3b-8c9d-0e1f2a3b4c5d", "nickname": "alice", "discriminator": "a1b2" },
  "message": "hello world"
}
```

Here `v`, `type`, and `id` are reserved fields; `from` and `message` are module
fields defined by the messaging module.
