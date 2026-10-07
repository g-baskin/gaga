---
type: entity
title: "book (data model)"
entity_type: data-model
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "storage.cjs"
language: js
depends_on:
  - "[[entities/page]]"
  - "[[entities/builder]]"
  - "[[entities/manuscript]]"
  - "[[entities/book-audio]]"
used_by:
  - "[[entities/createStore]]"
last_commit_hash: "a5dac04"
tested_by:
  - test/storage.test.cjs
tags:
  - entity
  - data-model
related:
  - "[[concepts/sanitize-on-every-boundary]]"
sources:
  - storage.cjs:230
---

# book (data model)

Shape enforced by `sanitizeBook` (storage.cjs:230).

`{ id, kind: story|coloring, title, author, size: square|portrait|landscape, isbn, language, builder, manuscript, audio, createdAt, updatedAt, pages[] }` stored at `books/<id>/book.json`. ≤500 pages; title defaults "Untitled story"; ISBN-10/13 validated.

Invalid fields are replaced by defaults rather than rejected.

## Connections

- **depends_on:** [[entities/page]], [[entities/builder]], [[entities/manuscript]], [[entities/book-audio]]
- **used_by:** [[entities/createStore]]
- **related:** [[concepts/sanitize-on-every-boundary]]

## Tested by

- test/storage.test.cjs

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `storage.cjs:230`
