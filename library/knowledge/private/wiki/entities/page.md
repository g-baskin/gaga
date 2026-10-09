---
type: entity
title: "page (data model)"
entity_type: data-model
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "storage.cjs"
language: js
depends_on:
  - "[[entities/element]]"
  - "[[entities/crop]]"
used_by:
  - "[[entities/createStore]]"
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
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

# page (data model)

> [!stale] Prior description retained below
> The prior persisted shape omitted imagePrompt and titleFont. This is not the current contract.

> [!contradiction] Verified correction 2026-10-08
> sanitizePage preserves imagePrompt (up to 2000 characters) and a known titleFont (or empty string), supporting redraw and separate cover-title typography. Evidence: `storage.cjs` / `sanitizePage`. See [[meta/2026-10-08-contradiction-report]].

## Prior scan / historical description


Shape enforced by `sanitizePage` (storage.cjs).

`{ id, layout: cover|image-top|image-left|image-full|text-only|blank, text, image, crop, background, color, font, fontSize 10–96, align, frame, frameColor, elements[] }` (≤200 elements).

Invalid fields are replaced by defaults rather than rejected.

## Connections

- **depends_on:** [[entities/element]], [[entities/crop]]
- **used_by:** [[entities/createStore]]
- **related:** [[concepts/sanitize-on-every-boundary]]

## Tested by

- test/storage.test.cjs

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `storage.cjs`
