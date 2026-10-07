---
type: entity
title: "createOpenRouter"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "ai/openrouter.cjs"
language: js
depends_on:
  - "[[entities/model-picker-cjs]]"
  - "[[entities/pickTextModels]]"
used_by:
  - "[[entities/writeText]]"
  - "[[entities/generateImage]]"
  - "[[entities/generateSpeech]]"
  - "[[entities/aiRecommendations]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[concepts/ai-provider-routing]]"
sources:
  - ai/openrouter.cjs:8
---

# createOpenRouter

## Overview

Defined at `ai/openrouter.cjs:8`.

## Signature

```js
function createOpenRouter({ baseUrl = 'https://openrouter.ai/api/v1', getKey })
```

## Behavior

Returns `{ chat, image, speech, recommendations, clearCache }`. Bounded `request` with bearer key from `getKey`; caches public catalogues; picks models via model-picker unless a model is pinned.

## Connections

- **depends_on:** [[entities/model-picker-cjs]], [[entities/pickTextModels]]
- **used_by:** [[entities/writeText]], [[entities/generateImage]], [[entities/generateSpeech]], [[entities/aiRecommendations]]
- **related:** [[concepts/ai-provider-routing]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `ai/openrouter.cjs:8`
