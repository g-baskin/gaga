---
type: entity
title: "renderer/screens/story-builder.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "renderer/screens/story-builder.js"
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
  - renderer/screens/story-builder.js
---

# renderer/screens/story-builder.js

**Story builder: idea, characters, details, reader level, look → manuscript.**

## Overview

Registered via `registerScreen('story-builder', …)` at renderer/screens/story-builder.js:410. Header comment: renderer/screens/story-builder.js:3.

## IPC used

- `api.deleteCharacter` → [[entities/ipc-characters-delete]]
- `api.generateImage` → [[entities/ipc-ai-image]]
- `api.generateStory` → [[entities/ipc-ai-generate]]
- `api.importImage` → [[entities/ipc-books-import-image]]
- `api.insertCharacter` → [[entities/ipc-characters-insert]]
- `api.listCharacters` → [[entities/ipc-characters-list]]
- `api.saveCharacter` → [[entities/ipc-characters-save]]

## Connections

- **depends_on:** [[entities/app-js]], [[entities/core-js]], [[entities/preload-cjs]]
- **used_by:** —
- **related:** [[concepts/screen-registry]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/screens/story-builder.js`
