---
type: entity
title: "window.storyloom (preload API)"
entity_type: exported-symbol
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "preload.cjs"
language: js
depends_on:
  - "[[entities/preload-cjs]]"
used_by:
  - "[[entities/core-js]]"
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
tested_by: []
symbol_kind: "object"
is_default_export: false
tags:
  - entity
related:
  - "[[entities/ipc-channels]]"
  - "[[concepts/soft-error-ipc]]"
sources:
  - preload.cjs
---

# window.storyloom (preload API)

> [!stale] Prior description retained below
> The prior object summary listed 43 invoke methods and two subscriptions. This is not the current contract.

> [!contradiction] Verified correction 2026-10-08
> There are 52 invoke wrappers and three event subscriptions, including onUpdateState; see [[entities/ipc-channels]]. Evidence: `preload.cjs` / `contextBridge.exposeInMainWorld`. See [[meta/2026-10-08-contradiction-report]].

## Prior scan / historical description


Object exposed to the page by [[entities/preload-cjs]]; consumed as `api` in [[entities/core-js]] (renderer/core.js). 43 invoke methods + `onBeforeClose`, `onMenuAction`. See [[entities/ipc-channels]] for the mapping.

## Connections

- **depends_on:** [[entities/preload-cjs]]
- **used_by:** [[entities/core-js]]
- **related:** [[entities/ipc-channels]], [[concepts/soft-error-ipc]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `preload.cjs`
