---
type: entity
title: "epub.cjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "epub.cjs"
language: js
depends_on: []
used_by:
  - "[[entities/main-export-cjs]]"
last_commit_hash: "e298d4b7b6d53117d55efe64e6565c12fe6134b4"
tested_by: []
tags:
  - entity
  - module
related:
  - "[[entities/exportEpub]]"
sources:
  - main/export.cjs
  - epub.cjs
---

# epub.cjs

**Dependency-free ZIP writer/reader and fixed-layout EPUB 3 builder.**

## Overview

Implements CRC-32 (epub.cjs), a stored (uncompressed) `zip` with a fixed 1980-01-01 DOS timestamp (epub.cjs, epub.cjs), an `unzip` for tests (epub.cjs) [[entities/buildEpub]] (epub.cjs), and `collectImages`, which loads the pictures pages refer to and drops references to pictures that no longer exist. Exports `{ zip, unzip, crc32, buildEpub, collectImages }`.

## Connections

- **depends_on:** —
- **used_by:** [[entities/main-export-cjs]]
- **related:** [[entities/exportEpub]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `epub.cjs`

## Verified source surface (2026-10-08)


Named function declarations in `epub.cjs`: `crc32`, `zip`, `unzip`, `buildEpub`, `collectImages`. This lexical list includes private helpers; it is not an export list.

## Ownership evidence

EPUB export helpers are imported by `main/export.cjs` imports.
