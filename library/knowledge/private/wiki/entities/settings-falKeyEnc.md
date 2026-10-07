---
type: entity
title: "settings.falKeyEnc"
entity_type: config-key
status: developing
created: 2026-10-07
updated: 2026-10-07
path: "main.cjs"
language: js
depends_on:
  - "[[entities/settings-json]]"
used_by:
  - "[[entities/readSettings]]"
  - "[[entities/saveSettings]]"
last_commit_hash: "ded9f37"
tested_by: []
key: "falKeyEnc"
tags:
  - entity
  - config
related:
  - "[[entities/settings-json]]"
  - "[[entities/fal-cjs]]"
sources:
  - main.cjs
---

# settings.falKeyEnc

Field of [[entities/settings-json]].

- **Type:** string (base64 safeStorage ciphertext)
- **Default:** `""`

Encrypted fal.ai key; exposed as `hasFalKey`. Set by `falKey`, cleared by `clearFalKey`. The companion field `falImageModel` pins a fal.ai model ID (blank = automatic). Used by [[entities/fal-cjs]] when `pictures` is `fal`.

## Changes since 2add52d

Read at main.cjs:80, written at main.cjs:165-166, exposed as `hasFalKey` at main.cjs:175.

## Connections

- **depends_on:** [[entities/settings-json]]
- **used_by:** [[entities/readSettings]], [[entities/saveSettings]]
- **related:** [[entities/settings-json]], [[entities/fal-cjs]]

## History

- **Created:** commit `ded9f37` by AutomationGod on 2026-10-06.

## Sources

- `main.cjs` (`readSettings`, `saveSettingsNow`, `publicSettings`)
