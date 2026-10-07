---
type: entity
title: "generateSpeech"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "main.cjs"
language: js
depends_on:
  - "[[entities/readSettings]]"
  - "[[entities/aiRequest]]"
  - "[[entities/createOpenRouter]]"
  - "[[entities/createStore]]"
used_by:
  - "[[entities/ipc-ai-speech]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[entities/settings-voices]]"
sources:
  - main.cjs:362
---

# generateSpeech

## Overview

Defined at `main.cjs:362`.

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

- `main.cjs:362`
