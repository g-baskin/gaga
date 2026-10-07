---
type: entity
title: "generateImage"
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
  - "[[entities/ipc-ai-image]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[entities/settings-pictures]]"
sources:
  - main.cjs:339
---

# generateImage

## Overview

Defined at `main.cjs:339`.

## Signature

```js
async function generateImage(input = {})
```

## Behavior

Picture or line-art prompt; OpenRouter `image` or `/images/generations` (b64) on own service; saves bytes as a book asset.

## Connections

- **depends_on:** [[entities/readSettings]], [[entities/aiRequest]], [[entities/createOpenRouter]], [[entities/createStore]]
- **used_by:** [[entities/ipc-ai-image]]
- **related:** [[entities/settings-pictures]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:339`
