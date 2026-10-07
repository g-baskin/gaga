---
type: concept
title: "AI provider routing"
status: developing
created: 2026-10-06
updated: 2026-10-06
complexity: intermediate
domain: "storyloom"
tags:
  - concept
  - storyloom
related:
  - "[[entities/writeText]]"
  - "[[entities/model-picker-cjs]]"
  - "[[entities/createOpenRouter]]"
  - "[[entities/createChatGpt]]"
  - "[[entities/createClaudeCode]]"
sources: []
---

# AI provider routing

Writing can use own service / OpenRouter / ChatGPT plan / Claude Code ([[entities/settings-writer]]); pictures and voices only own service or OpenRouter (main.cjs:58). [[entities/writeText]] dispatches; [[entities/settings-tier]] feeds the model picker; pinned models override auto-pick.

## Entities

- [[entities/writeText]]
- [[entities/model-picker-cjs]]
- [[entities/createOpenRouter]]
- [[entities/createChatGpt]]
- [[entities/createClaudeCode]]
