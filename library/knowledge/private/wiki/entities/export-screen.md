---
type: entity
title: "renderer/screens/export.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "renderer/screens/export.js"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/designer-pages]]", "[[entities/main-export-cjs]]"]
tags: [entity, module]
sources:
  - renderer/screens/export.js
---

# renderer/screens/export.js

`buildEpubInput` serializes page XHTML and supplies font keys, not arbitrary font paths. `pdf` delegates to shared `exportPdf`; `wav` decodes narration/music, mixes an OfflineAudioContext and calls `api.exportWav` with `encodeWav` output. `isbnError` validates ISBN; `copyrightPage` adds optional copyright content. This screen registers as book-scoped export.

## Sources

- `renderer/screens/export.js` (symbols cited above; manually inspected, not AST-extracted).
