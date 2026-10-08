---
type: entity
title: "aiRecommendations"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-07
path: "main.cjs"
language: js
depends_on:
  - "[[entities/readSettings]]"
  - "[[entities/createOpenRouter]]"
  - "[[entities/pickClaudeModel]]"
  - "[[entities/pickChatGptModel]]"
used_by:
  - "[[entities/ipc-ai-recommendations]]"
last_commit_hash: "eb83d47"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[concepts/ai-provider-routing]]"
sources:
  - main.cjs
---

# aiRecommendations

## Overview

Defined in `main.cjs`.

## Signature

```js
async function aiRecommendations()
```

## Behavior

Rows `{job, model, fallbacks, reason}` describing which model each job will use for the current writer/pictures/voices/tier; shown on Account.

## Changes since 2add52d

In main.cjs. Adds rows for fal.ai pictures (main.cjs).

## Connections

- **depends_on:** [[entities/readSettings]], [[entities/createOpenRouter]], [[entities/pickClaudeModel]], [[entities/pickChatGptModel]]
- **used_by:** [[entities/ipc-ai-recommendations]]
- **related:** [[concepts/ai-provider-routing]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`
