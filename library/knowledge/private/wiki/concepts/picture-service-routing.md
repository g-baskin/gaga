---
type: concept
title: "Picture-service routing"
status: developing
created: 2026-10-07
updated: 2026-10-07
complexity: intermediate
domain: "storyloom"
tags:
  - concept
  - storyloom
  - ai
related:
  - "[[concepts/ai-provider-routing]]"
  - "[[entities/fal-cjs]]"
  - "[[entities/generateImage]]"
sources:
  - main.cjs
---

# Picture-service routing

`settings.pictures` ∈ `PICTURES = ['custom','openrouter','fal']` (main.cjs; [[entities/settings-pictures]]):

- **openrouter:** [[entities/createOpenRouter]] with `orImageModel` or auto-pick.
- **fal:** [[entities/fal-cjs]] with [[entities/settings-falKeyEnc]]; model from `falImageModel` or `pickFalModel` in [[entities/model-picker-cjs]] (main.cjs).
- **custom:** the author's own AI service (`baseUrl` + key).

The ChatGPT and Claude plans write only: [[entities/settings-writer]] can pick them, but they never draw. `aiPictureNote` in [[entities/app-js]] (renderer/app.js) tells the user which service draws and disables Generate when none is set up.

## Entities

- [[entities/generateImage]], [[entities/fal-cjs]], [[entities/settings-falKeyEnc]], [[entities/settings-pictures]], [[entities/model-picker-cjs]]
