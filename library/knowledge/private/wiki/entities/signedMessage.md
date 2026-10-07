---
type: entity
title: "signedMessage"
entity_type: function
status: developing
created: 2026-10-07
updated: 2026-10-07
path: "updater.cjs"
language: js
depends_on:
  - "[[entities/updater-cjs]]"
used_by:
  - "[[entities/verifySignature]]"
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
  - updater.cjs:54
  - scripts/update-manifest.mjs:42
---

# signedMessage

**The exact bytes signed for one update download; shared by app and release script.**

## Signature

```js
function signedMessage({ version, platform, file, sha256, size }) // → Buffer
```

Defined at updater.cjs:54. UTF-8 join with `\n` of `storyloom-update-v1`, version, platform key, file name, SHA-256 hex, and size. Binding version and platform into the message is what blocks rollback and cross-chip swaps (updater.cjs:5-6). Used by [[entities/verifySignature]] and by [[entities/update-manifest-mjs]] when signing.

## Connections

- **depends_on:** [[entities/updater-cjs]]
- **used_by:** [[entities/verifySignature]], [[entities/update-manifest-mjs]]
- **related:** [[concepts/signed-update-channel]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `updater.cjs:54`
- `scripts/update-manifest.mjs:42`
