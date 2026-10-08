---
type: entity
title: "renderer/screens/coloring.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-07
path: "renderer/screens/coloring.js"
language: js
depends_on:
  - "[[entities/app-js]]"
  - "[[entities/core-js]]"
  - "[[entities/preload-cjs]]"
used_by: []
last_commit_hash: "eb83d47"
tested_by: []
tags:
  - entity
  - module
  - screen
related:
  - "[[concepts/screen-registry]]"
sources:
  - renderer/screens/coloring.js
---

# renderer/screens/coloring.js

**Coloring: turn a book into line-art pages, generate one from an idea, paint pages.**

## Overview

Registered via `registerScreen('coloring', …)` at renderer/screens/coloring.js. Header comment: renderer/screens/coloring.js.

## IPC used

- `api.createBook` → [[entities/ipc-books-create]]
- `api.duplicateBook` → [[entities/ipc-books-duplicate]]
- `api.generateImage` → [[entities/ipc-ai-image]]
- `api.generateStory` → [[entities/ipc-ai-generate]]
- `api.listBooks` → [[entities/ipc-books-list]]
- `api.readBook` → [[entities/ipc-books-read]]
- `api.saveBook` → [[entities/ipc-books-save]]
- `api.saveImage` → [[entities/ipc-books-save-image]]

## Changes since 2add52d

Shows `aiWriterNote()` (renderer/screens/coloring.js).

## Connections

- **depends_on:** [[entities/app-js]], [[entities/core-js]], [[entities/preload-cjs]]
- **used_by:** —
- **related:** [[concepts/screen-registry]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/screens/coloring.js`
