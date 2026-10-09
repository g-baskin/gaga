---
type: entity
title: "ipc-app-open-logs"
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

# ipc-app-open-logs

`app:open-logs` is registered by `registerHandlers` through the guarded `handle` wrapper. Preload method: `openLogs`. Creates the local log directory and opens it with shell.openPath; returns true directly during self-test.

Evidence: `main.cjs` / `registerHandlers`, `preload.cjs` / `openLogs`.
