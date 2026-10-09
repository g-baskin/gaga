---
type: entity
title: "ai/claude-code.cjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "ai/claude-code.cjs"
language: js
depends_on: []
used_by:
  - "[[entities/main-ai-services-cjs]]"
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
tested_by: []
tags:
  - entity
  - module
related:
  - "[[concepts/ai-provider-routing]]"
  - "[[entities/settings-claudePath]]"
sources:
  - main/ai-services.cjs
  - ai/claude-code.cjs
---

# ai/claude-code.cjs

**Runs the locally installed `claude -p` CLI as a text-only writer.**

## Overview

Never reads Claude's login; runs the official program with tools, settings, MCP and slash commands disabled in an empty temp folder (ai/claude-code.cjs). Factory: [[entities/createClaudeCode]].

## Connections

- **depends_on:** —
- **used_by:** [[entities/main-ai-services-cjs]]
- **related:** [[concepts/ai-provider-routing]], [[entities/settings-claudePath]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `ai/claude-code.cjs`

## Verified source surface (2026-10-08)


Named function declarations in `ai/claude-code.cjs`: `isExecutable`, `candidates`, `createClaudeCode`, `locate`, `environment`, `run`, `status`, `ask`. This lexical list includes private helpers; it is not an export list.

## Current responsibility boundary

`createClaudeCode` locates a local executable, builds its execution environment, checks status and runs a writing request through ask. Main owns the 60-second status cache, not this module (`ai/claude-code.cjs` / `createClaudeCode`; `main/ai-services.cjs` / `claudeStatus`).

## Ownership evidence

AI client imports and factory calls live in `main/ai-services.cjs` imports, `main/ai-services.cjs` (`getOpenRouter`, `getFal`, `getChatGpt`, `getClaudeCode`); main composes the factory at `main.cjs` (`createAiServices` composition).
