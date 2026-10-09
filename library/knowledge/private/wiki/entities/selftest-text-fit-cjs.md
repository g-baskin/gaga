---
type: entity
title: "selftest/text-fit.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "selftest/text-fit.cjs"
language: js
last_commit_hash: "e298d4b7b6d53117d55efe64e6565c12fe6134b4"
depends_on: ["[[entities/epub-cjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - selftest/text-fit.cjs
---

# selftest/text-fit.cjs

## Verified source surface (2026-10-08)

Scope documented in the source header of `selftest/text-fit.cjs`:

> Page words that are too long shrink to fit, on screen, in PDFs, and in e-books; the Designer says so. A real chapter Claude wrote for an early reader (64 words): too long for 28 pt under a picture, but it fits smaller.

Named check assignments: `longPageShrunk`, `shortPageUnchanged`, `savedSizeKept`, `noteShrunk`, `noteEmptyWhenFits`, `noteWarnsWhenTooLong`, `growsBack`, `epubUsesFittedSize`. These are assertions in code, not evidence of execution.

Local dependency evidence (literal import/require statements in `selftest/text-fit.cjs`):

- `../epub.cjs` → [[entities/epub-cjs]].

Execution was not performed during this documentation refresh.
