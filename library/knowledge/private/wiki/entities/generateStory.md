---
type: entity
title: "generateStory"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "main.cjs"
language: js
depends_on:
  - "[[entities/chatJson]]"
used_by:
  - "[[entities/ipc-ai-generate]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[entities/builder]]"
sources:
  - main.cjs
---

# generateStory

## Overview

Defined in `main.cjs`.

## Signature

```js
async function generateStory(input = {})
```

## Behavior

Builds a prompt from idea, reader level, length (3–30 pages), language, characters and details; expects `{title, chapters:[{title,text}]}` (also accepts `pages`). Task is `captions` when `purpose==="coloring"`.

## Connections

- **depends_on:** [[entities/chatJson]]
- **used_by:** [[entities/ipc-ai-generate]]
- **related:** [[entities/builder]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`
