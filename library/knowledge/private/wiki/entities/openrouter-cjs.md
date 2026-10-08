---
type: entity
title: "ai/openrouter.cjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "ai/openrouter.cjs"
language: js
depends_on:
  - "[[entities/model-picker-cjs]]"
used_by:
  - "[[entities/main-cjs]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - module
related:
  - "[[concepts/ai-provider-routing]]"
sources:
  - ai/openrouter.cjs
---

# ai/openrouter.cjs

**OpenRouter client: catalogue-driven model choice with fallbacks.**

## Overview

See [[entities/createOpenRouter]] (ai/openrouter.cjs). Requires `./model-picker.cjs` (ai/openrouter.cjs); catalogue cache TTL 6 h (ai/openrouter.cjs).

## Connections

- **depends_on:** [[entities/model-picker-cjs]]
- **used_by:** [[entities/main-cjs]]
- **related:** [[concepts/ai-provider-routing]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `ai/openrouter.cjs`
