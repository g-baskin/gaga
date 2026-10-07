---
type: concept
title: "AI provider routing"
status: developing
created: 2026-10-06
updated: 2026-10-07
complexity: intermediate
domain: "storyloom"
tags:
  - concept
  - storyloom
related:
  - "[[concepts/picture-service-routing]]"
  - "[[entities/writeText]]"
  - "[[entities/model-picker-cjs]]"
  - "[[entities/createOpenRouter]]"
  - "[[entities/createChatGpt]]"
  - "[[entities/createClaudeCode]]"
sources: []
---

# AI provider routing

Writing can use own service / OpenRouter / ChatGPT plan / Claude Code ([[entities/settings-writer]]); pictures use own service, OpenRouter, or fal.ai (`ai/fal.cjs`); voices only own service or OpenRouter (`PICTURES` / `VOICES` in main.cjs). The ChatGPT plan can't draw here: OpenAI's Sign in with ChatGPT for other apps doesn't support image generation yet. [[entities/writeText]] dispatches; [[entities/settings-tier]] feeds the model picker; pinned models override auto-pick.

## Entities

- [[entities/writeText]]
- [[entities/model-picker-cjs]]
- [[entities/createOpenRouter]]
- [[entities/createChatGpt]]
- [[entities/createClaudeCode]]

## Changes since 2add52d

Picture routing now has its own page: [[concepts/picture-service-routing]].
