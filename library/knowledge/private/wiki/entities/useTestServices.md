---
type: entity
title: "useTestServices"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "main.cjs"
language: js
depends_on:
  - "[[entities/main-cjs]]"
used_by: []
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
tags:
  - entity
  - test-hook
related:
  - "[[concepts/self-test-harness]]"
sources:
  - main/updates.cjs
  - main/ai-services.cjs
  - main.cjs
---

# useTestServices

Self-test-only setter for testUrls; throws outside `--self-test`; calls `ai.reset()` and `updates.reset()` (`main.cjs` (`useTestServices`)). Passed to `selftest/index.cjs` run().

## Connections

- **depends_on:** [[entities/main-cjs]]
- **used_by:** —
- **related:** [[concepts/self-test-harness]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`

## Ownership evidence

Reset implementations: `main/ai-services.cjs` (`reset`) and `main/updates.cjs` (`reset`).
