---
type: entity
title: "IPC characters:save"
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
  - "[[entities/preload-cjs]]"
last_commit_hash: "a5dac04"
tested_by: []
channel: "characters:save"
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

# IPC characters:save

IPC channel `characters:save`, registered with [[entities/handle]] at `main.cjs` (trusted-caller check applies). Save a character (optionally copying its picture from a book).

## Renderer side

`window.storyloom.saveCharacter` at `preload.cjs`

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/story-builder-screen]], [[entities/preload-cjs]]
- **related:** [[concepts/ipc-trust-boundary]], [[entities/ipc-channels]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`
- `preload.cjs`
