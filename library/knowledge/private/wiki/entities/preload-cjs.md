---
type: entity
title: "preload.cjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-07
path: "preload.cjs"
language: js
depends_on: []
used_by:
  - "[[entities/core-js]]"
last_commit_hash: "eb83d47"
tested_by: []
tags:
  - entity
  - module
related:
  - "[[concepts/signed-update-channel]]"
  - "[[concepts/ipc-trust-boundary]]"
  - "[[concepts/soft-error-ipc]]"
sources:
  - preload.cjs
---

# preload.cjs

**Context-bridge preload exposing `window.storyloom`.**

## Overview

Exposes `window.storyloom` via `contextBridge.exposeInMainWorld` (preload.cjs:12). Every method is a thin `ipcRenderer.invoke` wrapper (`call`, preload.cjs:4); `soft` unwraps `{ ok } / { error }` envelopes into a resolved value or a thrown `Error` (preload.cjs:6). `saveSettings` unwraps `{ settings } / { error }` the same way (preload.cjs:47). Two event subscriptions: `onBeforeClose` (`app:before-close`) and `onMenuAction` (`menu:action`, filtered to undo/redo) (preload.cjs:66).

The full method→channel map is [[entities/window-storyloom-api]].

## Changes since 2add52d

Adds `updateState`, `checkForUpdate(manual)`, `downloadUpdate`, `installUpdate`, `openUpdateNotes`, and the push listener `onUpdateState` (preload.cjs:45-52). `openLink` names now include `fal-keys` and `source` (preload.cjs:71). See [[entities/ipc-app-update-state]].

## Connections

- **depends_on:** —
- **used_by:** [[entities/core-js]]
- **related:** [[concepts/ipc-trust-boundary]], [[concepts/soft-error-ipc]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `preload.cjs`
