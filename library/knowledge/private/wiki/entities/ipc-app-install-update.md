---
type: entity
title: "IPC app:install-update"
entity_type: service
status: developing
created: 2026-10-07
updated: 2026-10-08
path: "main.cjs"
language: js
depends_on:
  - "[[entities/main-cjs]]"
  - "[[entities/handle]]"
used_by:
  - "[[entities/preload-cjs]]"
  - "[[entities/app-js]]"
  - "[[entities/account-screen]]"
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
channel: "app:install-update"
tags:
  - entity
  - service
related:
  - "[[entities/ipc-channels]]"
  - "[[concepts/signed-update-channel]]"
sources:
  - main/updates.cjs
  - main.cjs
  - preload.cjs
---

# IPC app:install-update

**IPC channel app:install-update (in-app updates).**

IPC channel `app:install-update`, registered with [[entities/handle]] at `main.cjs` (trusted-caller check applies). Runs `installUpdate()` (`main/updates.cjs`): requires phase `ready`; [[entities/installTarget]] then [[entities/startInstall]], then quits. Self-test stops before the swap.

States shared with the page: `idle | checking | up-to-date | available | downloading | ready | installing | failed` (`main/updates.cjs`), always with `current` = app version.

## Renderer side

`window.storyloom.installUpdate` at `preload.cjs`; used by update views in [[entities/app-js]] and [[entities/account-screen]].

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/preload-cjs]], [[entities/app-js]], [[entities/account-screen]]
- **related:** [[entities/ipc-channels]], [[concepts/signed-update-channel]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `main.cjs`
- `preload.cjs`

## Ownership evidence

Handler registration remains `main.cjs` (`registerHandlers`); state/operation implementation is `main/updates.cjs` (`installUpdate`). State pushes include the current version (`main/updates.cjs` (`setUpdateState`)).
