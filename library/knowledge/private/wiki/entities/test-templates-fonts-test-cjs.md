---
type: entity
title: "test/templates-fonts.test.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "test/templates-fonts.test.cjs"
language: js
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
depends_on: ["[[entities/storage-cjs]]", "[[entities/epub-cjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - test/templates-fonts.test.cjs
---

# test/templates-fonts.test.cjs

## Verified source surface (2026-10-08)

This is a test specification, not a recorded passing run. Literal test declarations in `test/templates-fonts.test.cjs` cover:

- every bundled font file matches fonts.json and has an allowed license
- a saved page keeps a bundled font and its title font, and refuses unknown fonts
- every theme has unique ids, real fonts, a category, and pages that survive a save
- applying a theme sets both fonts on every page
- an e-book embeds the font files it uses, with matching @font-face rules
- the default book ink is the same colour in the app and in storage

Named function declarations in `test/templates-fonts.test.cjs`: `loadTemplates`. This lexical list includes private helpers; it is not an export list.

Local dependency evidence (literal import/require statements in `test/templates-fonts.test.cjs`):

- `../storage.cjs` → [[entities/storage-cjs]].
- `../epub.cjs` → [[entities/epub-cjs]].

Execution was not performed during this documentation refresh.
