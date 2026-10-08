---
type: entity
title: "renderer/screens/story-builder.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-07
path: "renderer/screens/story-builder.js"
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
  - renderer/screens/story-builder.js
---

# renderer/screens/story-builder.js

**Story builder: idea, characters, details, reader level, look → manuscript.**

## Overview

Registered via `registerScreen('story-builder', …)` at renderer/screens/story-builder.js. Header comment: renderer/screens/story-builder.js.

## IPC used

- `api.deleteCharacter` → [[entities/ipc-characters-delete]]
- `api.generateImage` → [[entities/ipc-ai-image]]
- `api.generateStory` → [[entities/ipc-ai-generate]]
- `api.importImage` → [[entities/ipc-books-import-image]]
- `api.insertCharacter` → [[entities/ipc-characters-insert]]
- `api.listCharacters` → [[entities/ipc-characters-list]]
- `api.saveCharacter` → [[entities/ipc-characters-save]]

## Changes since 2add52d

Live cover preview: `schedulePreview` (renderer/screens/story-builder.js) batches redraws per microtask; `liveCharacters` includes unsaved edits from an open character dialog. Uses `aiPictureNote` and `aiWriterNote`. Registered at :450.

## Connections

- **depends_on:** [[entities/app-js]], [[entities/core-js]], [[entities/preload-cjs]]
- **used_by:** —
- **related:** [[concepts/screen-registry]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/screens/story-builder.js`
