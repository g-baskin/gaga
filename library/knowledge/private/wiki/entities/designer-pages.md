---
type: entity
title: "renderer/designer/pages.js"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "renderer/designer/pages.js"
language: js
last_commit_hash: "6a7c05c7ff9ea19d4f429f77bdfd0ca2c2dd2cf7"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/editor-js]]", "[[entities/core-js]]", "[[entities/fonts-js]]"]
tags: [entity, module]
sources:
  - renderer/designer/pages.js
---

# renderer/designer/pages.js

`addPage`, `duplicatePage`, `deletePage` and `movePage` change page ordering through shared history/save helpers. `updateFitNote` reports whether words shrank or still overflow. `exportPdf` prepares print-root pages, awaits fonts, applies print bleed for print mode, invokes `api.exportPdf` and cleans the print DOM afterward.

## Sources

- `renderer/designer/pages.js` (symbols cited above; manually inspected, not AST-extracted).
