---
type: entity
title: "ai/chatgpt.cjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "ai/chatgpt.cjs"
language: js
depends_on: []
used_by:
  - "[[entities/main-ai-services-cjs]]"
last_commit_hash: "7d459e2d1140ffc4d9f2ab44379827342ea99b24"
tested_by: []
tags:
  - entity
  - module
related:
  - "[[concepts/ai-provider-routing]]"
  - "[[concepts/secret-storage]]"
sources:
  - main/ai-services.cjs
  - ai/chatgpt.cjs
---

# ai/chatgpt.cjs

**"Sign in with ChatGPT" OAuth (PKCE, loopback callback) and Responses-API client.**

## Overview

Header documents the flow: dynamic client registration, PKCE+state+nonce, loopback callback on 127.0.0.1, ID-token verification, `chatgpt.tokens.use.direct` scope, Responses API with `store:false` (ai/chatgpt.cjs). Factory: [[entities/createChatGpt]].

## Connections

- **depends_on:** —
- **used_by:** [[entities/main-ai-services-cjs]]
- **related:** [[concepts/ai-provider-routing]], [[concepts/secret-storage]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `ai/chatgpt.cjs`

## Verified source surface (2026-10-08)


Named function declarations in `ai/chatgpt.cjs`: `createChatGpt`, `discovery`, `verifyIdToken`, `tokenRequest`, `listen`, `signIn`, `cancelSignIn`, `markWelcomed`, `refresh`, `accessToken`, `status`, `signOut`, `models`, `planError`, `respond`. This lexical list includes private helpers; it is not an export list.

## Current responsibility boundary

The pure provider implementation exposes signIn/cancelSignIn/markWelcomed/status/signOut/models/respond. Encrypted disk persistence is injected by main/ai-services.cjs rather than implemented in this provider (`ai/chatgpt.cjs` / `createChatGpt`; `main/ai-services.cjs` / `getChatGpt`).

## Ownership evidence

AI client imports and factory calls live in `main/ai-services.cjs` imports, `main/ai-services.cjs` (`getOpenRouter`, `getFal`, `getChatGpt`, `getClaudeCode`); main composes the factory at `main.cjs` (`createAiServices` composition).
