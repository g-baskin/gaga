---
type: entity
title: "renderer/screens/home.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-07
path: "renderer/screens/home.js"
language: js
depends_on:
  - "[[entities/app-js]]"
  - "[[entities/core-js]]"
  - "[[entities/preload-cjs]]"
used_by: []
last_commit_hash: "3312b4e"
tested_by: []
tags:
  - entity
  - module
  - screen
related:
  - "[[concepts/screen-registry]]"
sources:
  - renderer/screens/home.js
---

# renderer/screens/home.js

**Home: start from an idea, import a manuscript, recent books.**

## Overview

Registered via `registerScreen('home', …)` at renderer/screens/home.js:171. Header comment: renderer/screens/home.js:3.

## IPC used

- `api.createBook` → [[entities/ipc-books-create]]
- `api.getProfile` → [[entities/ipc-profile-get]]
- `api.importStoryText` → [[entities/ipc-import-story-text]]
- `api.listBooks` → [[entities/ipc-books-list]]

## Changes since 2add52d

Restyled for the picture-book design; new books take `authorName` from the profile (renderer/screens/home.js:64-86); registered at :175.

## Connections

- **depends_on:** [[entities/app-js]], [[entities/core-js]], [[entities/preload-cjs]]
- **used_by:** —
- **related:** [[concepts/screen-registry]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/screens/home.js`
