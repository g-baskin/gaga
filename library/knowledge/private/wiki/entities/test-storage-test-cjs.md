---
type: entity
title: "test/storage.test.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "test/storage.test.cjs"
language: js
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
depends_on: ["[[entities/storage-cjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - test/storage.test.cjs
---

# test/storage.test.cjs

## Verified source surface (2026-10-08)

This is a test specification, not a recorded passing run. Literal test declarations in `test/storage.test.cjs` cover:

- creates, saves, lists, and reads a book
- cleans invalid page values instead of storing them
- rejects path traversal in book ids and image names
- imports real images and refuses disguised files
- saves design elements and cleans unsafe ones
- skips a corrupt book without hiding the others
- an unreadable book is reported once and left exactly as it was
- a save is flushed to disk before it replaces the old copy
- a full character library refuses a new character instead of dropping the oldest
- the library list remembers summaries but always shows saved, edited, and removed books
- keeps crops, sound elements, and book-level story data
- imports only real sound and text files
- duplicates a book with its pictures and keeps shelves tidy
- character library copies pictures in and out of books
- saves a profile with a default author name
- a damaged saved file is set aside and reported, never silently overwritten
- a saved file that can’t be read is not replaced with an empty one
- a failed save leaves no temporary file behind, and disk errors read as plain words
- a broken font list stops Storyloom from starting instead of stripping fonts from books

Named function declarations in `test/storage.test.cjs`: `setup`. This lexical list includes private helpers; it is not an export list.

Local dependency evidence (literal import/require statements in `test/storage.test.cjs`):

- `../storage.cjs` → [[entities/storage-cjs]].

Execution was not performed during this documentation refresh.
