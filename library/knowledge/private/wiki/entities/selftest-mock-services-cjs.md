---
type: entity
title: "selftest/mock-services.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "selftest/mock-services.cjs"
language: js
last_commit_hash: "7d459e2d1140ffc4d9f2ab44379827342ea99b24"
depends_on: ["[[entities/selftest-mock-ai-cjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - selftest/mock-services.cjs
---

# selftest/mock-services.cjs

## Verified source surface (2026-10-08)

Scope documented in the source header of `selftest/mock-services.cjs`:

> Local stand-ins for OpenRouter, ChatGPT sign-in + Responses API, and the Claude Code program, so every subscription path runs end to end in the self-test and unit tests without real accounts. ---------------- OpenRouter ----------------


Named function declarations in `selftest/mock-services.cjs`: `startOpenRouter`, `startChatGpt`, `listen`, `startFal`, `makeFakeClaude`. This lexical list includes private helpers; it is not an export list.

Local dependency evidence (literal import/require statements in `selftest/mock-services.cjs`):

- `./mock-ai.cjs` → [[entities/selftest-mock-ai-cjs]].

Execution was not performed during this documentation refresh.
