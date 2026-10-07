---
type: entity
title: "generateChapter"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "main.cjs"
language: js
depends_on:
  - "[[entities/chatJson]]"
used_by:
  - "[[entities/ipc-ai-chapter]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[entities/manuscript]]"
sources:
  - main.cjs:316
---

# generateChapter

## Overview

Defined at `main.cjs:316`.

## Signature

```js
async function generateChapter(input = {})
```

## Behavior

Writes/rewrites one manuscript chapter; word limit clamped 5–2000 (default 120).

## Connections

- **depends_on:** [[entities/chatJson]]
- **used_by:** [[entities/ipc-ai-chapter]]
- **related:** [[entities/manuscript]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:316`
