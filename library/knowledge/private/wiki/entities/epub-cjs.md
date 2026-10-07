---
type: entity
title: "epub.cjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "epub.cjs"
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
  - "[[entities/exportEpub]]"
sources:
  - epub.cjs
---

# epub.cjs

**Dependency-free ZIP writer/reader and fixed-layout EPUB 3 builder.**

## Overview

Implements CRC-32 (epub.cjs:14), a stored (uncompressed) `zip` with a fixed 1980-01-01 DOS timestamp (epub.cjs:22, epub.cjs:25), an `unzip` for tests (epub.cjs:74) [[entities/buildEpub]] (epub.cjs:100), and `collectImages`, which loads the pictures pages refer to and drops references to pictures that no longer exist. Exports `{ zip, unzip, crc32, buildEpub, collectImages }`.

## Connections

- **depends_on:** —
- **used_by:** [[entities/main-cjs]]
- **related:** [[entities/exportEpub]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `epub.cjs`
