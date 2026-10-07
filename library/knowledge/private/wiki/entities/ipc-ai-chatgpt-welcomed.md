---
type: entity
title: "IPC ai:chatgpt-welcomed"
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
channel: "ai:chatgpt-welcomed"
tags:
  - entity
  - ipc
related:
  - "[[concepts/ipc-trust-boundary]]"
  - "[[entities/ipc-channels]]"
sources:
  - main.cjs:569
  - preload.cjs:60
---

# IPC ai:chatgpt-welcomed

IPC channel `ai:chatgpt-welcomed`, registered with [[entities/handle]] at `main.cjs:569` (trusted-caller check applies). Mark first-run welcome as seen (soft).

## Renderer side

`window.storyloom.chatGptWelcomed` at `preload.cjs:60` (via `soft`: `{ ok }`/`{ error }` envelope)

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/account-screen]], [[entities/preload-cjs]]
- **related:** [[concepts/ipc-trust-boundary]], [[entities/ipc-channels]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:569`
- `preload.cjs:60`
