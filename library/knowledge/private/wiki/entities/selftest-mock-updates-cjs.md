---
type: entity
title: "selftest/mock-updates.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "selftest/mock-updates.cjs"
language: js
last_commit_hash: "448bd054acdf773edd48a1f563590442ad435947"
depends_on: ["[[entities/updater-cjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - selftest/mock-updates.cjs
---

# selftest/mock-updates.cjs

## Verified source surface (2026-10-08)

Scope documented in the source header of `selftest/mock-updates.cjs`:

> A stand-in for GitHub Releases that serves a signed latest.json and a real zipped .app, for the updater's unit tests and the UI self-test. The fake app reuses Electron's small launcher binary, so it has the right chip for whichever Mac (or CI runner) runs the tests, and it gets a real ad-hoc code signature.


Named function declarations in `selftest/mock-updates.cjs`: `makeAppZip`, `startUpdateServer`. This lexical list includes private helpers; it is not an export list.

Local dependency evidence (literal import/require statements in `selftest/mock-updates.cjs`):

- `../updater.cjs` → [[entities/updater-cjs]].

Execution was not performed during this documentation refresh.
