---
type: entity
title: "STORYLOOM_TEST_CHATGPT_AUTH"
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
  - main.cjs:177
---

# STORYLOOM_TEST_CHATGPT_AUTH

testUrls key overriding the ChatGPT auth base and the allowed sign-in URL prefix (main.cjs:177).

## Connections

- **depends_on:** [[entities/useTestServices]]
- **used_by:** —
- **related:** [[concepts/self-test-harness]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:177`
