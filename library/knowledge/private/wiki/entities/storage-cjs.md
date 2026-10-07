---
type: entity
title: "storage.cjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "storage.cjs"
language: js
depends_on: []
used_by:
  - "[[entities/main-cjs]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - module
related:
  - "[[concepts/sanitize-on-every-boundary]]"
  - "[[concepts/atomic-file-writes]]"
sources:
  - storage.cjs
---

# storage.cjs

**Local book store: sanitizers for every persisted shape and the `createStore(root)` factory.**

## Overview

Pure sanitizers (storage.cjs:50–storage.cjs:260) plus [[entities/createStore]] (storage.cjs:310). Exports `createStore, sanitizeBook, sanitizePage, sanitizeElement, sanitizeCrop, sniffAudio, sniffImage, decodeStoryText, LIBRARY, READING_LEVELS, LENGTHS` (storage.cjs:548).

Data models: [[entities/book]], [[entities/page]], [[entities/element]], [[entities/crop]], [[entities/builder]], [[entities/character]], [[entities/manuscript]], [[entities/book-audio]], [[entities/shelf]], [[entities/profile]]. Limits are module constants (`MAX_PAGES=500`, `MAX_ELEMENTS=200`, `MAX_IMAGE_BYTES=25 MiB`, `MAX_AUDIO_BYTES=100 MiB`; storage.cjs:17, storage.cjs:23).

## Connections

- **depends_on:** —
- **used_by:** [[entities/main-cjs]]
- **related:** [[concepts/sanitize-on-every-boundary]], [[concepts/atomic-file-writes]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `storage.cjs`
