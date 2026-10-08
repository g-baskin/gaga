---
type: entity
title: "pickChatGptModel"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "ai/model-picker.cjs"
language: js
depends_on: []
used_by:
  - "[[entities/writeText]]"
  - "[[entities/aiRecommendations]]"
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

# pickChatGptModel

## Overview

Defined in `ai/model-picker.cjs`.

## Signature

```js
function pickChatGptModel({ models = [], task = 'story', tier = 'balanced' })
```

## Behavior

First model in OpenAI's order; at thrifty budget prefers a `mini|lite|nano` model. `null` when the list is empty.

## Connections

- **depends_on:** —
- **used_by:** [[entities/writeText]], [[entities/aiRecommendations]]
- **related:** [[entities/settings-tier]]

## Tested by

- test/model-picker.test.cjs

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `ai/model-picker.cjs`
