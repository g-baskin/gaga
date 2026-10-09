---
type: entity
title: "renderer/editor.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
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
  - renderer/designer/
---

# renderer/editor.js

**The Designer: free-placed elements, drag/resize/rotate, snapping, layers, undo/redo.**

## Overview

`renderer/editor.js` is the Designer screen: `renderEditor`, the drawer rail, and the keyboard, clipboard, and menu listeners (`installEditorListeners`, called by app.js once every script has loaded). The rest lives in `renderer/designer/`, loaded just before it:

- `model.js`: the `editor` state, element factories (`textElement`, `shapeElement`, `imageElement`), and snapshot-based undo (`snapshot`/`checkpoint`/`undo`/`redo`).
- `canvas.js`: drawing the page, selection, pointer interactions (`startMove`, `snapPosition`, `startResize`, `startRotate`), text editing, and element operations.
- `drawers.js`: the pages, text, shapes, stickers, pictures, and frames drawers.
- `inspector.js`: page and element settings and the layer list.
- `pages.js`: page operations and `exportPdf`.

## Connections

- **depends_on:** [[entities/core-js]]
- **used_by:** [[entities/app-js]]
- **related:** [[entities/element]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/editor.js`
- `renderer/designer/`
