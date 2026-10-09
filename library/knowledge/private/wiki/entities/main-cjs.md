---
type: entity
title: "main.cjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "main.cjs"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/main-settings-cjs]]", "[[entities/main-ai-services-cjs]]", "[[entities/main-export-cjs]]", "[[entities/main-updates-cjs]]", "[[entities/log-cjs]]"]
tags: [entity, module]
sources:
  - main.cjs
---

# main.cjs

`main.cjs` composes `createSettings`, `createAiServices`, `createExports` and `createUpdates` through window/store getters; their implementations now live in `main/`. `registerHandlers` remains the sole IPC registration site, with `handle` checking the main window, main frame and `app://local/` origin and converting disk errors through `plainFsError`.

`reportDamaged` and `reportUnreadableBook` surface storage recovery; `createLog` receives process failures. `useTestServices` rejects normal installs and resets AI clients and update state. `serve` owns the app protocol. See [[entities/ipc-channels]] for the current bridge surface (the old 44-channel summary is obsolete).

## Sources

- `main.cjs` (symbols cited above; manually inspected, not AST-extracted).
