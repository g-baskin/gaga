---
type: entity
title: "aiRequest"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "main.cjs"
language: js
depends_on:
  - "[[entities/readSettings]]"
used_by:
  - "[[entities/writeText]]"
  - "[[entities/generateImage]]"
  - "[[entities/generateSpeech]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[concepts/ai-provider-routing]]"
sources:
  - main.cjs
---

# aiRequest

## Overview

Defined in `main.cjs`.

## Signature

```js
async function aiRequest(endpoint, body, { needs, maxBytes = 2_000_000, binary = false, timeout = 120000 })
```

## Behavior

POSTs to the user's own OpenAI-compatible service (`baseUrl`+endpoint) with bearer key, `redirect:"error"`, timeout and byte caps (header and body). Returns JSON or binary.

## Connections

- **depends_on:** [[entities/readSettings]]
- **used_by:** [[entities/writeText]], [[entities/generateImage]], [[entities/generateSpeech]]
- **related:** [[concepts/ai-provider-routing]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`
