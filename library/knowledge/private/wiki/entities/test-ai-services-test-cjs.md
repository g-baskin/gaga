---
type: entity
title: "test/ai-services.test.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "test/ai-services.test.cjs"
language: js
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
depends_on: ["[[entities/chatgpt-cjs]]", "[[entities/openrouter-cjs]]", "[[entities/claude-code-cjs]]", "[[entities/fal-cjs]]", "[[entities/selftest-mock-services-cjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - test/ai-services.test.cjs
---

# test/ai-services.test.cjs

## Verified source surface (2026-10-08)

This is a test specification, not a recorded passing run. Literal test declarations in `test/ai-services.test.cjs` cover:

- ChatGPT: first sign-in registers Storyloom, verifies identity, and uses the plan
- ChatGPT: returning sign-in reuses the registration; sign-out revokes and forgets tokens
- ChatGPT: expired access tokens refresh once, with rotation
- ChatGPT: an unusable refresh token asks the user to sign in again
- ChatGPT: declining plan use, denying sign-in, and usage limits are explained
- ChatGPT: identity tokens with the wrong audience, nonce, issuer, or signature are rejected
- OpenRouter: picks models from live lists, sends fallbacks, and uses quality scores with a key
- Claude Code: runs the installed program with every tool and setting switched off
- fal.ai: picks a model from the live list, sends only settings the model accepts, and saves the picture
- fal.ai: no key, wrong key, empty balance, and pictures from other hosts are refused with clear messages
- OpenRouter: with reference pictures, picks a model that accepts them and sends them with the page shape
- fal.ai: with reference pictures, uploads them for an hour and uses the model’s edit form

Named function declarations in `test/ai-services.test.cjs`: `chatGptHarness`. This lexical list includes private helpers; it is not an export list.

Local dependency evidence (literal import/require statements in `test/ai-services.test.cjs`):

- `../ai/chatgpt.cjs` → [[entities/chatgpt-cjs]].
- `../ai/openrouter.cjs` → [[entities/openrouter-cjs]].
- `../ai/claude-code.cjs` → [[entities/claude-code-cjs]].
- `../ai/fal.cjs` → [[entities/fal-cjs]].
- `../selftest/mock-services.cjs` → [[entities/selftest-mock-services-cjs]].

Execution was not performed during this documentation refresh.
