---
type: entity
title: "STORYLOOM_TEST_CHATGPT_API"
entity_type: env-var
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "main.cjs"
language: js
depends_on:
  - "[[entities/useTestServices]]"
used_by: []
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
tags:
  - entity
  - test-hook
related:
  - "[[concepts/self-test-harness]]"
sources:
  - main/ai-services.cjs
  - main.cjs
---

# STORYLOOM_TEST_CHATGPT_API

testUrls key overriding the ChatGPT API base (`main/ai-services.cjs`).

## Connections

- **depends_on:** [[entities/useTestServices]]
- **used_by:** —
- **related:** [[concepts/self-test-harness]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`

## Ownership evidence

The guarded map/setter remains in `main.cjs` (`testUrls`, `testUrl`, `useTestServices`). AI client overrides: `main/ai-services.cjs` (`getOpenRouter`, `getFal`, `getChatGpt`).
