---
type: entity
title: "generateSpeech"
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
  - "[[entities/ipc-ai-speech]]"
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[entities/settings-voices]]"
sources:
  - main/ai-services.cjs
---

# generateSpeech

## Overview

Defined in `main/ai-services.cjs`.

## Signature

```js
async function generateSpeech(input = {})
```

## Behavior

Text ≤4000 chars to speech; voice from input (validated) or `settings.voice` or `alloy`; OpenRouter `speech` or `/audio/speech` mp3.

## Connections

- **depends_on:** [[entities/readSettings]], [[entities/aiRequest]], [[entities/createOpenRouter]], [[entities/createStore]]
- **used_by:** [[entities/ipc-ai-speech]]
- **related:** [[entities/settings-voices]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main/ai-services.cjs`

## Source ownership

Implementation moved to `main/ai-services.cjs` (factory-scoped symbols); IPC registration remains in `main.cjs` / `registerHandlers`. This is a source-location correction, not an inferred behavior change.
