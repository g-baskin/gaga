---
type: entity
title: "renderer/app.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "renderer/app.js"
language: js
depends_on:
  - "[[entities/core-js]]"
  - "[[entities/editor-js]]"
used_by: []
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - module
related:
  - "[[concepts/screen-registry]]"
sources:
  - renderer/app.js
---

# renderer/app.js

**Renderer app shell: state, autosave, screen registry, navigation, shared dialogs.**

## Overview

Loaded after `core.js` and `editor.js`; screens call `registerScreen()` (renderer/app.js:2). Functions: `scheduleSave`/`saveNow` (renderer/app.js:20), [[entities/registerScreen]], [[entities/navigate]], `openBook`, `createBlankBook`, `modal`, `confirmDialog`, `openAiSettings`. Registers the `designer` screen itself (renderer/app.js:227). Exposes the test hook [[entities/window-__storyloom]] (renderer/app.js:168).

## Connections

- **depends_on:** [[entities/core-js]], [[entities/editor-js]]
- **used_by:** —
- **related:** [[concepts/screen-registry]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/app.js`
