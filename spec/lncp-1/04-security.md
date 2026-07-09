# LNCP/1 — Security

LNCP has no central authority, so every peer is responsible for authenticating
the peers it talks to. Security rests on three mechanisms that work together:

1. **Signed discovery** — beacons are signed by the identity key, so a peer's
   announcements cannot be forged or replayed.
2. **Encrypted transport** — stream traffic runs over TLS, so it cannot be read
   or altered in transit.
3. **Trust On First Use (TOFU)** — the first identity key seen for a Peer ID is
   remembered; a later change is surfaced as a conflict, not silently accepted.

## 1. Signed discovery

Every discovery beacon (`05-discovery.md`) **MUST** be signed with the sender's
Ed25519 identity key. A receiver **MUST** verify the signature before acting on a
beacon, and **MUST** discard any beacon whose signature does not verify.

### 1.1 Canonicalization

The signature is computed over a **canonical string**: the beacon's signed
fields serialized as a JSON object whose keys appear in **strict ascending
byte order**, excluding the `type` and `signature` fields. Both signer and
verifier construct this exact string; any difference in key order, spacing, or
field selection breaks verification.

For LNCP/1 the signed fields, in canonical (sorted) order, are:

```
discriminator, fingerprint, id, nickname, port, publicKey, space, timestamp
```

The canonical string is the compact JSON serialization (no insignificant
whitespace) of an object with exactly those keys in that order. Example
(from `vectors/vectors.json`):

```json
{"discriminator":"a1b2","fingerprint":"aaaa…aaaa","id":"9f8b7c6d-1e2f-4a3b-8c9d-0e1f2a3b4c5d","nickname":"alice","port":9000,"publicKey":"MCowBQYDK2Vw…","space":"","timestamp":1751000000000}
```

> **Canonicalization is normative and fragile by nature.** An implementation
> that sorts keys differently, or includes/excludes a field, will produce
> signatures no one else accepts. Verify against the test vector before shipping.

### 1.2 Signature

- The signature algorithm is **Ed25519** (pure, no pre-hash).
- The signature is computed over the UTF-8 bytes of the canonical string.
- On the wire it is **base64-encoded** in the beacon's `signature` field.
- The signer's public key travels in the same beacon (`publicKey`), so the
  beacon is self-verifying — subject to the trust check in §3.

### 1.3 Replay protection

Every signed beacon carries a `timestamp` (milliseconds since the Unix epoch),
which is part of the signed canonical string. A receiver **MUST** reject a
beacon whose timestamp differs from local time by more than the **replay
window** of **30,000 ms (30 s)** in either direction. This bounds how long a
captured beacon can be replayed and requires only loosely synchronized clocks.

## 2. Encrypted transport

All stream traffic (`06-sessions.md`) **MUST** run over TLS.

- Peers use self-signed certificates (`03-identity.md`); there is no CA chain to
  validate, and implementations **MUST NOT** reject a peer merely for being
  self-signed or for a hostname mismatch.
- Instead, a connecting peer **MUST** authenticate the server by **certificate
  fingerprint pinning** (§2.1).

### 2.1 Fingerprint pinning

When a peer connects to another peer whose beacon it has verified, it knows the
expected certificate fingerprint from that beacon. At the TLS handshake it:

1. Reads the peer's presented certificate.
2. Computes the SHA-256 of the certificate's DER encoding.
3. Compares it to the expected fingerprint.

If the fingerprints differ, the connecting peer **MUST** abort the connection —
this is a possible impersonation. If no expected fingerprint is available (e.g.
the peer was learned without a verified beacon), the implementation **MAY**
proceed without pinning but **SHOULD** treat the peer as untrusted.

## 3. Trust On First Use

Signature verification proves a beacon was signed by *some* key. TOFU decides
whether that key is the one this peer is *supposed* to have.

An implementation **MUST** maintain a persistent **trust store** mapping
`Peer ID → identity public key`. On each verified beacon:

| Condition | Action |
|-----------|--------|
| Peer ID is unknown | **Trust**: record `(Peer ID → publicKey)`. First use establishes trust. |
| Peer ID known, key matches | **Accept**: proceed normally. |
| Peer ID known, key differs | **Conflict**: reject the beacon and surface a security warning. **MUST NOT** silently replace the stored key. |

A conflict means either the peer legitimately reset its identity or someone is
impersonating it. LNCP/1 does not decide which; it refuses the beacon and hands
the decision to the application/user. Replacing a trusted key **MUST** be an
explicit, deliberate action, never an automatic consequence of receiving a
beacon.

## 4. What LNCP/1 does and does not protect

**Protected:**

- Forged discovery announcements (signature verification).
- Replayed announcements within the trust window (timestamp + replay window).
- Impersonation of a known peer's transport (fingerprint pinning + TOFU).
- Eavesdropping and tampering on stream traffic (TLS).

**Not protected in LNCP/1 (candidates for future minor versions):**

- Per-message signing of stream payloads. Stream integrity/confidentiality comes
  from TLS + fingerprint pinning, not from signing each envelope. A future
  version **MAY** add optional payload signatures without changing existing
  packet formats.
- Mutual TLS, certificate rotation, certificate pinning to an enterprise CA.
  These are anticipated extensions and **MUST** be addable without changing
  message formats.
