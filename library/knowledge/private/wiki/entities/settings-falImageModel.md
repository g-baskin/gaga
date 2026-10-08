---
type: entity
title: "settings.falImageModel"
entity_type: config-key
status: developing
created: 2026-10-07
updated: 2026-10-07
path: "main.cjs"
language: js
depends_on:
  - "[[entities/settings-json]]"
used_by:
  - "[[entities/readSettings]]"
  - "[[entities/saveSettings]]"
  - "[[entities/fal-cjs]]"
last_commit_hash: "ded9f37"
tested_by: []
key: "falImageModel"
tags:
  - entity
  - config-key
related:
  - "[[entities/settings-falKeyEnc]]"
  - "[[concepts/picture-service-routing]]"
sources:
  - main.cjs
---

# settings.falImageModel

**Pinned fal.ai picture model ID; blank means automatic.**

Field of [[entities/settings-json]].

- **Type:** string, validated by `checkModel` (main.cjs)
- **Default:** `""` (main.cjs)

Passed as `model` to [[entities/fal-cjs]] `image()` (main.cjs) and shown as the pinned "Pictures" row in [[entities/aiRecommendations]] (main.cjs). Set from the fal.ai panel's "Always use a specific model instead" field in [[entities/account-screen]].

## Connections

- **depends_on:** [[entities/settings-json]]
- **used_by:** [[entities/readSettings]], [[entities/saveSettings]], [[entities/fal-cjs]]
- **related:** [[entities/settings-falKeyEnc]], [[concepts/picture-service-routing]]

## History

- Last touched by commit `ded9f37` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `main.cjs`
