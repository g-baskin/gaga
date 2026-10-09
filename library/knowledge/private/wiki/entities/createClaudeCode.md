---
type: entity
title: "createClaudeCode"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "ai/claude-code.cjs"
language: js
depends_on: []
used_by:
  - "[[entities/writeText]]"
  - "[[entities/main-ai-services-cjs]]"
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[entities/settings-claudePath]]"
  - "[[entities/env-CLAUDE_CONFIG_DIR]]"
sources:
  - main/ai-services.cjs
  - ai/claude-code.cjs
---

# createClaudeCode

## Overview

Defined in `ai/claude-code.cjs`.

## Signature

```js
function createClaudeCode({ getPath, home = os.homedir(), timeout = 300000 })
```

## Behavior

Returns `{ status, ask, locate }`. `locate` uses the configured path or searches PATH/common dirs; `ask` runs `claude -p --output-format json --no-session-persistence --tools "" --setting-sources "" --strict-mcp-config --disable-slash-commands` in a fresh temp dir with a minimal env (no API keys), 5-min timeout, 5 MB output cap.

## Connections

- **depends_on:** —
- **used_by:** [[entities/writeText]], [[entities/main-ai-services-cjs]]
- **related:** [[entities/settings-claudePath]], [[entities/env-CLAUDE_CONFIG_DIR]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `ai/claude-code.cjs`

## Ownership evidence

AI client imports and factory calls live in `main/ai-services.cjs` imports, `main/ai-services.cjs` (`getOpenRouter`, `getFal`, `getChatGpt`, `getClaudeCode`); main composes the factory at `main.cjs` (`createAiServices` composition).
