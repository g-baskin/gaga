---
type: entity
title: "renderer/screens/export.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "renderer/screens/export.js"
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
  - renderer/screens/export.js
---

# renderer/screens/export.js

**Export: PDF (screen/print), fixed-layout EPUB 3, narrated WAV, ISBN + copyright page.**

## Overview

Registered via `registerScreen('export', …)` at renderer/screens/export.js:307. Header comment: renderer/screens/export.js:3.

## IPC used

- `api.exportEpub` → [[entities/ipc-books-export-epub]]
- `api.exportWav` → [[entities/ipc-books-export-wav]]
- `api.revealExport` → [[entities/ipc-books-reveal-export]]

## Connections

- **depends_on:** [[entities/app-js]], [[entities/core-js]], [[entities/preload-cjs]]
- **used_by:** —
- **related:** [[concepts/screen-registry]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/screens/export.js`
