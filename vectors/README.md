# LNCP/1 — Conformance Test Vectors

These vectors let any implementation, in any language, prove it matches the
specification byte-for-byte — without reading another implementation's source.

## Files

- **`generate.js`** — the deterministic generator. Every input is fixed; the
  identity key is derived from a fixed 32-byte seed via the standard PKCS8
  Ed25519 wrapper, so output is identical on every machine and language.
- **`vectors.json`** — the frozen output of `generate.js`.

## Reproduce

```bash
node generate.js > vectors.json   # must reproduce the committed file exactly
```

## What each vector proves

| Vector | Proves your implementation agrees on… |
|--------|----------------------------------------|
| `identity` | Ed25519 key derivation from a seed and SPKI/base64 public-key encoding. |
| `discoveryBeacon.canonicalSignInput` | The exact canonical string that gets signed (`spec/lncp-1/04-security.md §1.1`). Reproduce this string and you will interoperate on signatures. |
| `discoveryBeacon.signatureB64` | Your Ed25519 signature over the canonical string matches. |
| `discoveryBeacon.wirePacketBytesHex` | The complete `HELLO` datagram on the wire (`05-discovery.md`). |
| `streamMessageFrame.frameBytesHex` | Length-prefixed framing of a JSON `MESSAGE` (`01-framing.md §3`, `07-module-messaging.md`). First 5 bytes `00 00 00 bf 01` = length 191, content-type 1 (JSON). |

## Minimum conformance check

A conformant LNCP/1 implementation, given the fixed seed and beacon inputs in
`vectors.json`, **MUST**:

1. Derive the same `publicKeyB64`.
2. Construct the identical `canonicalSignInput` string.
3. Produce a signature that verifies against the public key (Ed25519 signatures
   are deterministic, so it will equal `signatureB64`).
4. Parse `wirePacketBytesHex` back into the documented beacon fields and verify
   the signature.
5. Encode and decode `streamMessageFrame.frameBytesHex` per the framing rules.
