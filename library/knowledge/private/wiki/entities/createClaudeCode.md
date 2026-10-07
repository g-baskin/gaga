---
type: entity
title: "createClaudeCode"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "ai/claude-code.cjs"
language: js
depends_on: []
used_by:
  - "[[entities/writeText]]"
  - "[[entities/main-cjs]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[entities/settings-claudePath]]"
  - "[[entities/env-CLAUDE_CONFIG_DIR]]"
sources:
  - ai/claude-code.cjs:36
---

# createClaudeCode

## Overview

Defined at `ai/claude-code.cjs:36`.

## Signature

```js
function createClaudeCode({ getPath, home = os.homedir(), timeout = 300000 })
```

## Behavior

Returns `{ status, ask, locate }`. `locate` uses the configured path or searches PATH/common dirs; `ask` runs `claude -p --output-format json --no-session-persistence --tools "" --setting-sources "" --strict-mcp-config --disable-slash-commands` in a fresh temp dir with a minimal env (no API keys), 5-min timeout, 5 MB output cap.

## Connections

- **depends_on:** —
- **used_by:** [[entities/writeText]], [[entities/main-cjs]]
- **related:** [[entities/settings-claudePath]], [[entities/env-CLAUDE_CONFIG_DIR]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `ai/claude-code.cjs:36`
