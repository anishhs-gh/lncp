# Security Policy

## Reporting a vulnerability

LNCP is a security-bearing protocol (identity keys, signed discovery,
fingerprint pinning, trust-on-first-use). If you find a weakness in either the
**specification** (a protocol-level flaw any conformant implementation would
inherit) or the **reference library**, please report it privately rather than
opening a public issue:

- Use GitHub's **"Report a vulnerability"** (Security → Advisories) on this
  repository.

Please include: the affected document/section or source file, a description of
the attack, and — for library issues — a proof-of-concept if possible.

You can expect an acknowledgement within 7 days. Protocol-level flaws are
handled as spec errata with a changelog entry; library flaws are fixed in a
patch release.

## Scope

| In scope | Out of scope |
|----------|--------------|
| Signature bypass / canonicalization ambiguity | Vulnerabilities in applications that use LNCP |
| Replay-window or TOFU logic flaws | Denial of service by a peer on the same LAN flooding UDP (inherent to the medium) |
| Fingerprint-pinning bypass | Vulnerabilities in Node.js or the OS crypto stack |
| Frame-decoder memory-safety issues (oversize, malformed input) | |

## Supported versions

Only the latest released version of the spec and `@lncp/core` receives fixes.
