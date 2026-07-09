# LNCP/1 — Framing

Framing turns a raw transport into a sequence of discrete packets. It is the
only layer that knows where one packet ends and the next begins.

## 1. Transport classes

LNCP distinguishes two transport classes:

- **Datagram transport** — delivers self-delimiting messages (one datagram = one
  payload). UDP is the datagram transport in LNCP/1, and it is used **only** by
  discovery (`05-discovery.md`).
- **Stream transport** — delivers an ordered, reliable byte stream with no
  message boundaries. TCP secured with TLS is the stream transport in LNCP/1,
  and it carries all session traffic (`06-sessions.md`).

## 2. Datagram framing

On a datagram transport, **the datagram payload is exactly one envelope, with no
additional framing header.** The transport already provides the boundary.

For LNCP/1 that payload is the UTF-8 JSON encoding of the envelope. A receiver
**MUST** attempt to parse the whole datagram payload as a single JSON object and
**MUST** silently discard any datagram it cannot parse.

## 3. Stream framing

On a stream transport, envelopes are delimited by a **length-prefixed frame**:

```
 0        4        5                          5 + N
 +--------+--------+---------------------------+
 | length | c-type |        body (N bytes)     |
 +--------+--------+---------------------------+
   uint32   uint8            payload
   (BE)
```

| Field | Size | Description |
|-------|------|-------------|
| `length` | 4 bytes | Unsigned big-endian length **of `body`** in bytes. Does **not** include the 5-byte header. |
| `c-type` | 1 byte | Content type of `body`. `1` = UTF-8 JSON. Other values are reserved (`registry.md`). |
| `body`   | `length` bytes | The encoded envelope. |

### 3.1 Reading rule

A reader **MUST**:

1. Read exactly 5 header bytes.
2. Decode `length` and `c-type`.
3. If `length` exceeds the maximum frame size (§4), close the connection.
4. If `c-type` is not supported, skip `length` body bytes and continue (an
   unknown encoding is not fatal to the stream).
5. Otherwise read exactly `length` body bytes, decode the envelope, dispatch it,
   and return to step 1.

A reader **MUST NOT** assume any relationship between transport reads and frame
boundaries: one read may contain several frames or a partial frame, and one
frame may span several reads. Implementations buffer until a full frame is
available.

### 3.2 Writing rule

A writer **MUST** emit the 5-byte header immediately followed by exactly
`length` body bytes, as a single logical unit, and **MUST NOT** interleave the
bytes of two frames on the same connection.

## 4. Limits

- The maximum `body` length for LNCP/1 is **1,048,576 bytes (1 MiB)**. A frame
  claiming more **MUST** be rejected by closing the connection. Bulk payloads
  (e.g. file contents) are chunked by their module below this limit; they are
  never sent as one oversized frame.
- A `length` of `0` is valid only for packet types explicitly defined as
  empty-bodied; otherwise it **MUST** be treated as malformed.

## 5. Relationship to LNCP/1.0 reference behavior

Early LNCP tooling delimited stream packets with a trailing newline
(`\n`) instead of a length prefix. Length-prefixed framing supersedes that: it
is unambiguous across binary payloads, works identically on stream and datagram
transports, and does not depend on the body being text. Conformant LNCP/1
implementations **MUST** use length-prefixed framing on stream transports.

## 6. Test vectors

See `vectors/vectors.json → streamMessageFrame`. The frame there encodes a
191-byte JSON `MESSAGE` body with `c-type = 1`; its first five bytes are
`00 00 00 bf 01` (`length = 0x0000_00bf = 191`, `c-type = 1`).
