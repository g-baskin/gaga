---
type: entity
title: "renderer/screens/bookshelf.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-07
path: "renderer/screens/bookshelf.js"
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
  - renderer/screens/bookshelf.js
---

# renderer/screens/bookshelf.js

**Bookshelf: search, sort, custom order, shelves, per-book menu.**

## Overview

Registered via `registerScreen('bookshelf', …)` at renderer/screens/bookshelf.js. Header comment: renderer/screens/bookshelf.js.

## IPC used

- `api.deleteBook` → [[entities/ipc-books-delete]]
- `api.duplicateBook` → [[entities/ipc-books-duplicate]]
- `api.getProfile` → [[entities/ipc-profile-get]]
- `api.listBooks` → [[entities/ipc-books-list]]
- `api.listShelves` → [[entities/ipc-shelves-list]]
- `api.renameBook` → [[entities/ipc-books-rename]]
- `api.saveProfile` → [[entities/ipc-profile-save]]
- `api.saveShelves` → [[entities/ipc-shelves-save]]

Persists sort choice in [[entities/localStorage-bookshelf-sort]] (renderer/screens/bookshelf.js).

## Changes since 2add52d

Restyled; shows `profile.authorName` (renderer/screens/bookshelf.js); registered at :424.

## Connections

- **depends_on:** [[entities/app-js]], [[entities/core-js]], [[entities/preload-cjs]]
- **used_by:** —
- **related:** [[concepts/screen-registry]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/screens/bookshelf.js`
