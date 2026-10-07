---
type: entity
title: "pickFalModel"
entity_type: function
status: developing
created: 2026-10-07
updated: 2026-10-07
path: "ai/model-picker.cjs"
language: js
depends_on:
  - "[[entities/model-picker-cjs]]"
used_by:
  - "[[entities/fal-cjs]]"
last_commit_hash: "ded9f37"
tested_by:
  - test/model-picker.test.cjs
tags:
  - entity
  - function
related:
  - "[[concepts/picture-service-routing]]"
  - "[[entities/settings-tier]]"
sources:
  - ai/model-picker.cjs:195
  - ai/model-picker.cjs:205
---

# pickFalModel

**Chooses a fal.ai picture model from fal's live list by budget tier.**

## Signature

```js
function pickFalModel({ models = [], tier = 'balanced', lineArt = false }) // → { model, reason } | null
```

Defined at ai/model-picker.cjs:205. Drops entries whose `endpoint_id` matches `FAL_SKIP` (vector/svg/lora/controlnet/kontext/material/layer) or aren't `active` (:207-208). Walks `FAL_PREFERENCE[tier]` regex families best-first (:195-199); for `lineArt` outside `thrifty`, Recraft patterns (`FAL_LINE_ART`, :201) go first. Within a family the highest `/vN/` version wins (:212). Falls back to the first usable model. Returns `null` if none. Called by [[entities/fal-cjs]] (ai/fal.cjs:146).

## Connections

- **depends_on:** [[entities/model-picker-cjs]]
- **used_by:** [[entities/fal-cjs]]
- **related:** [[concepts/picture-service-routing]], [[entities/settings-tier]]

## History

- Last touched by commit `ded9f37` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `ai/model-picker.cjs:195`
- `ai/model-picker.cjs:205`
