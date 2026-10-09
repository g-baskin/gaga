---
type: entity
title: "ai/openrouter.cjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "ai/openrouter.cjs"
language: js
depends_on:
  - "[[entities/model-picker-cjs]]"
used_by:
  - "[[entities/main-ai-services-cjs]]"
last_commit_hash: "7d459e2d1140ffc4d9f2ab44379827342ea99b24"
tested_by: []
tags:
  - entity
  - module
related:
  - "[[concepts/ai-provider-routing]]"
sources:
  - main/ai-services.cjs
  - ai/openrouter.cjs
---

# ai/openrouter.cjs

**OpenRouter client: catalogue-driven model choice with fallbacks.**

## Overview

See [[entities/createOpenRouter]] (ai/openrouter.cjs). Requires `./model-picker.cjs` (ai/openrouter.cjs); catalogue cache TTL 6 h (ai/openrouter.cjs).

## Connections

- **depends_on:** [[entities/model-picker-cjs]]
- **used_by:** [[entities/main-ai-services-cjs]]
- **related:** [[concepts/ai-provider-routing]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `ai/openrouter.cjs`

## Verified source surface (2026-10-08)


Named function declarations in `ai/openrouter.cjs`: `createOpenRouter`, `request`, `catalog`, `qualityScores`, `chooseText`, `chat`, `chooseImage`, `image`, `chooseSpeech`, `speech`, `recommendations`. This lexical list includes private helpers; it is not an export list.

Local dependency evidence (literal import/require statements in `ai/openrouter.cjs`):

- `./model-picker.cjs` → [[entities/model-picker-cjs]].

## Current responsibility boundary

`image` checks catalogue-supported optional parameters before sending aspect_ratio/output_format; reference images become data-URL input_references only when the chosen plan supports them or a model is pinned. It returns bytes, model and usedReferences (`ai/openrouter.cjs` / `image`).

## Ownership evidence

AI client imports and factory calls live in `main/ai-services.cjs` imports, `main/ai-services.cjs` (`getOpenRouter`, `getFal`, `getChatGpt`, `getClaudeCode`); main composes the factory at `main.cjs` (`createAiServices` composition).
