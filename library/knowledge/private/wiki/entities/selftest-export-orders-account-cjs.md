---
type: entity
title: "selftest/export-orders-account.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "selftest/export-orders-account.cjs"
language: js
last_commit_hash: "cee7902605e955a437522e21109449a3c2b0e812"
depends_on: ["[[entities/selftest-mock-ai-cjs]]", "[[entities/epub-cjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - selftest/export-orders-account.cjs
---

# selftest/export-orders-account.cjs

## Verified source surface (2026-10-08)

Scope documented in the source header of `selftest/export-orders-account.cjs`:

> Export (PDF digital/print, EPUB, WAV, ISBN, copyright page), Print orders, and Account.

Named check assignments: `panelShown`, `printWarning24`, `wavEnabled`, `isbnInvalid`, `isbnErrorCleared`, `isbnSaved`, `printPdf`, `digitalPdf`, `pdfHasCopyrightPage`, `pagesNotPersisted`, `epubWritten`, `epubMimetype`, `epubNav`, `epubOnePerPage`, `epubImage`, `epubIsbn`, `epubShapeSvg`, `wavWritten`, `wavHeader`, `wavDuration`, `dialogOpen`, `ordersUnavailable`, `ordersPicker`, `ordersToExport`, `accountPrefilled`, `cloudUnavailable`, `licenseShown`, `privacyLink`, `notOfflineOnly`, `dataPath`, `authorSaved`, `aiSaved`, `aiErrorInline`, `baseUrlKept`. These are assertions in code, not evidence of execution.

Local dependency evidence (literal import/require statements in `selftest/export-orders-account.cjs`):

- `./mock-ai.cjs` → [[entities/selftest-mock-ai-cjs]].
- `../epub.cjs` → [[entities/epub-cjs]].

Execution was not performed during this documentation refresh.
