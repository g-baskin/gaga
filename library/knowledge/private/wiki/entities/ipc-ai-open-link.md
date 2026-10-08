---
type: entity
title: "IPC ai:open-link"
entity_type: service
status: developing
created: 2026-10-06
updated: 2026-10-07
path: "main.cjs"
language: js
depends_on:
  - "[[entities/main-cjs]]"
  - "[[entities/handle]]"
used_by:
  - "[[entities/account-screen]]"
  - "[[entities/app-js]]"
  - "[[entities/preload-cjs]]"
last_commit_hash: "eb83d47"
tested_by: []
channel: "ai:open-link"
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

# IPC ai:open-link

> [!stale] Superseded 2026-10-07
> Earlier text said: three allow-listed URLs.
> Current code: five names including `fal-keys` and `source`. See [[meta/2026-10-07-contradiction-report]].

IPC channel `ai:open-link`, registered with [[entities/handle]] at `main.cjs` (trusted-caller check applies). Open one of three allow-listed URLs (chatgpt-usage, openrouter-keys, claude-code).

## Renderer side

`window.storyloom.openLink` at `preload.cjs`

## Changes since 2add52d

> [!contradiction] Contract changed; see [[meta/2026-10-07-contradiction-report]].

Allow-list now: `chatgpt-usage`, `openrouter-keys`, `fal-keys`, `claude-code`, `source` (main.cjs; preload.cjs). `source` opens the GitHub repository for the AGPL source offer.

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/account-screen]], [[entities/app-js]], [[entities/preload-cjs]]
- **related:** [[concepts/ipc-trust-boundary]], [[entities/ipc-channels]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`
- `preload.cjs`
