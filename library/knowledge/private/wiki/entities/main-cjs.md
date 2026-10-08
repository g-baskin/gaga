---
type: entity
title: "main.cjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-07
path: "main.cjs"
language: js
depends_on:
  - "[[entities/storage-cjs]]"
  - "[[entities/epub-cjs]]"
  - "[[entities/openrouter-cjs]]"
  - "[[entities/chatgpt-cjs]]"
  - "[[entities/claude-code-cjs]]"
  - "[[entities/model-picker-cjs]]"
  - "[[entities/preload-cjs]]"
used_by: []
last_commit_hash: "eb83d47"
tested_by: []
tags:
  - entity
  - module
related:
  - "[[entities/updater-cjs]]"
  - "[[concepts/picture-service-routing]]"
  - "[[concepts/signed-update-channel]]"
  - "[[concepts/ipc-trust-boundary]]"
  - "[[concepts/offline-network-lockdown]]"
  - "[[concepts/ai-provider-routing]]"
  - "[[concepts/self-test-harness]]"
sources:
  - main.cjs
---

# main.cjs

**Electron main process: app lifecycle, `app://` protocol, IPC handlers, settings and secrets, AI orchestration, export.**

## Overview

Entry point of the Electron app. Requires the store, EPUB builder and the four AI modules, registers the privileged `app` scheme (main.cjs), wraps every IPC channel with [[entities/handle]] (main.cjs), and on `whenReady` creates the store, locks down permissions and network, registers handlers and opens a sandboxed `BrowserWindow` (main.cjs).

Key members: [[entities/readSettings]], [[entities/saveSettings]], [[entities/aiRequest]], [[entities/writeText]], [[entities/chatJson]], [[entities/generateStory]], [[entities/generateChapter]], [[entities/generateImage]], [[entities/generateSpeech]], [[entities/aiRecommendations]], [[entities/exportEpub]], [[entities/serve]]. All 44 IPC channels are listed under [[entities/ipc-channels]].

Close handling: the window's `close` is intercepted, `app:before-close` is sent to the page, and a 3 s timer forces close if saving hangs (main.cjs). Menu undo/redo are forwarded as `menu:action` (main.cjs).

## Changes since 2add52d

- Requires [[entities/updater-cjs]] and `ai/fal.cjs` ([[entities/fal-cjs]]). Update state machine (main.cjs): `setUpdateState` pushes `app:update-state`; `getUpdater`, `checkForUpdate`, `downloadUpdate`, `installUpdate`, `discardReadyUpdate`. See [[concepts/signed-update-channel]].
- New handlers (main.cjs): [[entities/ipc-app-update-state]], [[entities/ipc-app-check-update]], [[entities/ipc-app-download-update]], [[entities/ipc-app-install-update]], [[entities/ipc-app-open-update-notes]]. `ai:open-link` gains `fal-keys` and `source` (main.cjs).
- `PICTURES = ['custom','openrouter','fal']` (main.cjs); `getFal()` (main.cjs); [[entities/generateImage]] branches to fal at main.cjs. Settings gain `falKeyEnc`, `falImageModel`, [[entities/settings-checkUpdates]] (main.cjs).
- Test hooks: [[entities/test-url-STORYLOOM_TEST_UPDATES]], [[entities/test-url-STORYLOOM_TEST_UPDATE_KEY]], [[entities/test-url-STORYLOOM_TEST_FAL_RUN]], [[entities/test-url-STORYLOOM_TEST_FAL_API]] via [[entities/useTestServices]] (main.cjs).
- The renderer network block is unchanged (main.cjs); the main process now also contacts GitHub for updates, so the app is not offline-only.

## Connections

- **depends_on:** [[entities/storage-cjs]], [[entities/epub-cjs]], [[entities/openrouter-cjs]], [[entities/chatgpt-cjs]], [[entities/claude-code-cjs]], [[entities/model-picker-cjs]], [[entities/preload-cjs]]
- **used_by:** —
- **related:** [[concepts/ipc-trust-boundary]], [[concepts/offline-network-lockdown]], [[concepts/ai-provider-routing]], [[concepts/self-test-harness]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`
