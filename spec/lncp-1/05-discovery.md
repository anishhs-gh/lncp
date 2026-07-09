# LNCP/1 — Discovery

Discovery is how a peer learns that other peers exist, where to reach them, and
what they can do — with no central registry and no configuration. Discovery runs
out-of-band from sessions: it uses its own transport and never carries
application traffic.

## 1. Discovery is an interface

LNCP treats discovery as a **replaceable component** with a fixed contract:

> Produce a stream of *peer observations* — `(Peer ID, identity key,
> reachability, capabilities, realm)` — and keep them fresh, so that the layers
> above can open sessions to peers they have never been configured to know.

LNCP/1 defines one mandatory discovery mechanism, the **UDP beacon profile**
below. Because discovery is an interface, alternative mechanisms (multicast
service discovery, a seed/relay node, mesh gossip) can be introduced later as
additional profiles without any change to identity, sessions, or modules.

## 2. UDP beacon profile (mandatory in LNCP/1)

### 2.1 Transport

- Beacons are UDP datagrams.
- A peer **MUST** send beacons to the discovery port range and **MUST** listen
  on one port in that range. The range is **41234–41238** (five ports); see
  `registry.md`.
- A peer **SHOULD** send to the directed broadcast address of each active local
  subnet (so multi-homed hosts reach the right network) and **SHOULD** also send
  to loopback, so peers on the same machine discover each other immediately.
- A peer listens by binding the first free port in the range, so several peers
  on one host can each hold their own discovery port.

### 2.2 Cadence

- A peer **MUST** broadcast its beacon periodically. The default interval is
  **5,000 ms**.
- Because beacons are periodic, discovery is soft-state: a peer that stops being
  heard is presumed gone. LNCP/1 does not mandate a specific expiry, but an
  implementation **SHOULD** treat a peer as offline after a small multiple of the
  beacon interval with no beacon.
- Beacons are datagrams and are inherently lossy; loss is expected and requires
  no retransmission — the next beacon supersedes the last.

### 2.3 Beacon packet (`HELLO`)

A beacon is a `HELLO` envelope carried as a bare UDP datagram payload (datagram
framing, `01-framing.md §2`). Fields:

| Field | Type | Presence | Meaning |
|-------|------|----------|---------|
| `type` | string | REQUIRED | `"HELLO"`. |
| `id` | string (UUID) | REQUIRED | Sender's Peer ID. |
| `nickname` | string | REQUIRED | Display name. |
| `discriminator` | string | REQUIRED | 4-char disambiguator (`03-identity.md`). |
| `port` | number | REQUIRED | TCP port on which the sender accepts sessions. |
| `fingerprint` | string \| null | REQUIRED | SHA-256 hex of the sender's TLS certificate, or `null` if none. |
| `space` | string | REQUIRED | Realm namespace (`""` = default). See §3. |
| `timestamp` | number | REQUIRED | Send time, ms since Unix epoch. Signed; drives replay protection. |
| `publicKey` | string | REQUIRED | Base64 SPKI DER of the sender's Ed25519 identity key. |
| `signature` | string | REQUIRED | Base64 Ed25519 signature over the canonical string (`04-security.md`). |

> **Field naming note.** The realm field is named `space` on the wire for
> continuity with existing deployments. The specification refers to the concept
> as a *realm*; the wire field is `space`. They are the same thing.

### 2.4 Receiving a beacon

On each received datagram a peer **MUST**, in order:

1. Parse the payload as a JSON envelope; discard if it is not parseable or
   `type` is not `"HELLO"`.
2. Ignore a beacon whose `id` equals the receiver's own Peer ID (self-echo).
3. Apply the **realm filter** (§3): ignore the beacon unless its `space` equals
   the receiver's realm.
4. Enforce the **replay window** and **verify the signature** (`04-security.md`).
   Discard on failure.
5. Apply the **TOFU trust check** (`04-security.md §3`). On a key conflict,
   discard the beacon and surface a warning.
6. Record/refresh the peer observation: `Peer ID`, `nickname`, `discriminator`,
   source IP address, `port`, and `fingerprint`. The source IP comes from the
   datagram's origin, not from the packet body.

Only after all checks pass is the peer considered discovered and reachable.

## 3. Realms

A **realm** partitions discovery. Two peers discover each other **only if their
realm values are identical.** The default realm is the empty string `""`, which
every peer joins unless configured otherwise.

- The realm is part of the signed canonical string, so it cannot be stripped or
  altered by a third party without breaking the signature.
- Realms are the primitive on which higher-level grouping (rooms, channels,
  private groups) is built. LNCP/1 defines only the discovery-scoping behavior;
  richer group semantics belong to future modules.

## 4. What discovery does not do

- Discovery **MUST NOT** carry chat messages, files, or media. It advertises
  presence and reachability only.
- Discovery establishes *reachability and trust*, not a *connection*. Opening and
  managing connections is the session layer's job (`06-sessions.md`).

## 5. Test vector

`vectors/vectors.json → discoveryBeacon` contains a complete signed `HELLO`,
its exact canonical signing input, and the resulting signature, all reproducible
via `node vectors/generate.js`.
