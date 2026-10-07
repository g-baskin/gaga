---
type: entity
title: "IPC ai:chapter"
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
  - "[[entities/manuscript-screen]]"
  - "[[entities/preload-cjs]]"
last_commit_hash: "a5dac04"
tested_by: []
channel: "ai:chapter"
tags:
  - entity
  - ipc
related:
  - "[[concepts/ipc-trust-boundary]]"
  - "[[entities/ipc-channels]]"
sources:
  - main.cjs:558
  - preload.cjs:53
---

# IPC ai:chapter

IPC channel `ai:chapter`, registered with [[entities/handle]] at `main.cjs:558` (trusted-caller check applies). [[entities/generateChapter]].

## Renderer side

`window.storyloom.generateChapter` at `preload.cjs:53`

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/manuscript-screen]], [[entities/preload-cjs]]
- **related:** [[concepts/ipc-trust-boundary]], [[entities/ipc-channels]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:558`
- `preload.cjs:53`
