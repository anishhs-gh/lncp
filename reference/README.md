# @lncp/core

The **LNCP/1 reference implementation** — the executable form of
[`../spec/lncp-1`](../spec/lncp-1). It implements the protocol layers a peer
needs to interoperate, and is verified byte-for-byte against
[`../vectors/vectors.json`](../vectors/vectors.json).

Written in TypeScript. Pure and deterministic: it builds, parses, signs, and
verifies packets, but does not open sockets — transport wiring belongs to the
host program (e.g. lnchat). That separation is deliberate; it keeps the protocol
logic testable and transport-agnostic.

## Modules

### Core (mandatory)

| Module | Spec | Responsibility |
|--------|------|----------------|
| `registry` | `registry.md` | Type codes, ports, content types, capabilities, error codes. |
| `identity` | `03-identity.md` | Peer ID, Ed25519 keys, discriminator, cert fingerprint. |
| `security` | `04-security.md` | Beacon canonicalization, sign/verify, replay window, TOFU trust store. |
| `framing` | `01-framing.md` | Length-prefixed stream frames; incremental decoder. |
| `envelope` | `02-envelope.md` | Envelope and peer-summary types. |
| `discovery` | `05-discovery.md` | Build/parse/verify `HELLO` beacons; full receive pipeline. |
| `messaging` | `07-module-messaging.md` | `MESSAGE` / `MESSAGE_ACK`. |
| `core-packets` | `08-core-packets.md` | `SESSION_HELLO`, `GOODBYE`, `CAPABILITIES`, `ERROR`, `PING`/`PONG`, version negotiation. |

### Optional modules

| Module | Spec | Responsibility |
|--------|------|----------------|
| `typing` | `09-module-typing.md` | `TYPING` / `STOP_TYPING` — ephemeral typing indicators. |
| `presence` | `10-module-presence.md` | `PRESENCE` — online status indicators. |
| `file-transfer` | `11-module-file-transfer.md` | `FILE_OFFER`/`ACCEPT`/`REJECT`/`READY`/`CANCEL`/`PAUSE`/`RESUME` — peer-to-peer file exchange. |
| `voice` | `12-module-voice.md` | `CALL_OFFER`/`ACCEPT`/`REJECT`/`BUSY`/`END` — real-time audio calls. |

## Use

```bash
npm install
npm run build       # emit dist/ (JS + .d.ts)
npm run typecheck   # strict type check, no emit
npm test            # conformance + behavior tests
```

### Core usage

```ts
import { generateIdentity, buildBeacon, verifyBeacon, parseBeacon, buildMessage, encodeJsonFrame } from '@lncp/core';

const me = generateIdentity();
const beacon = buildBeacon(
  { id: me.peerId, nickname: 'alice', discriminator: 'a1b2', port: 9000, fingerprint: null },
  me.privateKey,
  me.publicKey,
);
// … send JSON.stringify(beacon) as a UDP datagram; the peer runs:
const packet = parseBeacon(datagram);
const result = packet && verifyBeacon(packet, { selfId: me.peerId });
```

### Optional modules usage

```ts
import {
  // Typing
  buildTyping, buildStopTyping, isTyping, isStopTyping,
  // Presence
  buildPresence, isPresence, PresenceStatus,
  // File transfer
  buildFileOffer, buildFileAccept, buildFileReject, buildFileReady,
  buildFileCancel, buildFilePause, buildFileResume, buildFileResumeRequest,
  generateTransferId, isFileOffer, isFileAccept, /* ... */
  // Voice
  buildCallOffer, buildCallAccept, buildCallReject, buildCallBusy, buildCallEnd,
  generateCallId, generateMediaKey, isCallOffer, isCallAccept, /* ... */
} from '@lncp/core';

// Typing indicator
const typingPacket = buildTyping();
const stopTypingPacket = buildStopTyping();

// Presence status
const presencePacket = buildPresence('busy', 'in a meeting');

// File transfer
const fileOffer = buildFileOffer('document.pdf', 1024 * 1024, {
  hash: 'sha256:abc123...',
  chunkSize: 65536,
});
const fileAccept = buildFileAccept(fileOffer.id, 32768);

// Voice call
const mediaKey = generateMediaKey();
const callOffer = buildCallOffer(
  { id: me.peerId, nickname: 'alice', discriminator: 'a1b2' },
  49152, // media port
  mediaKey,
);
const callAccept = buildCallAccept(callOffer.callId, peer, 49153);
```

## Conformance

`npm test` loads the language-independent vectors and asserts this library
reproduces the public key, canonical signing string, Ed25519 signature, the full
`HELLO` wire bytes, and the framed `MESSAGE` bytes exactly. Any implementation in
any language that passes the same checks interoperates with this one.

## License

Apache-2.0. The specification it implements is separately licensed for
unrestricted implementation; see the repository root.
