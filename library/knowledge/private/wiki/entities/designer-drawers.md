---
type: entity
title: "renderer/designer/drawers.js"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "renderer/designer/drawers.js"
language: js
last_commit_hash: "6a7c05c7ff9ea19d4f429f77bdfd0ca2c2dd2cf7"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/editor-js]]", "[[entities/crop-screen]]", "[[entities/illustrate-screen]]"]
tags: [entity, module]
sources:
  - renderer/designer/drawers.js
---

# renderer/designer/drawers.js

`renderDrawer` chooses pages/text/shapes/stickers/pictures/frames content. `card` creates click/drag insertion payloads; `onCanvasDrop` handles async picture payloads. `uploadPicture` imports media; `addImageToPage` inserts an existing book asset. `pictureExtras` calls the extension hooks in `window.picturesDrawerExtras`, which crop and illustrate screens populate.

## Sources

- `renderer/designer/drawers.js` (symbols cited above; manually inspected, not AST-extracted).
