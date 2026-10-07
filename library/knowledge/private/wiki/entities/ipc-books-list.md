---
type: entity
title: "IPC books:list"
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
  - "[[entities/bookshelf-screen]]"
  - "[[entities/coloring-screen]]"
  - "[[entities/home-screen]]"
  - "[[entities/orders-screen]]"
  - "[[entities/templates-screen]]"
  - "[[entities/preload-cjs]]"
last_commit_hash: "a5dac04"
tested_by: []
channel: "books:list"
tags:
  - entity
  - ipc
related:
  - "[[concepts/ipc-trust-boundary]]"
  - "[[entities/ipc-channels]]"
sources:
  - main.cjs:472
  - preload.cjs:14
---

# IPC books:list

IPC channel `books:list`, registered with [[entities/handle]] at `main.cjs:472` (trusted-caller check applies). List book summaries (id, kind, title, cover page, pageCount) newest-first via store.list.

## Renderer side

`window.storyloom.listBooks` at `preload.cjs:14`

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/bookshelf-screen]], [[entities/coloring-screen]], [[entities/home-screen]], [[entities/orders-screen]], [[entities/templates-screen]], [[entities/preload-cjs]]
- **related:** [[concepts/ipc-trust-boundary]], [[entities/ipc-channels]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:472`
- `preload.cjs:14`
