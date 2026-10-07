---
type: entity
title: "IPC ai:chatgpt-sign-out"
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
channel: "ai:chatgpt-sign-out"
tags:
  - entity
  - ipc
related:
  - "[[concepts/ipc-trust-boundary]]"
  - "[[entities/ipc-channels]]"
sources:
  - main.cjs:570
  - preload.cjs:61
---

# IPC ai:chatgpt-sign-out

IPC channel `ai:chatgpt-sign-out`, registered with [[entities/handle]] at `main.cjs:570` (trusted-caller check applies). Revoke and forget ChatGPT tokens (soft).

## Renderer side

`window.storyloom.chatGptSignOut` at `preload.cjs:61` (via `soft`: `{ ok }`/`{ error }` envelope)

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/account-screen]], [[entities/preload-cjs]]
- **related:** [[concepts/ipc-trust-boundary]], [[entities/ipc-channels]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:570`
- `preload.cjs:61`
