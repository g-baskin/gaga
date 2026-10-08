---
type: entity
title: "IPC characters:list"
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
channel: "characters:list"
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

# IPC characters:list

IPC channel `characters:list`, registered with [[entities/handle]] at `main.cjs` (trusted-caller check applies). Read the reusable character library.

## Renderer side

`window.storyloom.listCharacters` at `preload.cjs`

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/story-builder-screen]], [[entities/preload-cjs]]
- **related:** [[concepts/ipc-trust-boundary]], [[entities/ipc-channels]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`
- `preload.cjs`
