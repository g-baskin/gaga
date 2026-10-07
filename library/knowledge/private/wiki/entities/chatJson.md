---
type: entity
title: "chatJson"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "main.cjs"
language: js
depends_on:
  - "[[entities/writeText]]"
used_by:
  - "[[entities/generateStory]]"
  - "[[entities/generateChapter]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - function
related: []
sources:
  - main.cjs:278
---

# chatJson

## Overview

Defined at `main.cjs:278`.

## Signature

```js
async function chatJson(system, user, { maxTokens, task, language } = {})
```

## Behavior

Calls [[entities/writeText]] and parses the substring between the first `{` and last `}` as JSON.

## Connections

- **depends_on:** [[entities/writeText]]
- **used_by:** [[entities/generateStory]], [[entities/generateChapter]]
- **related:** —

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:278`
