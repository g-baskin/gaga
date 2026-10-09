---
type: entity
title: "main/export.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "main/export.cjs"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/main-cjs]]", "[[entities/epub-cjs]]"]
tags: [entity, module]
sources:
  - main/export.cjs
---

# main/export.cjs

`createExports` owns open/save dialogs and PDF/EPUB/WAV exports. `chooseSaveFile` returns null on cancellation and uses deterministic userData destinations only during self-test. `toBuffer` accepts Uint8Array/ArrayBuffer and enforces a caller-provided cap.

`exportEpub` loads the book, limits page bodies, rejects scripts/event handlers/JavaScript URLs, gathers book media and calls `buildEpub`. `bundledFontsFor` accepts only keys and font filenames from the bundled manifest, including Unicode ranges. `exportPdf` calls the requesting webContents printToPDF after the renderer prepares print layout. `revealExport` opens the last saved result in Finder.

## Sources

- `main/export.cjs` (symbols cited above; manually inspected, not AST-extracted).
