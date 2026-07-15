# Changelog

All notable changes to this repository are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Two things are versioned here, deliberately in lockstep for the 1.0 release:

- **The LNCP specification** (`spec/lncp-1/`) — versioned as `LNCP/MAJOR.MINOR`
  per the rules in `spec/lncp-1/registry.md §6`.
- **The reference library** (`reference/`, `@lncp/core`) — versioned with
  [semver](https://semver.org). The library's major.minor tracks the highest
  spec version it fully implements.

## [1.0.0] - 2026-07-15

First public release. Everything below is new.

### Specification — LNCP/1.0

**Core (frozen):**

- `00-overview.md` — protocol model, six layers, terminology, versioning rules,
  normative design constraints.
- `01-framing.md` — length-prefixed stream framing `[u32 BE len][u8 c-type][body]`;
  datagram transport rules.
- `02-envelope.md` — the universal packet structure (`v`, `type`, `id`, `re`,
  `realm`); unknown-field/unknown-type tolerance rules.
- `03-identity.md` — Peer ID, Ed25519 identity key, TLS certificate +
  fingerprint, discriminator.
- `04-security.md` — beacon signing with alphabetical-JSON canonicalization,
  30-second replay window, TLS fingerprint pinning, trust-on-first-use.
- `05-discovery.md` — discovery as a pluggable interface; the signed UDP
  `HELLO` beacon profile; realms.
- `06-sessions.md` — one-shot vs. persistent sessions, `PING`/`PONG`, dispatch.
- `07-module-messaging.md` — `MESSAGE` / `MESSAGE_ACK`, the one mandatory module.
- `08-core-packets.md` — `SESSION_HELLO` (version negotiation), `GOODBYE`,
  `CAPABILITIES`, `ERROR`.
- `registry.md` — reserved type codes, ports, content types, capabilities,
  error codes, and the rules for changing them.

**Optional modules:**

- `09-module-typing.md` — `TYPING` / `STOP_TYPING` ephemeral typing indicators.
- `10-module-presence.md` — `PRESENCE` online/away/busy/offline status.
- `11-module-file-transfer.md` — offer/accept/reject negotiation, chunked
  transfer, pause/resume, cancel (`FILE_*`, 8 packet types).
- `12-module-voice.md` — real-time audio call signaling over the control
  channel with encrypted UDP media (`CALL_*`, 5 packet types).

### Conformance vectors

- `vectors/generate.js` — deterministic generator (fixed Ed25519 seed);
  `vectors/vectors.json` is byte-for-byte reproducible on any machine.
- Vectors cover: key derivation, canonical signing string, Ed25519 signature,
  full `HELLO` wire bytes, framed `MESSAGE` bytes.

### Reference library — @lncp/core 1.0.0

- TypeScript, strict, ESM, no runtime dependencies. Pure and deterministic:
  builds/parses/signs/verifies packets; transport wiring is left to the host
  program.
- Implements every layer of the core spec plus all four optional modules
  (typing, presence, file-transfer, voice).
- Conformance-tested byte-for-byte against `vectors/vectors.json`, plus
  behavior tests for framing edge cases, replay window, TOFU conflicts, and
  every module packet builder/type guard (73 tests).

### Licensing

- Specification text and vectors: CC0 (unrestricted implementation).
- Reference library: Apache-2.0.

[1.0.0]: https://github.com/anishhs-gh/lncp/releases/tag/v1.0.0
