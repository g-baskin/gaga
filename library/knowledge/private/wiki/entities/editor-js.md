---
type: entity
title: "renderer/editor.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "renderer/editor.js"
language: js
last_commit_hash: "6a7c05c7ff9ea19d4f429f77bdfd0ca2c2dd2cf7"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/designer-model]]", "[[entities/designer-canvas]]", "[[entities/designer-drawers]]", "[[entities/designer-inspector]]", "[[entities/designer-pages]]", "[[entities/app-js]]"]
tags: [entity, module]
sources:
  - renderer/editor.js
---

# renderer/editor.js

`renderEditor` composes the Designer rail and panels; `installEditorListeners` installs keyboard/clipboard/menu listeners after all deferred scripts load. The state and editing operations are no longer defined in this file. `renderer/index.html` loads model, canvas, drawers, inspector and pages before editor.js; `renderer/app.js` calls listener installation at startup.

## Sources

- `renderer/editor.js` (symbols cited above; manually inspected, not AST-extracted).
