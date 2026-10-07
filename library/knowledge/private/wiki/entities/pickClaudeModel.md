---
type: entity
title: "pickClaudeModel"
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
  - ai/model-picker.cjs:177
---

# pickClaudeModel

## Overview

Defined at `ai/model-picker.cjs:177`.

## Signature

```js
function pickClaudeModel({ task = 'story', tier = 'balanced' })
```

## Behavior

best→opus for stories else sonnet; balanced→sonnet; thrifty→haiku. Captions shift one tier cheaper.

## Connections

- **depends_on:** —
- **used_by:** [[entities/writeText]], [[entities/aiRecommendations]]
- **related:** [[entities/settings-tier]]

## Tested by

- test/model-picker.test.cjs

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `ai/model-picker.cjs:177`
