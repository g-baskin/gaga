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
last_commit_hash: "ded9f37"
tested_by:
  - test/ai-services.test.cjs
  - test/model-picker.test.cjs
  - selftest/ai-services.cjs
tags:
  - entity
  - module
related:
  - "[[concepts/picture-service-routing]]"
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

## Changes since 2add52d

Committed in `ded9f37` ("Add fal.ai pictures, live cover preview, and picture-service notes"). Self-test hooks: [[entities/test-url-STORYLOOM_TEST_FAL_RUN]], [[entities/test-url-STORYLOOM_TEST_FAL_API]]; `mediaHostOk` allows 127.0.0.1 only in self-test (main.cjs).

## Connections

- **depends_on:** [[entities/model-picker-cjs]]
- **used_by:** [[entities/main-cjs]] (`getFal`, `generateImage` when `pictures === 'fal'`)
- **related:** [[concepts/ai-provider-routing]], [[entities/openrouter-cjs]], [[entities/settings-falKeyEnc]]

## History

- **Created:** commit `ded9f37` by AutomationGod on 2026-10-06.

## Sources

- `ai/fal.cjs`
