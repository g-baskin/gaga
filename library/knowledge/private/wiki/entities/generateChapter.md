---
type: entity
title: "generateChapter"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "main/ai-services.cjs"
language: js
depends_on:
  - "[[entities/chatJson]]"
used_by:
  - "[[entities/ipc-ai-chapter]]"
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[entities/manuscript]]"
sources:
  - main/ai-services.cjs
---

# generateChapter

## Overview

Defined in `main/ai-services.cjs`.

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

- `main/ai-services.cjs`

## Source ownership

Implementation moved to `main/ai-services.cjs` (factory-scoped symbols); IPC registration remains in `main.cjs` / `registerHandlers`. This is a source-location correction, not an inferred behavior change.
