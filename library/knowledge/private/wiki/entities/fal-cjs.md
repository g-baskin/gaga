---
type: entity
title: "ai/fal.cjs"
entity_type: module
status: developing
created: 2026-10-07
updated: 2026-10-07
path: "ai/fal.cjs"
language: js
depends_on:
  - "[[entities/model-picker-cjs]]"
used_by:
  - "[[entities/main-cjs]]"
last_commit_hash: "uncommitted"
tested_by:
  - test/ai-services.test.cjs
  - test/model-picker.test.cjs
  - selftest/ai-services.cjs
tags:
  - entity
  - module
related:
  - "[[concepts/ai-provider-routing]]"
  - "[[entities/openrouter-cjs]]"
  - "[[entities/settings-falKeyEnc]]"
sources:
  - ai/fal.cjs
---

# ai/fal.cjs

**fal.ai client: AI pictures only, with live model choice.**

## Overview

`createFal({ runBase, apiBase, getKey, mediaHostOk })` returns `{ image, recommendations, chooseImage, catalog, inputFields }`.

- **Model list:** `GET {apiBase}/models?category=text-to-image&status=active` (fal's public Platform API, no key needed), cached 6 h, choice by `pickFalModel` in [[entities/model-picker-cjs]].
- **Settings sent:** each model's OpenAPI input schema (`expand=openapi-3.0`) decides which of `image_size: square_hd` or `aspect_ratio: 1:1`, `output_format: png`, `num_images: 1` and `sync_mode: true` are sent.
- **Drawing:** `POST {runBase}/<model>` with `Authorization: Key <key>`. The picture comes back inline as a data URL, or is downloaded over https from fal's own hosts only (redirects re-checked, 40 MB cap).
- **Errors:** friendly text for no key, wrong key, empty balance, busy, and rejected requests.

## Connections

- **depends_on:** [[entities/model-picker-cjs]]
- **used_by:** [[entities/main-cjs]] (`getFal`, `generateImage` when `pictures === 'fal'`)
- **related:** [[concepts/ai-provider-routing]], [[entities/openrouter-cjs]], [[entities/settings-falKeyEnc]]

## History

- **Created:** 2026-10-07, not yet committed at the time of writing.

## Sources

- `ai/fal.cjs`
