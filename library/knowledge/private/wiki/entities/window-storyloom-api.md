---
type: entity
title: "window.storyloom (preload API)"
entity_type: exported-symbol
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "preload.cjs"
language: js
depends_on:
  - "[[entities/preload-cjs]]"
used_by:
  - "[[entities/core-js]]"
last_commit_hash: "a5dac04"
tested_by: []
symbol_kind: "object"
is_default_export: false
tags:
  - entity
related:
  - "[[entities/ipc-channels]]"
  - "[[concepts/soft-error-ipc]]"
sources:
  - preload.cjs:12
---

# window.storyloom (preload API)

Object exposed to the page by [[entities/preload-cjs]]; consumed as `api` in [[entities/core-js]] (renderer/core.js:3). 43 invoke methods + `onBeforeClose`, `onMenuAction`. See [[entities/ipc-channels]] for the mapping.

## Connections

- **depends_on:** [[entities/preload-cjs]]
- **used_by:** [[entities/core-js]]
- **related:** [[entities/ipc-channels]], [[concepts/soft-error-ipc]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `preload.cjs:12`
