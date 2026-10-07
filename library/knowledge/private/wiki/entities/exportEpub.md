---
type: entity
title: "exportEpub"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "main.cjs"
language: js
depends_on:
  - "[[entities/buildEpub]]"
  - "[[entities/createStore]]"
used_by:
  - "[[entities/ipc-books-export-epub]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - function
related: []
sources:
  - main.cjs:437
---

# exportEpub

## Overview

Defined in `main.cjs`. Pictures are gathered with `collectImages` (epub.cjs): a picture that no longer exists is skipped and its references removed, so the export still succeeds.

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

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:437`
