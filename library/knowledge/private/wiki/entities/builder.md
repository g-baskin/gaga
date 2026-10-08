---
type: entity
title: "builder (data model)"
entity_type: data-model
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "storage.cjs"
language: js
depends_on:
  - "[[entities/character]]"
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
  - storage.cjs
---

# builder (data model)

Shape enforced by `sanitizeBuilder` (storage.cjs).

Story-builder plan: `{ idea, genre, writingStyle[≤8], location, era, extras, readingLevel, length, templateId, illustrationStyle, characters[≤30] }`.

Invalid fields are replaced by defaults rather than rejected.

## Connections

- **depends_on:** [[entities/character]]
- **used_by:** [[entities/createStore]]
- **related:** [[concepts/sanitize-on-every-boundary]]

## Tested by

- test/storage.test.cjs

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `storage.cjs`
