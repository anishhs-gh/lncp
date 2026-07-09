# LNCP/1 — Overview

## 1. Purpose

LNCP is a protocol for **secure, zero-configuration communication between
devices on a shared local network**. Two goals shape every decision:

1. **Zero configuration.** Peers find each other and establish trust with no
   servers, no accounts, no addresses typed by a human.
2. **Implementation independence.** The protocol is defined by this document and
   its test vectors — not by any program. A conformant implementation can be
   written from the specification alone.

## 2. What LNCP defines, and what it does not

LNCP owns the wire: how peers are discovered, how they are identified and
trusted, how bytes are framed, how packets are structured, and what the core
message exchanges mean.

LNCP does **not** own the product. User interface, command syntax, terminal
rendering, notifications, storage, and policy all belong to the application. Two
applications with completely different interfaces interoperate as long as both
speak LNCP.

## 3. Terminology

The keywords **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHOULD**,
**SHOULD NOT**, **MAY**, and **OPTIONAL** are to be interpreted as normative
requirement levels: **MUST** is mandatory for conformance, **SHOULD** is a
strong recommendation with acknowledged exceptions, **MAY** is discretionary.

| Term | Meaning |
|------|---------|
| **Peer** | A single running LNCP endpoint, identified by a stable Peer ID. |
| **Peer ID** | The permanent unique identifier of a peer (see `03-identity.md`). |
| **Identity key** | The Ed25519 key pair a peer signs with. |
| **Realm** | A namespace; peers only discover peers in the same realm. |
| **Beacon** | A discovery datagram a peer periodically broadcasts. |
| **Transport** | An underlying channel that carries bytes (e.g. TCP with TLS). |
| **Frame** | One delimited unit of bytes on a stream transport. |
| **Envelope** | The structured packet carried inside a frame or datagram. |
| **Packet type** | The kind of an envelope (e.g. `MESSAGE`, `PING`). |
| **Module** | A related group of packet types providing one capability. |
| **Capability** | A named feature a peer advertises and may negotiate. |

## 4. Architecture

LNCP is layered. Each layer has one responsibility and depends only on the layer
beneath it. A layer never inspects the internals of the layer above it.

```
┌──────────────────────────────────────────────────────────┐
│ MODULES        messaging · presence · typing · files ·    │  07-module-*.md
│                voice · <third-party>                      │
├──────────────────────────────────────────────────────────┤
│ SESSION        one-shot | persistent · lifecycle · close  │  06-sessions.md
├──────────────────────────────────────────────────────────┤
│ ENVELOPE       version · type · flags · id · realm        │  02-envelope.md
├──────────────────────────────────────────────────────────┤
│ SECURITY       Ed25519 signing · TLS · fingerprint · TOFU │  04-security.md
│ / IDENTITY     Peer ID · keys · certificate               │  03-identity.md
├──────────────────────────────────────────────────────────┤
│ FRAMING        [length][content-type][body]               │  01-framing.md
├──────────────────────────────────────────────────────────┤
│ TRANSPORT      stream (TCP/TLS) · datagram (UDP)          │  (interface)
└──────────────────────────────────────────────────────────┘
        DISCOVERY (out-of-band, pluggable) ── default: signed UDP beacon
                                                             05-discovery.md
```

### 4.1 Why the layers are separate

- **Transport is pluggable.** LNCP/1 mandates one stream transport (TCP secured
  with TLS) and one datagram transport (UDP, used only by discovery). Future
  transports are added without touching any higher layer, because higher layers
  only ever see *frames* and *envelopes*.
- **Framing is singular.** There is exactly one framing rule, so a stream can be
  split into packets identically everywhere, and the same envelopes ride over a
  datagram transport unchanged.
- **The envelope is universal.** Every packet, in every module, shares one
  header shape. No packet type invents its own header.
- **Modules are additive.** Capability is added by defining new packet types in
  a reserved range, never by changing an existing type. This is how the protocol
  grows without breaking older peers.

## 5. Encoding

LNCP/1 uses **UTF-8 JSON** as its envelope encoding (`content-type = 1`). JSON
was chosen for LNCP/1 because it is inspectable, universally supported, and
already proven in practice. The framing layer carries an explicit content-type
byte so a future minor version may introduce a compact binary encoding (e.g.
CBOR) with no change to any other layer. Implementations **MUST** support JSON
and **MUST** reject frames whose content-type they do not understand.

## 6. Versioning at a glance

- **Major version** (`LNCP/1`, `LNCP/2`): may change framing or envelope
  structure. Different majors are not required to interoperate.
- **Minor version** (`1.0`, `1.1`): adds packet types, modules, or capabilities.
  A newer minor **MUST** remain able to speak to an older minor by not requiring
  packets the peer did not advertise support for.
- Every envelope carries its version (`02-envelope.md`). Every beacon advertises
  it (`05-discovery.md`). Peers negotiate the highest common version.

Full rules for growth, deprecation, and the change process live in
`registry.md` and the governance section of the repository README.

## 7. Design constraints (normative posture)

1. A packet **MUST NOT** depend on transport-specific behavior for its meaning.
2. An unknown packet type, capability, or envelope field **MUST** be ignored,
   not treated as an error, unless this specification says otherwise.
3. A retired packet type or code is **reserved forever** and **MUST NOT** be
   reassigned.
4. Ephemeral signals (e.g. typing) **MUST NOT** be persisted and **MUST NOT** be
   retransmitted if lost.
