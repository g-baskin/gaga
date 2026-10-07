---
type: entity
title: "main.cjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
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
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - module
related:
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

Entry point of the Electron app. Requires the store, EPUB builder and the four AI modules, registers the privileged `app` scheme (main.cjs:30), wraps every IPC channel with [[entities/handle]] (main.cjs:46), and on `whenReady` creates the store, locks down permissions and network, registers handlers and opens a sandboxed `BrowserWindow` (main.cjs:650).

Key members: [[entities/readSettings]], [[entities/saveSettings]], [[entities/aiRequest]], [[entities/writeText]], [[entities/chatJson]], [[entities/generateStory]], [[entities/generateChapter]], [[entities/generateImage]], [[entities/generateSpeech]], [[entities/aiRecommendations]], [[entities/exportEpub]], [[entities/serve]]. All 44 IPC channels are listed under [[entities/ipc-channels]].

Close handling: the window's `close` is intercepted, `app:before-close` is sent to the page, and a 3 s timer forces close if saving hangs (main.cjs:680). Menu undo/redo are forwarded as `menu:action` (main.cjs:587).

## Connections

- **depends_on:** [[entities/storage-cjs]], [[entities/epub-cjs]], [[entities/openrouter-cjs]], [[entities/chatgpt-cjs]], [[entities/claude-code-cjs]], [[entities/model-picker-cjs]], [[entities/preload-cjs]]
- **used_by:** —
- **related:** [[concepts/ipc-trust-boundary]], [[concepts/offline-network-lockdown]], [[concepts/ai-provider-routing]], [[concepts/self-test-harness]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`
