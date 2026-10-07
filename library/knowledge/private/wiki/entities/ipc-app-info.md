---
type: entity
title: "IPC app:info"
entity_type: service
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "main.cjs"
language: js
depends_on:
  - "[[entities/main-cjs]]"
  - "[[entities/handle]]"
used_by:
  - "[[entities/account-screen]]"
  - "[[entities/preload-cjs]]"
last_commit_hash: "a5dac04"
tested_by: []
channel: "app:info"
tags:
  - entity
  - ipc
related:
  - "[[concepts/ipc-trust-boundary]]"
  - "[[entities/ipc-channels]]"
sources:
  - main.cjs:546
  - preload.cjs:45
---

# IPC app:info

IPC channel `app:info`, registered with [[entities/handle]] at `main.cjs:546` (trusted-caller check applies). Return `{ version, dataFolder, platform }`.

## Renderer side

`window.storyloom.appInfo` at `preload.cjs:45`

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/account-screen]], [[entities/preload-cjs]]
- **related:** [[concepts/ipc-trust-boundary]], [[entities/ipc-channels]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:546`
- `preload.cjs:45`
