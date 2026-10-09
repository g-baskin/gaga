---
type: entity
title: "main/updates.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "main/updates.cjs"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/main-cjs]]", "[[entities/updater-cjs]]"]
tags: [entity, module]
sources:
  - main/updates.cjs
---

# main/updates.cjs

`createUpdates` owns the observable update state, while `createUpdater` owns signed-feed/download verification. `setUpdateState` sends `app:update-state`; `checkForUpdate` respects the saved preference for background checks and reports manual errors.

`downloadUpdate` moves available → downloading → ready, with progress. `installUpdate` verifies the installed target, starts the installer and requests normal app shutdown; the self-test stops before swapping the app. Its close watchdog discards the staged result and reports failure if shutdown outlasts the installer wait. `reset` clears the updater client, pending update and staged download, then publishes idle state for test service changes.

## Sources

- `main/updates.cjs` (symbols cited above; manually inspected, not AST-extracted).
