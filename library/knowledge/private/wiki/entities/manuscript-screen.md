---
type: entity
title: "renderer/screens/manuscript.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "renderer/screens/manuscript.js"
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
  - renderer/screens/manuscript.js
---

# renderer/screens/manuscript.js

**Manuscript: chapters + rich-text editor stored as structured blocks (never HTML).**

## Overview

Registered via `registerScreen('manuscript', …)` at renderer/screens/manuscript.js:605. Header comment: renderer/screens/manuscript.js:3.

## IPC used

- `api.generateChapter` → [[entities/ipc-ai-chapter]]
- `api.saveBook` → [[entities/ipc-books-save]]

## Connections

- **depends_on:** [[entities/app-js]], [[entities/core-js]], [[entities/preload-cjs]]
- **used_by:** —
- **related:** [[concepts/screen-registry]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/screens/manuscript.js`
