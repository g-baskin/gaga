---
type: entity
title: "ipc-app-log-error"
entity_type: service
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "main.cjs"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/log-cjs]]", "[[entities/preload-cjs]]"]
tags: [entity, service]
sources:
  - main.cjs
---

# ipc-app-log-error

`app:log-error` is registered by `registerHandlers` through the guarded `handle` wrapper. Preload method: `logError`. Accepts at most 200 entries per session; truncates message to 2000 characters and stack to 6000 before writing locally; later entries return false.

Evidence: `main.cjs` / `registerHandlers`, `preload.cjs` / `logError`.
