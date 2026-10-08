---
type: entity
title: "renderer/editor.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "renderer/editor.js"
language: js
depends_on:
  - "[[entities/core-js]]"
used_by:
  - "[[entities/app-js]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - module
related:
  - "[[entities/element]]"
sources:
  - renderer/editor.js
---

# renderer/editor.js

**The Designer: free-placed elements, drag/resize/rotate, snapping, layers, undo/redo.**

## Overview

Element factories (`textElement`, `shapeElement`, `imageElement`; renderer/editor.js), snapshot-based undo (`snapshot`/`checkpoint`/`undo`/`redo`; renderer/editor.js), `renderEditor` (renderer/editor.js), pointer interactions (`startMove`, `snapPosition`, `startResize`, `startRotate`; renderer/editor.js) and drawers (pages/text/shapes/stickers/uploads; renderer/editor.js).

## Connections

- **depends_on:** [[entities/core-js]]
- **used_by:** [[entities/app-js]]
- **related:** [[entities/element]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/editor.js`
