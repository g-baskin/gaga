---
type: entity
title: "CLAUDE_CONFIG_DIR (and env allow-list)"
entity_type: env-var
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "ai/claude-code.cjs"
language: js
depends_on:
  - "[[entities/claude-code-cjs]]"
used_by: []
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - test-hook
related:
  - "[[concepts/self-test-harness]]"
sources:
  - ai/claude-code.cjs:49
---

# CLAUDE_CONFIG_DIR (and env allow-list)

The only env vars passed to the `claude` child are HOME, USER, LOGNAME, LANG, LC_ALL, TMPDIR, CLAUDE_CONFIG_DIR; PATH is rebuilt (ai/claude-code.cjs:49). Shell API keys are deliberately not inherited.

## Connections

- **depends_on:** [[entities/claude-code-cjs]]
- **used_by:** —
- **related:** [[concepts/self-test-harness]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `ai/claude-code.cjs:49`
