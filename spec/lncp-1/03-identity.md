# LNCP/1 — Identity

Before peers can trust or address each other, they must have durable identities.
LNCP identity is self-sovereign: a peer mints its own identity locally, with no
registration authority.

## 1. Components

A peer identity consists of:

| Component | Type | Purpose |
|-----------|------|---------|
| **Peer ID** | UUID string | The permanent, unique name of the peer. Stable across restarts and network changes. |
| **Identity key** | Ed25519 key pair | Signs beacons and authenticates the peer. The public key is the cryptographic root of the identity. |
| **TLS certificate** | self-signed X.509 | Presented on stream transports to encrypt traffic; its fingerprint binds the transport to the identity. |
| **Certificate fingerprint** | SHA-256 hex | Digest of the DER-encoded TLS certificate, advertised in beacons so peers can pin it. |
| **Nickname** | string | Human-facing display name. Not unique, not trusted, may change. |
| **Discriminator** | 4-char string | Short tag that disambiguates peers sharing a nickname. |

The **Peer ID and identity key are the identity.** Nickname and discriminator
are presentation. A peer that changes its nickname is the same peer; a peer that
changes its identity key is, by definition, a different (or compromised)
identity — see the trust rules in `04-security.md`.

## 2. Peer ID

- A Peer ID **MUST** be a UUID.
- A Peer ID **MUST** be generated once and persisted, so it survives restarts.
- Two peers **MUST NOT** knowingly share a Peer ID.

## 3. Identity key

- The identity key **MUST** be an Ed25519 key pair.
- The public key is encoded as **base64 of its SPKI DER** form wherever it
  appears on the wire (e.g. the `publicKey` field of a beacon).
- The private key **MUST** be persisted locally and **MUST NOT** ever leave the
  device.
- A conformant peer signs its beacons with this key (`04-security.md`).

## 4. TLS certificate and fingerprint

- Every peer that accepts stream connections **MUST** hold a TLS certificate. In
  LNCP/1 this is a self-signed certificate generated locally per identity; no
  certificate authority is involved.
- The **certificate fingerprint** is the lowercase hexadecimal SHA-256 digest of
  the certificate's DER encoding.
- A peer advertises this fingerprint in its beacon so that a connecting peer can
  verify, at TLS handshake time, that it reached the intended identity and not
  an impostor (`04-security.md §Transport`).

The identity key (Ed25519) and the TLS certificate serve different jobs: the
identity key authenticates *discovery*, the certificate authenticates the
*transport*. The beacon ties them together — it is signed by the identity key
and it names the certificate fingerprint — so a verified beacon vouches for the
certificate a peer will present.

## 5. Discriminator

- The discriminator **MUST** be a short string derived deterministically from
  the Peer ID (LNCP/1: the Peer ID with hyphens removed, first 4 characters),
  so any peer can compute a peer's discriminator from its ID.
- It exists only to let humans and interfaces tell apart two peers that chose the
  same nickname. It carries no trust.

## 6. Persistence

An implementation **MUST** persist, at minimum, the Peer ID, the identity key
pair, and the TLS certificate + private key, so that a peer keeps the same
identity — and therefore the same trust relationships (`04-security.md`) — across
restarts. Loss of the identity key means loss of the identity: other peers will
see a new key for a known Peer ID and treat it as a trust conflict.
