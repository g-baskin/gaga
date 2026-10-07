---
type: entity
title: "TRUSTED_KEYS"
entity_type: constant
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
tested_by: []
tags:
  - entity
  - constant
related:
  - "[[concepts/signed-update-channel]]"
sources:
  - updater.cjs:30
---

# TRUSTED_KEYS

**Built-in Ed25519 public keys allowed to sign updates.**

Defined at updater.cjs:30 as an array with one base64url public key. Default `trustedKeys` for [[entities/createUpdater]]; also imported by [[entities/update-manifest-mjs]], which refuses to write `latest.json` if its signing key doesn't match. Per the header comment, the matching private key lives only in the release workflow's secrets (updater.cjs:6-7); this wiki deliberately records nothing else about it.

Rotating the key means shipping a release with both keys in this array before switching the secret, since installed copies only trust the keys they were built with (inferred from `keys.some(...)` at updater.cjs:66; not stated in code).

## Connections

- **depends_on:** [[entities/updater-cjs]]
- **used_by:** [[entities/verifySignature]], [[entities/update-manifest-mjs]]
- **related:** [[concepts/signed-update-channel]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `updater.cjs:30`
