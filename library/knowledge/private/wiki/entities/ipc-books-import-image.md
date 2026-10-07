---
type: entity
title: "IPC books:import-image"
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
  - "[[entities/story-builder-screen]]"
  - "[[entities/editor-js]]"
  - "[[entities/preload-cjs]]"
last_commit_hash: "a5dac04"
tested_by: []
channel: "books:import-image"
tags:
  - entity
  - ipc
related:
  - "[[concepts/ipc-trust-boundary]]"
  - "[[entities/ipc-channels]]"
sources:
  - main.cjs:498
  - preload.cjs:22
---

# IPC books:import-image

IPC channel `books:import-image`, registered with [[entities/handle]] at `main.cjs:498` (trusted-caller check applies). Open-file dialog, sniff and copy an image into the book.

## Renderer side

`window.storyloom.importImage` at `preload.cjs:22`

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/story-builder-screen]], [[entities/editor-js]], [[entities/preload-cjs]]
- **related:** [[concepts/ipc-trust-boundary]], [[entities/ipc-channels]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:498`
- `preload.cjs:22`
