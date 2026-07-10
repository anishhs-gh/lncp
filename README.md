# LNCP — Local Network Communication Protocol

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

- **Specification version:** LNCP/1 (frozen core in progress — see `spec/lncp-1/`)
- **This repository is the authority.** Where an implementation and the spec
  disagree, the spec is correct.

## Layout

```
lncp/
  spec/lncp-1/      the normative specification, one concern per document
  vectors/          language-independent conformance test vectors
  reference/        the reference library (extracted over time)
```

## Reading order

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

## Conformance

An implementation is **LNCP/1 conformant** when it:

1. Produces and accepts discovery beacons per `05-discovery.md`.
2. Frames stream traffic per `01-framing.md` and structures packets per `02-envelope.md`.
3. Reproduces every value in [`vectors/vectors.json`](vectors/vectors.json)
   (regenerate with `node vectors/generate.js`).
4. Implements the mandatory `messaging` module.

## Licensing

The intent is maximum freedom to implement:

- **Specification text** (`spec/`, `vectors/`): released so that anyone may
  implement LNCP freely, in any language, for any purpose. Target: CC0 or CC-BY.
- **Reference library** (`reference/`): permissive open source. Target: Apache-2.0.

A program that *uses* LNCP is free to choose its own license. Implementing the
protocol never imposes one.

## Governance

LNCP is small and evolves deliberately. Every change to the frozen core is a
written, versioned proposal that, once accepted, is not silently altered. The
frozen core stays stable; new capability is added as **modules** and **minor
versions**, never by changing the meaning of existing packets.
