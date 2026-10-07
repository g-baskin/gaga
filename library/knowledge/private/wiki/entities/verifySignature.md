---
type: entity
title: "verifySignature"
entity_type: function
status: developing
created: 2026-10-07
updated: 2026-10-07
path: "updater.cjs"
language: js
depends_on:
  - "[[entities/signedMessage]]"
  - "[[entities/TRUSTED_KEYS]]"
used_by:
  - "[[entities/createUpdater]]"
  - "[[entities/update-manifest-mjs]]"
last_commit_hash: "eb83d47"
tested_by:
  - test/updater.test.cjs
tags:
  - entity
  - function
related:
  - "[[concepts/signed-update-channel]]"
sources:
  - updater.cjs:58
  - updater.cjs:62
---

# verifySignature

**Ed25519 check of a manifest entry against any trusted public key.**

## Signature

```js
function verifySignature(entry, keys) // → boolean
```

Defined at updater.cjs:62. Base64-decodes `entry.signature`, requires 64 bytes, builds the [[entities/signedMessage]], and returns true if any key in `keys` verifies it. Keys are raw base64url `x` values turned into JWK OKP/Ed25519 public keys by `publicKey()` (updater.cjs:58). Never throws. Used by `check()` in [[entities/createUpdater]] (updater.cjs:134) and as a self-check in [[entities/update-manifest-mjs]] (scripts/update-manifest.mjs:43).

## Connections

- **depends_on:** [[entities/signedMessage]], [[entities/TRUSTED_KEYS]]
- **used_by:** [[entities/createUpdater]], [[entities/update-manifest-mjs]]
- **related:** [[concepts/signed-update-channel]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `updater.cjs:58`
- `updater.cjs:62`
