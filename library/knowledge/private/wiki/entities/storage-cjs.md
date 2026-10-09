---
type: entity
title: "storage.cjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "storage.cjs"
language: js
depends_on: []
used_by:
  - "[[entities/main-cjs]]"
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
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

> [!stale] Prior description retained below
> The prior module page exported sanitizeBook, sanitizeElement, sanitizeCrop, sniffAudio, decodeStoryText, LIBRARY and READING_LEVELS. This is not the current contract.

> [!contradiction] Verified correction 2026-10-08
> module.exports actually contains createStore, sanitizePage, sniffImage, plainFsError, readJsonFile, LENGTHS, BOOK_INK and MAX_CHARACTERS; other helpers are internal. Evidence: `storage.cjs` / `module.exports`. See [[meta/2026-10-08-contradiction-report]].

## Prior scan / historical description


**Local book store: sanitizers for every persisted shape and the `createStore(root)` factory.**

## Overview

Pure sanitizers (storage.cjs) plus [[entities/createStore]] (storage.cjs). Exports `createStore, sanitizeBook, sanitizePage, sanitizeElement, sanitizeCrop, sniffAudio, sniffImage, decodeStoryText, LIBRARY, READING_LEVELS, LENGTHS` (storage.cjs).

Data models: [[entities/book]], [[entities/page]], [[entities/element]], [[entities/crop]], [[entities/builder]], [[entities/character]], [[entities/manuscript]], [[entities/book-audio]], [[entities/shelf]], [[entities/profile]]. Limits are module constants (`MAX_PAGES=500`, `MAX_ELEMENTS=200`, `MAX_IMAGE_BYTES=25 MiB`, `MAX_AUDIO_BYTES=100 MiB`; storage.cjs, storage.cjs).

## Connections

- **depends_on:** —
- **used_by:** [[entities/main-cjs]]
- **related:** [[concepts/sanitize-on-every-boundary]], [[concepts/atomic-file-writes]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `storage.cjs`

## Verified source surface (2026-10-08)


Named function declarations in `storage.cjs`: `bundledFontKeys`, `plainFsError`, `readJsonFile`, `sanitizeCrop`, `sanitizeElement`, `assertId`, `sanitizePage`, `sanitizeCharacter`, `sanitizeBuilder`, `sanitizeBlock`, `sanitizeManuscript`, `sanitizeAudio`, `isValidIsbn`, `sanitizeIsbn`, `sanitizeBook`, `sanitizeShelves`, `sanitizeProfile`, `sniffImage`, `sniffAudio`, `decodeStoryText`, `readHead`, `createStore`, `writeJson`, `addAsset`, `read`. This lexical list includes private helpers; it is not an export list.
