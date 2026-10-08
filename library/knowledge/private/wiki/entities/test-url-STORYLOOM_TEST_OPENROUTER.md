---
type: entity
title: "STORYLOOM_TEST_OPENROUTER"
entity_type: env-var
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "main.cjs"
language: js
depends_on:
  - "[[entities/useTestServices]]"
used_by: []
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - test-hook
related:
  - "[[concepts/self-test-harness]]"
sources:
  - main.cjs
---

# STORYLOOM_TEST_OPENROUTER

Not a process env var: a key in the in-memory `testUrls` map set by [[entities/useTestServices]]; overrides the OpenRouter base URL only in self-test (main.cjs).

## Connections

- **depends_on:** [[entities/useTestServices]]
- **used_by:** —
- **related:** [[concepts/self-test-harness]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`
