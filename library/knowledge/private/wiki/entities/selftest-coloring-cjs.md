---
type: entity
title: "selftest/coloring.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "selftest/coloring.cjs"
language: js
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
depends_on: ["[[entities/selftest-mock-ai-cjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - selftest/coloring.cjs
---

# selftest/coloring.cjs

## Verified source surface (2026-10-08)

Scope documented in the source header of `selftest/coloring.cjs`:

> Coloring: line-art filter, convert a book via the UI, paint (fill/undo/brush/save), idea → coloring book with mock AI. A story book with one picture page.

Named check assignments: `lineArtPure`, `homeRendered`, `converted`, `convertedTitle`, `newImageName`, `whiteBackground`, `shapeOutlined`, `lineArtPixels`, `fillInside`, `fillStopsAtLine`, `undoCompact`, `undoRestores`, `brushPainted`, `savedColoredPage`, `ideaBookCreated`, `ideaPages`. These are assertions in code, not evidence of execution.

Local dependency evidence (literal import/require statements in `selftest/coloring.cjs`):

- `./mock-ai.cjs` → [[entities/selftest-mock-ai-cjs]].

Execution was not performed during this documentation refresh.
