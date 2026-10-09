---
type: entity
title: "test/model-picker.test.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "test/model-picker.test.cjs"
language: js
last_commit_hash: "7d459e2d1140ffc4d9f2ab44379827342ea99b24"
depends_on: ["[[entities/model-picker-cjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - test/model-picker.test.cjs
---

# test/model-picker.test.cjs

## Verified source surface (2026-10-08)

This is a test specification, not a recorded passing run. Literal test declarations in `test/model-picker.test.cjs` cover:

- balanced budget picks the most-used affordable writing model, with fallbacks
- best budget prefers the strongest model; measured quality scores win over price
- thrifty budget and simple jobs stay cheap
- non-English books favour models that are also popular for translation
- falls back to the full catalogue when the usage ranking is unavailable, and returns null when nothing fits
- picture models: per-budget preferences, line art for coloring pages, never vector output
- voices: picks a voice the model really has
- Claude and ChatGPT plan models follow the budget
- fal.ai picture models: per-budget choice, newest line-art model for coloring pages, no vector/LoRA
- pictures with characters: only models that take reference pictures

Local dependency evidence (literal import/require statements in `test/model-picker.test.cjs`):

- `../ai/model-picker.cjs` → [[entities/model-picker-cjs]].

Execution was not performed during this documentation refresh.
