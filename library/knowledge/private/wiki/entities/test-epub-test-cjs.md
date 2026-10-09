---
type: entity
title: "test/epub.test.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "test/epub.test.cjs"
language: js
last_commit_hash: "2add52d8d75e1f082696acfa6ab3e52a72d15e9e"
depends_on: ["[[entities/epub-cjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - test/epub.test.cjs
---

# test/epub.test.cjs

## Verified source surface (2026-10-08)

This is a test specification, not a recorded passing run. Literal test declarations in `test/epub.test.cjs` cover:

- a picture that no longer exists is skipped and its references removed
- crc32 matches the standard check value
- zip round-trips files and stores mimetype first
- builds a fixed-layout EPUB with escaped metadata, pages, and images

Local dependency evidence (literal import/require statements in `test/epub.test.cjs`):

- `../epub.cjs` → [[entities/epub-cjs]].

Execution was not performed during this documentation refresh.
