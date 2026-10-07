---
type: entity
title: "settings.pictures"
entity_type: config-key
status: developing
created: 2026-10-06
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
key: "pictures"
tags:
  - entity
  - config
related:
  - "[[concepts/picture-service-routing]]"
  - "[[entities/settings-json]]"
sources:
  - main.cjs:64
  - main.cjs:108
---

# settings.pictures

> [!contradiction] Changed since 2add52d; see [[meta/2026-10-07-contradiction-report]].

Field of [[entities/settings-json]].

- **Type:** enum custom|openrouter
- **Default:** `custom`

Which service makes pictures.

Read/coerced in [[entities/readSettings]] (`main.cjs:64`), validated in [[entities/saveSettings]] (`main.cjs:108`).

## Changes since 2add52d

Allowed values are now `custom`, `openrouter`, `fal` (main.cjs:67). See [[concepts/picture-service-routing]].

## Connections

- **depends_on:** [[entities/settings-json]]
- **used_by:** [[entities/readSettings]], [[entities/saveSettings]]
- **related:** [[entities/settings-json]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:64`
- `main.cjs:108`
