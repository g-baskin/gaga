---
type: entity
title: "writeText"
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
  - "[[entities/createChatGpt]]"
  - "[[entities/createClaudeCode]]"
  - "[[entities/pickClaudeModel]]"
  - "[[entities/pickChatGptModel]]"
used_by:
  - "[[entities/chatJson]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[concepts/ai-provider-routing]]"
  - "[[entities/settings-writer]]"
sources:
  - main.cjs
---

# writeText

## Overview

Defined in `main.cjs`.

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

- `main.cjs`
