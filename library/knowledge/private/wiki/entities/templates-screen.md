---
type: entity
title: "renderer/screens/templates.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "renderer/screens/templates.js"
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
  - renderer/screens/templates.js
---

# renderer/screens/templates.js

**Templates catalogue: page themes and starter books with flip preview.**

## Overview

Registered via `registerScreen('templates', …)` at renderer/screens/templates.js. Header comment: renderer/screens/templates.js.

## IPC used

- `api.createBook` → [[entities/ipc-books-create]]
- `api.getProfile` → [[entities/ipc-profile-get]]
- `api.listBooks` → [[entities/ipc-books-list]]
- `api.readBook` → [[entities/ipc-books-read]]
- `api.saveBook` → [[entities/ipc-books-save]]

## Connections

- **depends_on:** [[entities/app-js]], [[entities/core-js]], [[entities/preload-cjs]]
- **used_by:** —
- **related:** [[concepts/screen-registry]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/screens/templates.js`
