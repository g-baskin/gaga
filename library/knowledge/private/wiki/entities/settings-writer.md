---
type: entity
title: "settings.writer"
entity_type: config-key
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "main.cjs"
language: js
depends_on:
  - "[[entities/settings-json]]"
used_by:
  - "[[entities/readSettings]]"
  - "[[entities/saveSettings]]"
last_commit_hash: "a5dac04"
tested_by: []
key: "writer"
tags:
  - entity
  - config
related:
  - "[[entities/settings-json]]"
sources:
  - main.cjs
---

# settings.writer

Field of [[entities/settings-json]].

- **Type:** enum custom|openrouter|chatgpt|claude
- **Default:** `custom`

Which service writes text; drives [[entities/writeText]].

Read/coerced in [[entities/readSettings]] (`main.cjs`), validated in [[entities/saveSettings]] (`main.cjs`).

## Connections

- **depends_on:** [[entities/settings-json]]
- **used_by:** [[entities/readSettings]], [[entities/saveSettings]]
- **related:** [[entities/settings-json]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`
