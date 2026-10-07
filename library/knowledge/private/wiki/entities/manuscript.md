---
type: entity
title: "manuscript (data model)"
entity_type: data-model
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "storage.cjs"
language: js
depends_on: []
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
  - storage.cjs:196
---

# manuscript (data model)

Shape enforced by `sanitizeManuscript` (storage.cjs:196).

`{ chapters: [{ id, title, blocks: [{ type: p|h2|h3|quote|li, runs: [{ text, b?, i?, u? }] }] }] }` — structured runs, never HTML. ≤200 chapters, ≤2000 blocks.

Invalid fields are replaced by defaults rather than rejected.

## Connections

- **depends_on:** —
- **used_by:** [[entities/createStore]]
- **related:** [[concepts/sanitize-on-every-boundary]]

## Tested by

- test/storage.test.cjs

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `storage.cjs:196`
