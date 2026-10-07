---
type: entity
title: "page (data model)"
entity_type: data-model
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "storage.cjs"
language: js
depends_on:
  - "[[entities/element]]"
  - "[[entities/crop]]"
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
  - storage.cjs:135
---

# page (data model)

Shape enforced by `sanitizePage` (storage.cjs:135).

`{ id, layout: cover|image-top|image-left|image-full|text-only|blank, text, image, crop, background, color, font, fontSize 10–96, align, frame, frameColor, elements[] }` (≤200 elements).

Invalid fields are replaced by defaults rather than rejected.

## Connections

- **depends_on:** [[entities/element]], [[entities/crop]]
- **used_by:** [[entities/createStore]]
- **related:** [[concepts/sanitize-on-every-boundary]]

## Tested by

- test/storage.test.cjs

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `storage.cjs:135`
