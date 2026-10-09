---
type: entity
title: "renderer/screens/coloring.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "renderer/screens/coloring.js"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/line-art-js]]", "[[entities/app-js]]"]
tags: [entity, module]
sources:
  - renderer/screens/coloring.js
---

# renderer/screens/coloring.js

`convertToColoringBook` duplicates a book before converting pictures. `lineArtWorker` uses the shared line-art worker with a local fallback; `makeFromIdea` uses story and image IPC calls for a new coloring book. `renderPaint` uses scanline `floodFill`, compressed PNG undo snapshots and `api.saveImage`/`api.saveBook` to persist changes.

## Sources

- `renderer/screens/coloring.js` (symbols cited above; manually inspected, not AST-extracted).
