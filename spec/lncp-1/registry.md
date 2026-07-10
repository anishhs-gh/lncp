# LNCP/1 — Registry

This document is the single source of truth for the protocol's reserved values:
packet type codes, transport ports, capability names, and error codes. Assigning
a value here is a deliberate act. **A value, once assigned or retired, is
reserved forever and MUST NOT be reused for a different meaning.**

## 1. Packet type codes

Every packet type has a **string name** (canonical in LNCP/1's JSON encoding) and
a **numeric code** (reserved for future binary encodings). Codes are grouped into
ranges so that modules — including third-party ones — can claim space that will
never collide.

### 1.1 Ranges

| Range (hex) | Class | Rules |
|-------------|-------|-------|
| `0x0000`–`0x00FF` | **Core** | Session and protocol packets. Assigned only by the LNCP specification. |
| `0x0100`–`0x0FFF` | **Standard modules** | Official modules (messaging, presence, files, voice, …). Assigned by the specification. |
| `0x1000`–`0x7FFF` | **Experimental** | For drafts and prototypes. No stability guarantee; may change or vanish. |
| `0x8000`–`0xEFFF` | **Vendor** | For third-party modules. A vendor claims a sub-range and owns it. |
| `0xF000`–`0xFFFF` | **Private/Reserved** | Local/private use; never sent between independent products. |

Unknown type codes **MUST** be ignored (`02-envelope.md §3`), which is what makes
these ranges safe to extend.

### 1.2 Assigned codes (LNCP/1)

**Core (`0x00xx`):**

| Code | Name | Defined in |
|------|------|-----------|
| `0x0001` | `HELLO` | `05-discovery.md` — signed discovery beacon (datagram transport only) |
| `0x0002` | `GOODBYE` | `08-core-packets.md §2` |
| `0x0003` | `SESSION_HELLO` | `08-core-packets.md §1` — persistent-session opener (stream transport) |
| `0x0020` | `PING` | `06-sessions.md §3` |
| `0x0021` | `PONG` | `06-sessions.md §3` |
| `0x0050` | `ERROR` | `08-core-packets.md §4` (codes: §4 below) |
| `0x0060` | `CAPABILITIES` | `08-core-packets.md §3` (names: §3 below) |

**Messaging module (`0x0100`–`0x010F`):**

| Code | Name | Defined in |
|------|------|-----------|
| `0x0100` | `MESSAGE` | `07-module-messaging.md` |
| `0x0101` | `MESSAGE_ACK` | `07-module-messaging.md` |
| `0x0102`–`0x010F` | *reserved* | messaging futures (edit, delete, receipts, reactions, threads) |

**Reserved for standard modules not yet specified in LNCP/1** (names fixed so
existing deployments' packets keep their identity; full definitions land in
future minor versions):

| Code | Name | Future module |
|------|------|---------------|
| `0x0110` | `TYPING` | typing |
| `0x0111` | `STOP_TYPING` | typing |
| `0x0120` | `PRESENCE` | presence |
| `0x0200` | `FILE_OFFER` | file-transfer |
| `0x0201` | `FILE_ACCEPT` | file-transfer |
| `0x0202` | `FILE_REJECT` | file-transfer |
| `0x0203` | `FILE_READY` | file-transfer |
| `0x0204` | `FILE_CANCEL` | file-transfer |
| `0x0205` | `FILE_PAUSE` | file-transfer |
| `0x0206` | `FILE_RESUME` | file-transfer |
| `0x0207` | `FILE_RESUME_REQUEST` | file-transfer |
| `0x0300`–`0x03FF` | `CALL_*` | voice/media |

> These reserved entries mirror packet types already used in practice. Listing
> them here prevents any future code from colliding with them, even though their
> normative definitions are deferred.

## 2. Ports

| Purpose | Transport | Range | Notes |
|---------|-----------|-------|-------|
| Discovery beacons | UDP | **41234–41238** | Send to all; listen on the first free port in range. |
| Sessions | TCP/TLS | **9000–9009** | Conventional range; a peer MAY use any port it advertises in its beacon. |

These ranges are part of the LNCP/1 profile so that independent implementations
find each other by default. A peer **MUST** advertise its actual session port in
its beacon rather than assuming a fixed value.

## 3. Content types

The 1-byte `c-type` field in a stream frame (`01-framing.md §3`) names the
encoding of the frame body.

| Value | Name | Status | Meaning |
|-------|------|--------|---------|
| `0` | reserved | reserved | Never sent; reserved to catch zeroed headers. |
| `1` | `json` | **mandatory** | UTF-8 JSON. The only encoding defined in LNCP/1; every peer MUST support it. |
| `2` | `cbor` | reserved | Compact binary (CBOR). Reserved for a future minor version. |
| `3`–`239` | — | reserved | For future standard encodings. |
| `240`–`255` | — | vendor | Private/experimental encodings; never sent between independent products. |

A peer that receives a frame with an unsupported `c-type` **MUST** skip the
frame's body without failing the stream (`01-framing.md §3.1`).

## 4. Capabilities

Capabilities are lowercase strings a peer advertises so peers can negotiate
optional behavior. A peer **MUST** ignore capability names it does not recognize.

| Capability | Status in LNCP/1 | Meaning |
|------------|------------------|---------|
| `messaging` | **mandatory** | Implements the messaging module (`07`). |
| `typing` | reserved | Ephemeral typing indicators. |
| `presence` | reserved | Online/away/busy state. |
| `broadcast` | reserved | Send-to-all semantics. |
| `file-transfer` | reserved | Offer/accept/chunked transfer. |
| `compression` | reserved | Payload/stream compression. |
| `voice` | reserved | Real-time audio signaling + media. |
| `video` | reserved | Real-time video. |
| `extensions` | reserved | Willing to receive vendor/experimental packets. |

The `CAPABILITIES` packet that carries these names is defined in
`08-core-packets.md §3`.

## 5. Error codes

Errors are reported with the `ERROR` packet (`08-core-packets.md §4`) using the
numeric `code` values below. Applications render human-friendly text; the
protocol carries the number.

| Code | Name | Meaning |
|------|------|---------|
| `1000` | `UNKNOWN_PACKET` | Received a packet type the peer does not recognize (only sent if the packet requested acknowledgement). |
| `1001` | `INVALID_PACKET` | Packet was malformed or failed validation. |
| `1002` | `AUTH_FAILED` | Authentication/signature/fingerprint check failed. |
| `1003` | `UNSUPPORTED_VERSION` | No common major.minor version. |
| `1004` | `UNKNOWN_PEER` | Referenced a peer the receiver does not know. |
| `1005` | `TIMEOUT` | An expected response did not arrive in time. |
| `1006` | `CANCELLED` | An in-progress operation was cancelled. |
| `1007` | `PERMISSION_DENIED` | The peer refused the requested action. |
| `1008` | `INVALID_CAPABILITY` | A packet required a capability that was not negotiated. |
| `1009` | `INTEGRITY_FAILURE` | A content integrity check (e.g. a hash) failed. |

Codes `1000`–`1999` are reserved for core/standard errors. `2000`–`2999` are
reserved for vendor-defined errors.

## 6. Changing the registry

- Adding a new packet type, capability, or error code is a **minor** version
  change: it never alters the meaning of an existing value.
- Changing framing or envelope structure is a **major** version change.
- Retiring a value marks it *reserved (retired)*; it is never deleted and never
  reused.
