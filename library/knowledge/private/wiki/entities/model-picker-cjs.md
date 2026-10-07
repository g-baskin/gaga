---
type: entity
title: "ai/model-picker.cjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-07
path: "ai/model-picker.cjs"
language: js
depends_on: []
used_by:
  - "[[entities/openrouter-cjs]]"
  - "[[entities/main-cjs]]"
last_commit_hash: "ded9f37"
tested_by: []
tags:
  - entity
  - module
related:
  - "[[concepts/picture-service-routing]]"
  - "[[concepts/ai-provider-routing]]"
  - "[[entities/settings-tier]]"
sources:
  - ai/model-picker.cjs
---

# ai/model-picker.cjs

**Pure functions that choose an AI model per job and budget tier.**

## Overview

No network; designed for unit testing (ai/model-picker.cjs:2). Defines `TIERS = ['best','balanced','thrifty']` (ai/model-picker.cjs:11), `TASKS` (story/chapter/captions with `minContext` and `tierShift`; ai/model-picker.cjs:14) and `PRICE_CAP` per tier in USD per million output tokens (ai/model-picker.cjs:21). Functions: [[entities/pickTextModels]], `pickImageModel` (ai/model-picker.cjs:127), `pickSpeechModel` (ai/model-picker.cjs:160), `pickVoice` (ai/model-picker.cjs:150), [[entities/pickClaudeModel]], [[entities/pickChatGptModel]].

## Changes since 2add52d

Adds `pickFalModel({ models, tier, lineArt })` (ai/model-picker.cjs:205) with `FAL_PREFERENCE` (:195), `FAL_LINE_ART` (Recraft text-to-image for colouring pages, :201) and `FAL_SKIP` (:203); exported at :225. Called by [[entities/fal-cjs]] (ai/fal.cjs:146).

## Connections

- **depends_on:** —
- **used_by:** [[entities/openrouter-cjs]], [[entities/main-cjs]]
- **related:** [[concepts/ai-provider-routing]], [[entities/settings-tier]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `ai/model-picker.cjs`
