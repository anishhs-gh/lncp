# LNCP — Local Network Communication Protocol

[![CI](https://github.com/anishhs-gh/lncp/actions/workflows/ci.yml/badge.svg)](https://github.com/anishhs-gh/lncp/actions/workflows/ci.yml)

**An open specification for secure, zero-configuration communication between
devices on the same local network.**

LNCP defines how independent programs discover each other on a LAN, prove who
they are, and exchange messages, files, and real-time media — without a server,
an account, or any manual configuration. Any two conformant implementations, in
any language, on any platform, interoperate.

LNCP is the specification. It does not belong to any single program. Programs
depend on LNCP; LNCP depends on nothing but the operating system's network
stack.

---

## Status

- **Specification version:** LNCP/1.0 (core frozen; optional modules specified — see `spec/lncp-1/`)
- **This repository is the authority.** Where an implementation and the spec
  disagree, the spec is correct.

## Layout

```
lncp/
  spec/lncp-1/      the normative specification, one concern per document
  vectors/          language-independent conformance test vectors
  reference/        @lncp/core — the TypeScript reference implementation
```

The reference library implements every layer of the core spec plus all four
optional modules, verified byte-for-byte against the vectors — see
[`reference/README.md`](reference/README.md).

## Reading order

### Core specification

1. [`spec/lncp-1/00-overview.md`](spec/lncp-1/00-overview.md) — model, layers, terminology
2. [`spec/lncp-1/01-framing.md`](spec/lncp-1/01-framing.md) — how bytes are delimited on a transport
3. [`spec/lncp-1/02-envelope.md`](spec/lncp-1/02-envelope.md) — the universal packet structure
4. [`spec/lncp-1/03-identity.md`](spec/lncp-1/03-identity.md) — what a peer *is*
5. [`spec/lncp-1/04-security.md`](spec/lncp-1/04-security.md) — signing, encryption, trust
6. [`spec/lncp-1/05-discovery.md`](spec/lncp-1/05-discovery.md) — finding peers
7. [`spec/lncp-1/06-sessions.md`](spec/lncp-1/06-sessions.md) — connection lifecycle
8. [`spec/lncp-1/07-module-messaging.md`](spec/lncp-1/07-module-messaging.md) — the first (mandatory) module
9. [`spec/lncp-1/08-core-packets.md`](spec/lncp-1/08-core-packets.md) — SESSION_HELLO, GOODBYE, CAPABILITIES, ERROR
10. [`spec/lncp-1/registry.md`](spec/lncp-1/registry.md) — reserved codes, ports, content types, capabilities, errors

### Optional modules

11. [`spec/lncp-1/09-module-typing.md`](spec/lncp-1/09-module-typing.md) — ephemeral typing indicators
12. [`spec/lncp-1/10-module-presence.md`](spec/lncp-1/10-module-presence.md) — online status indicators
13. [`spec/lncp-1/11-module-file-transfer.md`](spec/lncp-1/11-module-file-transfer.md) — peer-to-peer file exchange
14. [`spec/lncp-1/12-module-voice.md`](spec/lncp-1/12-module-voice.md) — real-time audio calls

## Conformance

An implementation is **LNCP/1 conformant** when it:

1. Produces and accepts discovery beacons per `05-discovery.md`.
2. Frames stream traffic per `01-framing.md` and structures packets per `02-envelope.md`.
3. Reproduces every value in [`vectors/vectors.json`](vectors/vectors.json)
   (regenerate with `node vectors/generate.js`).
4. Implements the mandatory `messaging` module.

## Licensing

The intent is maximum freedom to implement:

- **Specification text** (`spec/`) and **vectors** (`vectors/`): CC0 —
  anyone may implement LNCP freely, in any language, for any purpose.
- **Reference library** (`reference/`): Apache-2.0.

A program that *uses* LNCP is free to choose its own license. Implementing the
protocol never imposes one. See [`LICENSE`](LICENSE) for the layout.

## Governance

LNCP is small and evolves deliberately. Every change to the frozen core is a
written, versioned proposal that, once accepted, is not silently altered. The
frozen core stays stable; new capability is added as **modules** and **minor
versions**, never by changing the meaning of existing packets.

How to propose changes, the minor/major rules, and the release process are in
[`CONTRIBUTING.md`](CONTRIBUTING.md). Releases are recorded in
[`CHANGELOG.md`](CHANGELOG.md). Vulnerabilities: see
[`SECURITY.md`](SECURITY.md).

## Author

**Anish Shekh** — [anishhs.com](https://anishhs.com) · GitHub:
[@anishhs-gh](https://github.com/anishhs-gh) · LinkedIn:
[anishsh](https://www.linkedin.com/in/anishsh)
