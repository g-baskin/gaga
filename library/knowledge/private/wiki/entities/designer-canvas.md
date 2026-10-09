---
type: entity
title: "renderer/designer/canvas.js"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "renderer/designer/canvas.js"
language: js
last_commit_hash: "6a7c05c7ff9ea19d4f429f77bdfd0ca2c2dd2cf7"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/editor-js]]", "[[entities/designer-model]]"]
tags: [entity, module]
sources:
  - renderer/designer/canvas.js
---

# renderer/designer/canvas.js

`renderCanvas` draws the current page and elements. `track` tracks pointer movement on window; `startMove` uses `snapPosition` with Option to bypass snapping. `startResize` and `startRotate` update geometry; `startEditing`/`stopEditing` manage text editing. `addElement`, `deleteElement`, `duplicateElement`, `moveLayer` and `toggleLock` perform element operations using shared model/history state.

## Sources

- `renderer/designer/canvas.js` (symbols cited above; manually inspected, not AST-extracted).
