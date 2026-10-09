---
type: entity
title: "renderer/designer/model.js"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "renderer/designer/model.js"
language: js
last_commit_hash: "6a7c05c7ff9ea19d4f429f77bdfd0ca2c2dd2cf7"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/editor-js]]"]
tags: [entity, module]
sources:
  - renderer/designer/model.js
---

# renderer/designer/model.js

`editor` stores selection/drawer/editing/history state. `textElement`, `shapeElement`, `stickerElement` and `imageElement` create elements with persisted defaults. `resetDesigner` clears per-book state. `snapshot`, `checkpoint`, `restore`, `undo` and `redo` implement book snapshots; adjacent changes with the same key merge into one undo step.

Loaded as a shared-global deferred script before editor.js (`renderer/index.html`), not a CommonJS module.

## Sources

- `renderer/designer/model.js` (symbols cited above; manually inspected, not AST-extracted).
