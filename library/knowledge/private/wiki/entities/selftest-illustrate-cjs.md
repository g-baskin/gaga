---
type: entity
title: "selftest/illustrate.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "selftest/illustrate.cjs"
language: js
last_commit_hash: "cee7902605e955a437522e21109449a3c2b0e812"
depends_on: ["[[entities/selftest-mock-services-cjs]]", "[[entities/selftest-mock-ai-cjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - selftest/illustrate.cjs
---

# selftest/illustrate.cjs

## Verified source surface (2026-10-08)

Scope documented in the source header of `selftest/illustrate.cjs`:

> Illustrate the whole book, through the real Designer, against the local fake services: with fal.ai, the main character's portrait is uploaded and sent with every page; pages get pictures, keep what they were drawn from, and "Redraw this picture" uses it again. Then the same with your own service.

Named check assignments: `castNamed`, `sendingDisclosed`, `countsPages`, `finished`, `picturePagesDrawn`, `coverAndTextLeftAlone`, `promptsKept`, `referencesSent`, `referenceUploaded`, `styleAndCastInPrompt`, `pictureFileSaved`, `redrawn`, `redrawReusesPrompt`, `noRedrawForOwnPicture`, `ownServiceWorks`, `ownServiceSaved`. These are assertions in code, not evidence of execution.

Local dependency evidence (literal import/require statements in `selftest/illustrate.cjs`):

- `./mock-services.cjs` → [[entities/selftest-mock-services-cjs]].
- `./mock-ai.cjs` → [[entities/selftest-mock-ai-cjs]].

Execution was not performed during this documentation refresh.
