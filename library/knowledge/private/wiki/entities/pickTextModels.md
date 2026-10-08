---
type: entity
title: "pickTextModels"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "ai/model-picker.cjs"
language: js
depends_on: []
used_by:
  - "[[entities/createOpenRouter]]"
last_commit_hash: "a5dac04"
tested_by:
  - test/model-picker.test.cjs
tags:
  - entity
  - function
related:
  - "[[entities/settings-tier]]"
sources:
  - ai/model-picker.cjs
---

# pickTextModels

## Overview

Defined in `ai/model-picker.cjs`.

## Signature

```js
function pickTextModels({ catalog = [], creativeRanking = [], translationRanking = [], benchmarks = [], task = 'story', tier = 'balanced', language = '', now = Date.now() })
```

## Behavior

Ranks OpenRouter text models for a task/tier/language using catalogue, creative/translation rankings and benchmarks, with price caps and context minimums; returns primary + fallbacks + reason.

## Connections

- **depends_on:** —
- **used_by:** [[entities/createOpenRouter]]
- **related:** [[entities/settings-tier]]

## Tested by

- test/model-picker.test.cjs

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `ai/model-picker.cjs`
