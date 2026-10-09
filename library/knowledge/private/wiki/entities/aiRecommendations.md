---
type: entity
title: "aiRecommendations"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "main/ai-services.cjs"
language: js
depends_on:
  - "[[entities/readSettings]]"
  - "[[entities/createOpenRouter]]"
  - "[[entities/pickClaudeModel]]"
  - "[[entities/pickChatGptModel]]"
used_by:
  - "[[entities/ipc-ai-recommendations]]"
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[concepts/ai-provider-routing]]"
sources:
  - main/ai-services.cjs
---

# aiRecommendations

## Overview

Defined in `main/ai-services.cjs`.

## Signature

```js
async function aiRecommendations()
```

## Behavior

Rows `{job, model, fallbacks, reason}` describing which model each job will use for the current writer/pictures/voices/tier; shown on Account.

## Changes since 2add52d

In main/ai-services.cjs. Adds rows for fal.ai pictures (main/ai-services.cjs).

## Connections

- **depends_on:** [[entities/readSettings]], [[entities/createOpenRouter]], [[entities/pickClaudeModel]], [[entities/pickChatGptModel]]
- **used_by:** [[entities/ipc-ai-recommendations]]
- **related:** [[concepts/ai-provider-routing]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main/ai-services.cjs`

## Source ownership

Implementation moved to `main/ai-services.cjs` (factory-scoped symbols); IPC registration remains in `main.cjs` / `registerHandlers`. This is a source-location correction, not an inferred behavior change.
