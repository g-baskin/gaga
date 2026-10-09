---
type: entity
title: "selftest/story-builder.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "selftest/story-builder.cjs"
language: js
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
depends_on: ["[[entities/selftest-mock-ai-cjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - selftest/story-builder.cjs
---

# selftest/story-builder.cjs

## Verified source surface (2026-10-08)

Scope documented in the source header of `selftest/story-builder.cjs`:

> Story builder: validation, characters + library, details, preview, AI write, offline outline. Empty idea → inline errors, nothing written.

Named check assignments: `validationShown`, `stayedOnBuilder`, `noChaptersYet`, `errorsCleared`, `bookBarSynced`, `previewLiveDraft`, `previewLiveCast`, `pictureNoteReady`, `drawEnabled`, `characterAdded`, `pictureNoteMissing`, `drawDisabled`, `previewNoNull`, `previewTypingLive`, `previewCancelReverts`, `previewIgnoresLateDraft`, `savedToLibrary`, `libraryPicture`, `insertedCopy`, `previewSetting`, `previewTitle`, `previewSize`, `coverFitsAtMinWidth`, `motionNormal`, `motionReduced`, `wentToManuscript`, `chaptersWritten`, `builderPersisted`, `outlineChapters`. These are assertions in code, not evidence of execution.

Local dependency evidence (literal import/require statements in `selftest/story-builder.cjs`):

- `./mock-ai.cjs` → [[entities/selftest-mock-ai-cjs]].

Execution was not performed during this documentation refresh.
