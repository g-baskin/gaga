---
type: entity
title: "preload.cjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "preload.cjs"
language: js
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/ipc-channels]]", "[[entities/window-storyloom-api]]"]
tags: [entity, module]
sources:
  - preload.cjs
---

# preload.cjs

`contextBridge.exposeInMainWorld` exposes only the named `storyloom` methods. `call` invokes IPC; `soft` unwraps `{ ok }` or throws `{ error }`; `saveSettings` separately unwraps `{ settings }`.

The bridge includes `scenePrompts`, `logError` and `openLogs`, as well as update actions. Event subscriptions are `onBeforeClose`, `onMenuAction` (undo/redo only) and `onUpdateState`. The authoritative current map is [[entities/ipc-channels]]; the prior two-subscription description is incomplete.

## Sources

- `preload.cjs` (symbols cited above; manually inspected, not AST-extracted).
