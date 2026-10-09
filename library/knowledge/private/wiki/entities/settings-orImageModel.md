---
type: entity
title: "settings.orImageModel"
entity_type: config-key
status: developing
created: 2026-10-06
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
key: "orImageModel"
tags:
  - entity
  - config
related:
  - "[[entities/settings-json]]"
sources:
  - main/settings.cjs
---

# settings.orImageModel

Field of [[entities/settings-json]].

- **Type:** string
- **Default:** `""`

Pinned OpenRouter picture model.

Read/coerced in [[entities/readSettings]] (`main/settings.cjs`), validated in [[entities/saveSettings]] (`main/settings.cjs`).

## Connections

- **depends_on:** [[entities/settings-json]]
- **used_by:** [[entities/readSettings]], [[entities/saveSettings]]
- **related:** [[entities/settings-json]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main/settings.cjs`

## Source ownership

Implementation moved to `main/settings.cjs` (factory-scoped symbols); IPC registration remains in `main.cjs` / `registerHandlers`. This is a source-location correction, not an inferred behavior change.
