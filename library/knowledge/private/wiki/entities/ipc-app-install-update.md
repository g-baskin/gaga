---
type: entity
title: "IPC app:install-update"
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
channel: "app:install-update"
tags:
  - entity
  - service
related:
  - "[[entities/ipc-channels]]"
  - "[[concepts/signed-update-channel]]"
sources:
  - main.cjs:681
  - preload.cjs:50
---

# IPC app:install-update

**IPC channel app:install-update (in-app updates).**

IPC channel `app:install-update`, registered with [[entities/handle]] at `main.cjs:681` (trusted-caller check applies). Runs `installUpdate()` (main.cjs:261): requires phase `ready`; [[entities/installTarget]] then [[entities/startInstall]], then quits. Self-test stops before the swap.

States shared with the page: `idle | checking | up-to-date | available | downloading | ready | installing | failed` (main.cjs:195-196), always with `current` = app version.

## Renderer side

`window.storyloom.installUpdate` at `preload.cjs:50`; used by update views in [[entities/app-js]] and [[entities/account-screen]].

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/preload-cjs]], [[entities/app-js]], [[entities/account-screen]]
- **related:** [[entities/ipc-channels]], [[concepts/signed-update-channel]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `main.cjs:681`
- `preload.cjs:50`
