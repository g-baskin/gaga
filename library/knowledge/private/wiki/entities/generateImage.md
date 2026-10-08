---
type: entity
title: "generateImage"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-07
path: "main.cjs"
language: js
depends_on:
  - "[[entities/readSettings]]"
  - "[[entities/aiRequest]]"
  - "[[entities/createOpenRouter]]"
  - "[[entities/createStore]]"
used_by:
  - "[[entities/ipc-ai-image]]"
last_commit_hash: "eb83d47"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[entities/settings-pictures]]"
sources:
  - main.cjs
---

# generateImage

## Overview

Defined in `main.cjs`.

## Signature

```js
async function generateImage(input = {})
```

## Behavior

Picture or line-art prompt; OpenRouter `image` or `/images/generations` (b64) on own service; saves bytes as a book asset.

## Changes since 2add52d

In main.cjs. When `pictures === "fal"` it draws through [[entities/fal-cjs]] (main.cjs).

## Connections

- **depends_on:** [[entities/readSettings]], [[entities/aiRequest]], [[entities/createOpenRouter]], [[entities/createStore]]
- **used_by:** [[entities/ipc-ai-image]]
- **related:** [[entities/settings-pictures]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`
