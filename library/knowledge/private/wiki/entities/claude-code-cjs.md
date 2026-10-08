---
type: entity
title: "ai/claude-code.cjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "ai/claude-code.cjs"
language: js
depends_on: []
used_by:
  - "[[entities/main-cjs]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - module
related:
  - "[[concepts/ai-provider-routing]]"
  - "[[entities/settings-claudePath]]"
sources:
  - ai/claude-code.cjs
---

# ai/claude-code.cjs

**Runs the locally installed `claude -p` CLI as a text-only writer.**

## Overview

Never reads Claude's login; runs the official program with tools, settings, MCP and slash commands disabled in an empty temp folder (ai/claude-code.cjs). Factory: [[entities/createClaudeCode]].

## Connections

- **depends_on:** —
- **used_by:** [[entities/main-cjs]]
- **related:** [[concepts/ai-provider-routing]], [[entities/settings-claudePath]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `ai/claude-code.cjs`
