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

Element factories (`textElement`, `shapeElement`, `imageElement`; renderer/editor.js:42), snapshot-based undo (`snapshot`/`checkpoint`/`undo`/`redo`; renderer/editor.js:75–renderer/editor.js:108), `renderEditor` (renderer/editor.js:122), pointer interactions (`startMove`, `snapPosition`, `startResize`, `startRotate`; renderer/editor.js:263) and drawers (pages/text/shapes/stickers/uploads; renderer/editor.js:532).

## Connections

- **depends_on:** [[entities/core-js]]
- **used_by:** [[entities/app-js]]
- **related:** [[entities/element]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/editor.js`
