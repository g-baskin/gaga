---
type: entity
title: "ai/model-picker.cjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "ai/model-picker.cjs"
language: js
depends_on: []
used_by:
  - "[[entities/openrouter-cjs]]"
  - "[[entities/main-ai-services-cjs]]"
  - "[[entities/main-settings-cjs]]"
last_commit_hash: "7d459e2d1140ffc4d9f2ab44379827342ea99b24"
tested_by: []
tags:
  - entity
  - module
related:
  - "[[concepts/picture-service-routing]]"
  - "[[concepts/ai-provider-routing]]"
  - "[[entities/settings-tier]]"
sources:
  - main/settings.cjs
  - main/ai-services.cjs
  - ai/model-picker.cjs
---

# ai/model-picker.cjs

**Pure functions that choose an AI model per job and budget tier.**

## Overview

No network; designed for unit testing (ai/model-picker.cjs). Defines `TIERS = ['best','balanced','thrifty']` (ai/model-picker.cjs), `TASKS` (story/chapter/captions with `minContext` and `tierShift`; ai/model-picker.cjs) and `PRICE_CAP` per tier in USD per million output tokens (ai/model-picker.cjs). Functions: [[entities/pickTextModels]], `pickImageModel` (ai/model-picker.cjs), `pickSpeechModel` (ai/model-picker.cjs), `pickVoice` (ai/model-picker.cjs), [[entities/pickClaudeModel]], [[entities/pickChatGptModel]].

## Changes since 2add52d

Adds `pickFalModel({ models, tier, lineArt })` (ai/model-picker.cjs) with `FAL_PREFERENCE`, `FAL_LINE_ART` (Recraft text-to-image for colouring pages) and `FAL_SKIP`; exported at :225. Called by [[entities/fal-cjs]] (ai/fal.cjs).

## Connections

- **depends_on:** —
- **used_by:** [[entities/openrouter-cjs]], [[entities/main-ai-services-cjs]], [[entities/main-settings-cjs]]
- **related:** [[concepts/ai-provider-routing]], [[entities/settings-tier]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `ai/model-picker.cjs`

## Verified source surface (2026-10-08)


Named function declarations in `ai/model-picker.cjs`: `usableForWriting`, `scoreMap`, `pickTextModels`, `pickImageModel`, `pickVoice`, `pickSpeechModel`, `pickClaudeModel`, `pickChatGptModel`, `pickFalEditModel`, `pickFalModel`. This lexical list includes private helpers; it is not an export list.

## Current responsibility boundary

Reference-aware image choice is separate from writing choice: `pickFalEditModel` selects edit-capable fal catalogue entries, while `pickImageModel` accepts withReferences. Writing uses TASKS/PRICE_CAP and pickTextModels with popularity, capability and optional measured-quality evidence (`ai/model-picker.cjs` / named symbols).

## Ownership evidence

AI client imports and factory calls live in `main/ai-services.cjs` imports, `main/ai-services.cjs` (`getOpenRouter`, `getFal`, `getChatGpt`, `getClaudeCode`); main composes the factory at `main.cjs` (`createAiServices` composition).

## Ownership evidence

Settings also imports the picker for TIERS (`main/settings.cjs` imports, `main/settings.cjs` (`readSettings`)).
