---
type: entity
title: "settings.baseUrl"
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
key: "baseUrl"
tags:
  - entity
  - config
related:
  - "[[entities/settings-json]]"
sources:
  - main.cjs:64
  - main.cjs:108
---

# settings.baseUrl

Field of [[entities/settings-json]].

- **Type:** string (URL)
- **Default:** `""`

Address of the user's own OpenAI-compatible service; https only, http allowed for localhost/127.0.0.1/[::1]; hash, query and trailing slashes stripped (`checkBaseUrl`).

Read/coerced in [[entities/readSettings]] (`main.cjs:64`), validated in [[entities/saveSettings]] (`main.cjs:108`).

## Connections

- **depends_on:** [[entities/settings-json]]
- **used_by:** [[entities/readSettings]], [[entities/saveSettings]]
- **related:** [[entities/settings-json]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:64`
- `main.cjs:108`
