---
type: entity
title: "renderer/screens/studio.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "renderer/screens/studio.js"
language: js
depends_on:
  - "[[entities/app-js]]"
  - "[[entities/core-js]]"
  - "[[entities/preload-cjs]]"
used_by: []
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - module
  - screen
related:
  - "[[concepts/screen-registry]]"
sources:
  - renderer/screens/studio.js
---

# renderer/screens/studio.js

**Studio: per-page narration (mic, import, AI voice), background music, read-along.**

## Overview

Registered via `registerScreen('studio', …)` at renderer/screens/studio.js:365. Header comment: renderer/screens/studio.js:3.

## IPC used

- `api.generateSpeech` → [[entities/ipc-ai-speech]]
- `api.importAudio` → [[entities/ipc-books-import-audio]]
- `api.listAudio` → [[entities/ipc-books-list-audio]]
- `api.saveRecording` → [[entities/ipc-books-save-recording]]

## Connections

- **depends_on:** [[entities/app-js]], [[entities/core-js]], [[entities/preload-cjs]]
- **used_by:** —
- **related:** [[concepts/screen-registry]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/screens/studio.js`
