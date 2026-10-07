---
type: entity
title: "element (data model)"
entity_type: data-model
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "storage.cjs"
language: js
depends_on:
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
  - storage.cjs:61
---

# element (data model)

Shape enforced by `sanitizeElement` (storage.cjs:61).

Base `{ id, x, y, w, h, rotation, opacity, locked }` in points (1/72 in). Variants by `type`: **text** (text, font, fontSize, color, align, bold, italic, lineHeight, letterSpacing, shadow, outline, outlineColor, highlight); **image** (image, fit cover|contain, radius, borderWidth, borderColor, crop); **shape** (shape rect|rounded|ellipse|triangle|star|burst|heart|cloud|speech|arrow, fill, stroke, strokeWidth); **sticker** (char, emoji ≤16 chars); **sound** (char, label, sound asset, fill, stroke).

Invalid fields are replaced by defaults rather than rejected.

## Connections

- **depends_on:** [[entities/crop]]
- **used_by:** [[entities/createStore]]
- **related:** [[concepts/sanitize-on-every-boundary]]

## Tested by

- test/storage.test.cjs

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `storage.cjs:61`
