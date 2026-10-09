---
type: entity
title: "settings.falKeyEnc"
entity_type: config-key
status: developing
created: 2026-10-07
updated: 2026-10-08
path: "main/settings.cjs"
language: js
depends_on:
  - "[[entities/settings-json]]"
used_by:
  - "[[entities/readSettings]]"
  - "[[entities/saveSettings]]"
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
key: "falKeyEnc"
tags:
  - entity
  - config
related:
  - "[[entities/settings-json]]"
  - "[[entities/fal-cjs]]"
sources:
  - main/settings.cjs
---

# settings.falKeyEnc

Field of [[entities/settings-json]].

- **Type:** string (base64 safeStorage ciphertext)
- **Default:** `""`

Encrypted fal.ai key; exposed as `hasFalKey`. Set by `falKey`, cleared by `clearFalKey`. The companion field `falImageModel` pins a fal.ai model ID (blank = automatic). Used by [[entities/fal-cjs]] when `pictures` is `fal`.

## Changes since 2add52d

Read at main/settings.cjs, written at main/settings.cjs, exposed as `hasFalKey` at main/settings.cjs.

## Connections

- **depends_on:** [[entities/settings-json]]
- **used_by:** [[entities/readSettings]], [[entities/saveSettings]]
- **related:** [[entities/settings-json]], [[entities/fal-cjs]]

## History

- **Created:** commit `ded9f37` by AutomationGod on 2026-10-06.

## Sources

- `main/settings.cjs` (`readSettings`, `saveSettingsNow`, `publicSettings`)

## Source ownership

Implementation moved to `main/settings.cjs` (factory-scoped symbols); IPC registration remains in `main.cjs` / `registerHandlers`. This is a source-location correction, not an inferred behavior change.
