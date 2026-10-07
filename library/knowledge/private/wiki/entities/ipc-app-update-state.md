---
type: entity
title: "IPC app:update-state"
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
channel: "app:update-state"
tags:
  - entity
  - service
related:
  - "[[entities/ipc-channels]]"
  - "[[concepts/signed-update-channel]]"
sources:
  - main.cjs:678
  - preload.cjs:47
---

# IPC app:update-state

**IPC channel app:update-state (in-app updates).**

IPC channel `app:update-state`, registered with [[entities/handle]] at `main.cjs:678` (trusted-caller check applies). Returns the current update state; the same channel name is also a main→page push sent by `setUpdateState` (main.cjs:202-206), received by `onUpdateState` (preload.cjs:52).

States shared with the page: `idle | checking | up-to-date | available | downloading | ready | installing | failed` (main.cjs:195-196), always with `current` = app version.

## Renderer side

`window.storyloom.updateState` at `preload.cjs:47`; used by update views in [[entities/app-js]] and [[entities/account-screen]].

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/preload-cjs]], [[entities/app-js]], [[entities/account-screen]]
- **related:** [[entities/ipc-channels]], [[concepts/signed-update-channel]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `main.cjs:678`
- `preload.cjs:47`
