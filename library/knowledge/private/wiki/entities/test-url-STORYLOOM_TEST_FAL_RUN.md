---
type: entity
title: "STORYLOOM_TEST_FAL_RUN"
entity_type: env-var
status: developing
created: 2026-10-07
updated: 2026-10-08
path: "main.cjs"
language: js
depends_on:
  - "[[entities/useTestServices]]"
used_by:
  - "[[entities/fal-cjs]]"
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
key: "STORYLOOM_TEST_FAL_RUN"
tags:
  - entity
  - env-var
related:
  - "[[concepts/self-test-harness]]"
sources:
  - main/ai-services.cjs
  - main.cjs
---

# STORYLOOM_TEST_FAL_RUN

**Self-test-only service address (not a real environment variable).**

Key in `testUrls`, set only through [[entities/useTestServices]], which throws outside `--self-test` (`main.cjs` (`useTestServices`)); read through `testUrl()`/`testUrls`. Fake fal.ai run base (`runBase`) for drawing requests (`main/ai-services.cjs`); also enables `mediaHostOk = 127.0.0.1` so the fake can serve pictures (`main/ai-services.cjs`). Set by selftest/ai-services.cjs.

Setting test services calls both resets (`main.cjs` (`useTestServices`)); the update reset clears the client, pending/ready update and state (`main/updates.cjs` (`reset`)).

## Connections

- **depends_on:** [[entities/useTestServices]]
- **used_by:** [[entities/fal-cjs]]
- **related:** [[concepts/self-test-harness]]

## History

- Last touched by commit `ded9f37` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `main.cjs`

## Ownership evidence

The guarded map/setter remains in `main.cjs` (`testUrls`, `testUrl`, `useTestServices`). AI client overrides: `main/ai-services.cjs` (`getOpenRouter`, `getFal`, `getChatGpt`).
