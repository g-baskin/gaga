---
type: entity
title: "IPC settings:get"
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
  - "[[entities/app-js]]"
  - "[[entities/preload-cjs]]"
last_commit_hash: "a5dac04"
tested_by: []
channel: "settings:get"
tags:
  - entity
  - ipc
related:
  - "[[concepts/ipc-trust-boundary]]"
  - "[[entities/ipc-channels]]"
sources:
  - main.cjs
  - preload.cjs
---

# IPC settings:get

IPC channel `settings:get`, registered with [[entities/handle]] at `main.cjs` (trusted-caller check applies). Return [[entities/publicSettings]] (no secrets).

## Renderer side

`window.storyloom.getSettings` at `preload.cjs`

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/account-screen]], [[entities/app-js]], [[entities/preload-cjs]]
- **related:** [[concepts/ipc-trust-boundary]], [[entities/ipc-channels]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`
- `preload.cjs`
