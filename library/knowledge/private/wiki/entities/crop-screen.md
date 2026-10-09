---
type: entity
title: "renderer/screens/crop.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "renderer/screens/crop.js"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/designer-drawers]]", "[[entities/designer-inspector]]"]
tags: [entity, module]
sources:
  - renderer/screens/crop.js
---

# renderer/screens/crop.js

`openCropDialog` edits fractional image coordinates with aspect constraints and passes the chosen crop to its callback. `openGenerateDialog` calls `api.generateImage`; the file exposes `window.openCropDialog` and extends `picturesDrawerExtras`, rather than registering its own navigation screen.

## Sources

- `renderer/screens/crop.js` (symbols cited above; manually inspected, not AST-extracted).
