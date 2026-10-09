---
type: entity
title: "writeText"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "main/ai-services.cjs"
language: js
depends_on:
  - "[[entities/readSettings]]"
  - "[[entities/aiRequest]]"
  - "[[entities/createOpenRouter]]"
  - "[[entities/createChatGpt]]"
  - "[[entities/createClaudeCode]]"
  - "[[entities/pickClaudeModel]]"
  - "[[entities/pickChatGptModel]]"
used_by:
  - "[[entities/chatJson]]"
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[concepts/ai-provider-routing]]"
  - "[[entities/settings-writer]]"
sources:
  - main/ai-services.cjs
---

# writeText

## Overview

Defined in `main/ai-services.cjs`.

## Signature

```js
async function writeText({ system, user, maxTokens, task, language })
```

## Behavior

Dispatches one writing job on `settings.writer`: openrouter → `chat`, chatgpt → `respond` (model from setting or `pickChatGptModel`), claude → `ask` (model from setting or `pickClaudeModel`), else `/chat/completions` via [[entities/aiRequest]]. Returns `{ content, model }`.

## Connections

- **depends_on:** [[entities/readSettings]], [[entities/aiRequest]], [[entities/createOpenRouter]], [[entities/createChatGpt]], [[entities/createClaudeCode]], [[entities/pickClaudeModel]], [[entities/pickChatGptModel]]
- **used_by:** [[entities/chatJson]]
- **related:** [[concepts/ai-provider-routing]], [[entities/settings-writer]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main/ai-services.cjs`

## Source ownership

Implementation moved to `main/ai-services.cjs` (factory-scoped symbols); IPC registration remains in `main.cjs` / `registerHandlers`. This is a source-location correction, not an inferred behavior change.
