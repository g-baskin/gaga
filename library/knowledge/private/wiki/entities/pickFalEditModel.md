---
type: entity
title: "pickFalEditModel"
entity_type: function
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "ai/model-picker.cjs"
language: js
last_commit_hash: "7d459e2d1140ffc4d9f2ab44379827342ea99b24"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/model-picker-cjs]]"]
tags: [entity, function]
sources:
  - ai/model-picker.cjs
---

# pickFalEditModel

```js
function pickFalEditModel({ models = [], tier = 'balanced' })
```

Selects a reference-capable fal edit model from active catalogue entries using budget family preferences and version sorting; returns null if no candidate fits.

Evidence: `ai/model-picker.cjs` / `pickFalEditModel`. Factory-scoped helpers are not necessarily module exports. See [[entities/model-picker-cjs]].
