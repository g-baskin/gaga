---
type: entity
title: "STORYLOOM_TEST_FAL_RUN"
entity_type: env-var
status: developing
created: 2026-10-07
updated: 2026-10-07
path: "main.cjs"
language: js
depends_on:
  - "[[entities/useTestServices]]"
used_by:
  - "[[entities/fal-cjs]]"
last_commit_hash: "ded9f37"
tested_by: []
key: "STORYLOOM_TEST_FAL_RUN"
tags:
  - entity
  - env-var
related:
  - "[[concepts/self-test-harness]]"
sources:
  - main.cjs:184
---

# STORYLOOM_TEST_FAL_RUN

**Self-test-only service address (not a real environment variable).**

Key in `testUrls`, set only through [[entities/useTestServices]], which throws outside `--self-test` (main.cjs:184-186); read through `testUrl()`/`testUrls`. Fake fal.ai run base (`runBase`) for drawing requests (main.cjs:293); also enables `mediaHostOk = 127.0.0.1` so the fake can serve pictures (main.cjs:297). Set by selftest/ai-services.cjs:31.

Setting test services also resets the update client, pending/ready update, and update state (main.cjs:187-190).

## Connections

- **depends_on:** [[entities/useTestServices]]
- **used_by:** [[entities/fal-cjs]]
- **related:** [[concepts/self-test-harness]]

## History

- Last touched by commit `ded9f37` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `main.cjs:184`
