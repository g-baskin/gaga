---
type: entity
title: "settings.falImageModel"
entity_type: config-key
status: developing
created: 2026-10-07
updated: 2026-10-08
path: "main/settings.cjs"
language: js
depends_on:
  - "[[entities/settings-json]]"
used_by:
  - "[[entities/readSettings]]"
  - "[[entities/saveSettings]]"
  - "[[entities/fal-cjs]]"
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
key: "falImageModel"
tags:
  - entity
  - config-key
related:
  - "[[entities/settings-falKeyEnc]]"
  - "[[concepts/picture-service-routing]]"
sources:
  - main/settings.cjs
  - main/ai-services.cjs
---

# settings.falImageModel

**Pinned fal.ai picture model ID; blank means automatic.**

Field of [[entities/settings-json]].

- **Type:** string, validated by `checkModel` (main/settings.cjs)
- **Default:** `""` (main/settings.cjs)

Passed as `model` to [[entities/fal-cjs]] `image()` by `main/ai-services.cjs` / `generateImage` and shown as the pinned "Pictures" row by [[entities/aiRecommendations]] in `main/ai-services.cjs`. Set from the fal.ai panel's "Always use a specific model instead" field in [[entities/account-screen]].

## Connections

- **depends_on:** [[entities/settings-json]]
- **used_by:** [[entities/readSettings]], [[entities/saveSettings]], [[entities/fal-cjs]]
- **related:** [[entities/settings-falKeyEnc]], [[concepts/picture-service-routing]]

## History

- Last touched by commit `ded9f37` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `main/settings.cjs` (`readSettings`, `saveSettingsNow`)
- `main/ai-services.cjs` (`generateImage`, `aiRecommendations`)

## Source ownership

Implementation moved to `main/settings.cjs` (factory-scoped symbols); IPC registration remains in `main.cjs` / `registerHandlers`. This is a source-location correction, not an inferred behavior change.
