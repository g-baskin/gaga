---
type: entity
title: "IPC books:create"
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
  - "[[entities/coloring-screen]]"
  - "[[entities/home-screen]]"
  - "[[entities/templates-screen]]"
  - "[[entities/app-js]]"
  - "[[entities/preload-cjs]]"
last_commit_hash: "a5dac04"
tested_by: []
channel: "books:create"
tags:
  - entity
  - ipc
related:
  - "[[concepts/ipc-trust-boundary]]"
  - "[[entities/ipc-channels]]"
sources:
  - main.cjs:473
  - preload.cjs:15
---

# IPC books:create

IPC channel `books:create`, registered with [[entities/handle]] at `main.cjs:473` (trusted-caller check applies). Create a sanitized new book with a fresh UUID.

## Renderer side

`window.storyloom.createBook` at `preload.cjs:15`

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/coloring-screen]], [[entities/home-screen]], [[entities/templates-screen]], [[entities/app-js]], [[entities/preload-cjs]]
- **related:** [[concepts/ipc-trust-boundary]], [[entities/ipc-channels]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:473`
- `preload.cjs:15`
