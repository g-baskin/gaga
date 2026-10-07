---
type: entity
title: "ai/chatgpt.cjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "ai/chatgpt.cjs"
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
  - "[[concepts/secret-storage]]"
sources:
  - ai/chatgpt.cjs
---

# ai/chatgpt.cjs

**"Sign in with ChatGPT" OAuth (PKCE, loopback callback) and Responses-API client.**

## Overview

Header documents the flow: dynamic client registration, PKCE+state+nonce, loopback callback on 127.0.0.1, ID-token verification, `chatgpt.tokens.use.direct` scope, Responses API with `store:false` (ai/chatgpt.cjs:2–ai/chatgpt.cjs:8). Factory: [[entities/createChatGpt]].

## Connections

- **depends_on:** —
- **used_by:** [[entities/main-cjs]]
- **related:** [[concepts/ai-provider-routing]], [[concepts/secret-storage]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `ai/chatgpt.cjs`
