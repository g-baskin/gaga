---
type: entity
title: "IPC books:reveal-export"
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
  - "[[entities/export-screen]]"
  - "[[entities/editor-js]]"
  - "[[entities/preload-cjs]]"
last_commit_hash: "a5dac04"
tested_by: []
channel: "books:reveal-export"
tags:
  - entity
  - ipc
related:
  - "[[concepts/ipc-trust-boundary]]"
  - "[[entities/ipc-channels]]"
sources:
  - main.cjs:544
  - preload.cjs:42
---

# IPC books:reveal-export

IPC channel `books:reveal-export`, registered with [[entities/handle]] at `main.cjs:544` (trusted-caller check applies). Show the last exported file in Finder.

## Renderer side

`window.storyloom.revealExport` at `preload.cjs:42`

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/export-screen]], [[entities/editor-js]], [[entities/preload-cjs]]
- **related:** [[concepts/ipc-trust-boundary]], [[entities/ipc-channels]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:544`
- `preload.cjs:42`
