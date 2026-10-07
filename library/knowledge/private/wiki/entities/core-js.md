---
type: entity
title: "renderer/core.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "renderer/core.js"
language: js
depends_on:
  - "[[entities/preload-cjs]]"
used_by:
  - "[[entities/app-js]]"
  - "[[entities/editor-js]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - module
related:
  - "[[entities/renderPage]]"
sources:
  - renderer/core.js
---

# renderer/core.js

**Shared renderer helpers and page rendering.**

## Overview

Binds `const api = window.storyloom` (renderer/core.js:3). Helpers: `h` DOM builder (renderer/core.js:5), `svg`, `toast`, `run` (busy wrapper, renderer/core.js:44), element renderers and [[entities/renderPage]] / `scaledPage` (renderer/core.js:199).

## Connections

- **depends_on:** [[entities/preload-cjs]]
- **used_by:** [[entities/app-js]], [[entities/editor-js]]
- **related:** [[entities/renderPage]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/core.js`
