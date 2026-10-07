---
type: entity
title: "sanitizeBook"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "storage.cjs"
language: js
depends_on:
  - "[[entities/sanitizePage]]"
used_by:
  - "[[entities/createStore]]"
last_commit_hash: "a5dac04"
tested_by:
  - test/storage.test.cjs
tags:
  - entity
  - function
related:
  - "[[entities/book]]"
sources:
  - storage.cjs:230
---

# sanitizeBook

## Overview

Defined at `storage.cjs:230`.

## Signature

```js
function sanitizeBook(book, now = Date.now())
```

## Behavior

Normalises a whole [[entities/book]]; ensures ≥1 page (a cover), sets `updatedAt=now`, prunes narration for deleted pages.

## Connections

- **depends_on:** [[entities/sanitizePage]]
- **used_by:** [[entities/createStore]]
- **related:** [[entities/book]]

## Tested by

- test/storage.test.cjs

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `storage.cjs:230`
