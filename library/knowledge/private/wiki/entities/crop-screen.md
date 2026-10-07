---
type: entity
title: "renderer/screens/crop.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "renderer/screens/crop.js"
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
  - renderer/screens/crop.js
---

# renderer/screens/crop.js

**Picture crop dialog (`window.openCropDialog`) and the "Generate a picture" Pictures-drawer extra.**

## Overview

Does not call `registerScreen`; it installs dialog helpers used by other screens. Header comment: renderer/screens/crop.js:1.

## IPC used

- `api.generateImage` → [[entities/ipc-ai-image]]

## Connections

- **depends_on:** [[entities/app-js]], [[entities/core-js]], [[entities/preload-cjs]]
- **used_by:** —
- **related:** [[concepts/screen-registry]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/screens/crop.js`
