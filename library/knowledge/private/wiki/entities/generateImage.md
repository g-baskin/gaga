---
type: entity
title: "generateImage"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "main/ai-services.cjs"
language: js
depends_on:
  - "[[entities/readSettings]]"
  - "[[entities/aiRequest]]"
  - "[[entities/createOpenRouter]]"
  - "[[entities/createStore]]"
used_by:
  - "[[entities/ipc-ai-image]]"
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[entities/settings-pictures]]"
sources:
  - main/ai-services.cjs
---

# generateImage

> [!stale] Prior description retained below
> The prior behavior described prompt-only generation. This is not the current contract.

> [!contradiction] Verified correction 2026-10-08
> generateImage additionally accepts references and aspect; it reads at most four distinct book images, suppresses references for line art, sends them to OpenRouter/fal where supported, and keeps custom image generation reference-free. Evidence: `main/ai-services.cjs` / `readReferences`, `generateImage`; `ai/openrouter.cjs` / `image`; `ai/fal.cjs` / `image`. See [[meta/2026-10-08-contradiction-report]].

## Prior scan / historical description


## Overview

Defined in `main/ai-services.cjs`.

## Signature

```js
async function generateImage(input = {})
```

## Behavior

Picture or line-art prompt; OpenRouter `image` or `/images/generations` (b64) on own service; saves bytes as a book asset.

## Changes since 2add52d

In main/ai-services.cjs. When `pictures === "fal"` it draws through [[entities/fal-cjs]] (main/ai-services.cjs).

## Connections

- **depends_on:** [[entities/readSettings]], [[entities/aiRequest]], [[entities/createOpenRouter]], [[entities/createStore]]
- **used_by:** [[entities/ipc-ai-image]]
- **related:** [[entities/settings-pictures]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main/ai-services.cjs`

## Source ownership

Implementation moved to `main/ai-services.cjs` (factory-scoped symbols); IPC registration remains in `main.cjs` / `registerHandlers`. This is a source-location correction, not an inferred behavior change.
