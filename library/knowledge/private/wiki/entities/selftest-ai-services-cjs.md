---
type: entity
title: "selftest/ai-services.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "selftest/ai-services.cjs"
language: js
last_commit_hash: "6a7c05c7ff9ea19d4f429f77bdfd0ca2c2dd2cf7"
depends_on: ["[[entities/selftest-mock-services-cjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - selftest/ai-services.cjs
---

# selftest/ai-services.cjs

## Verified source surface (2026-10-08)

Scope documented in the source header of `selftest/ai-services.cjs`:

> AI services: Claude Code, ChatGPT sign-in, and OpenRouter (with automatic model choice), driven through the real Account screen and then used by real writing, picture, and voice jobs.

Named check assignments: `claudePathOnlyClaude`, `claudeConnected`, `claudeWriterSaved`, `claudeStory`, `claudeChapter`, `claudeLockedDown`, `claudeBudgetModel`, `chatGptWelcomeShown`, `chatGptEmail`, `chatGptModels`, `chatGptRegistered`, `chatGptEncrypted`, `chatGptStory`, `chatGptNoStore`, `usingPlanNote`, `chatGptUsageLimit`, `chatGptSignedOut`, `openRouterKeyEncrypted`, `recommendations`, `openRouterStory`, `openRouterFallbacks`, `openRouterPicture`, `openRouterLineArt`, `openRouterVoice`, `openRouterAttribution`, `thriftyPick`, `concurrentSaves`, `pinnedModel`, `falKeyEncrypted`, `falPicks`, `falPicksOnce`, `falPicture`, `falPictureNote`, `falOutOfCredit`. These are assertions in code, not evidence of execution.

Local dependency evidence (literal import/require statements in `selftest/ai-services.cjs`):

- `./mock-services.cjs` → [[entities/selftest-mock-services-cjs]].

Execution was not performed during this documentation refresh.
