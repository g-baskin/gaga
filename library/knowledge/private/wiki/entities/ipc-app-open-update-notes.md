---
type: entity
title: "IPC app:open-update-notes"
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
channel: "app:open-update-notes"
tags:
  - entity
  - service
related:
  - "[[entities/ipc-channels]]"
  - "[[concepts/signed-update-channel]]"
sources:
  - main.cjs
  - preload.cjs
---

# IPC app:open-update-notes

**IPC channel app:open-update-notes (in-app updates).**

IPC channel `app:open-update-notes`, registered with [[entities/handle]] at `main.cjs` (trusted-caller check applies). Opens `updateState.notesUrl` (the GitHub release tag page) with `shell.openExternal`; throws if none. Skipped in self-test.

States shared with the page: `idle | checking | up-to-date | available | downloading | ready | installing | failed` (main.cjs), always with `current` = app version.

## Renderer side

`window.storyloom.openUpdateNotes` at `preload.cjs`; used by update views in [[entities/app-js]] and [[entities/account-screen]].

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/handle]]
- **used_by:** [[entities/preload-cjs]], [[entities/app-js]], [[entities/account-screen]]
- **related:** [[entities/ipc-channels]], [[concepts/signed-update-channel]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `main.cjs`
- `preload.cjs`
