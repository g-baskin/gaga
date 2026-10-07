---
type: entity
title: "IPC app:download-update"
entity_type: service
status: developing
created: 2026-10-07
updated: 2026-10-07
path: "main.cjs"
language: js
depends_on:
  - "[[entities/main-cjs]]"
  - "[[entities/handle]]"
used_by:
  - "[[entities/preload-cjs]]"
  - "[[entities/app-js]]"
  - "[[entities/account-screen]]"
last_commit_hash: "eb83d47"
tested_by: []
channel: "app:download-update"
tags:
  - entity
  - service
related:
  - "[[entities/ipc-channels]]"
  - "[[concepts/signed-update-channel]]"
sources:
  - main.cjs:680
  - preload.cjs:49
---

# IPC app:download-update

**IPC channel app:download-update (in-app updates).**

IPC channel `app:download-update`, registered with [[entities/handle]] at `main.cjs:680` (trusted-caller check applies). Runs `downloadUpdate()` (main.cjs:248): requires phase `available`; reports `downloading` with percent, then `ready` or `failed`.

States shared with the page: `idle | checking | up-to-date | available | downloading | ready | installing | failed` (main.cjs:195-196), always with `current` = app version.

## Renderer side

`window.storyloom.downloadUpdate` at `preload.cjs:49`; used by update views in [[entities/app-js]] and [[entities/account-screen]].

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/preload-cjs]], [[entities/app-js]], [[entities/account-screen]]
- **related:** [[entities/ipc-channels]], [[concepts/signed-update-channel]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `main.cjs:680`
- `preload.cjs:49`
