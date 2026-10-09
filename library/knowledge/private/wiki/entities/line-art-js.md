---
type: entity
title: "renderer/line-art.js"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "renderer/line-art.js"
language: js
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/coloring-screen]]"]
tags: [entity, module]
sources:
  - renderer/line-art.js
---

# renderer/line-art.js

`lineArt` performs grayscale → blur → Sobel edges → threshold, returning dark lines on white. The same file exposes `window.storyloomLineArt` as a page fallback and handles worker `{ id, image }` messages with transferred pixel buffers. `renderer/screens/coloring.js` loads the worker and falls back if unavailable.

## Sources

- `renderer/line-art.js` (symbols cited above; manually inspected, not AST-extracted).
