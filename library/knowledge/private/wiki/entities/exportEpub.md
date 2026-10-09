---
type: entity
title: "exportEpub"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "main/export.cjs"
language: js
depends_on:
  - "[[entities/buildEpub]]"
  - "[[entities/createStore]]"
used_by:
  - "[[entities/ipc-books-export-epub]]"
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
tags:
  - entity
  - function
related: []
sources:
  - main/export.cjs
---

# exportEpub

## Overview

Defined in `main/export.cjs`. Pictures are gathered with `collectImages` (epub.cjs): a picture that no longer exists is skipped and its references removed, so the export still succeeds.

## Signature

```js
async function exportEpub(input = {})
```

## Behavior

Validates renderer-built page bodies (≤500 pages, ≤2 MB each, rejects `<script`, `on*=` and `javascript:`), restricts CSS `url()` to `images/`, packages only images that exist in the book, puts the cover image first, clamps size 100–4000, maps language name→ISO code, then [[entities/buildEpub]] and writes to a chosen file.

## Connections

- **depends_on:** [[entities/buildEpub]], [[entities/createStore]]
- **used_by:** [[entities/ipc-books-export-epub]]
- **related:** —

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main/export.cjs`

## Source ownership

Implementation moved to `main/export.cjs` (factory-scoped symbols); IPC registration remains in `main.cjs` / `registerHandlers`. This is a source-location correction, not an inferred behavior change.
