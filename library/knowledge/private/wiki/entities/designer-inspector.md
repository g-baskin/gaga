---
type: entity
title: "renderer/designer/inspector.js"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "renderer/designer/inspector.js"
language: js
last_commit_hash: "6a7c05c7ff9ea19d4f429f77bdfd0ca2c2dd2cf7"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/editor-js]]", "[[entities/crop-screen]]", "[[entities/illustrate-screen]]"]
tags: [entity, module]
sources:
  - renderer/designer/inspector.js
---

# renderer/designer/inspector.js

`renderInspector` switches between page and selected-element controls. `pageInspector` edits layout settings; `elementInspector` switches controls by type. `cropButton` delegates to `window.openCropDialog`. `pagePictureButtons` invokes `window.pagePictureExtras`; `layersPanel` and `markLayers` maintain the layer list.

## Sources

- `renderer/designer/inspector.js` (symbols cited above; manually inspected, not AST-extracted).
