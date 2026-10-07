---
type: entity
title: "IPC books:save-recording"
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
  - "[[entities/studio-screen]]"
  - "[[entities/preload-cjs]]"
last_commit_hash: "a5dac04"
tested_by: []
channel: "books:save-recording"
tags:
  - entity
  - ipc
related:
  - "[[concepts/ipc-trust-boundary]]"
  - "[[entities/ipc-channels]]"
sources:
  - main.cjs:510
  - preload.cjs:27
---

# IPC books:save-recording

IPC channel `books:save-recording`, registered with [[entities/handle]] at `main.cjs:510` (trusted-caller check applies). Store microphone recording bytes.

## Renderer side

`window.storyloom.saveRecording` at `preload.cjs:27`

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/studio-screen]], [[entities/preload-cjs]]
- **related:** [[concepts/ipc-trust-boundary]], [[entities/ipc-channels]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:510`
- `preload.cjs:27`
