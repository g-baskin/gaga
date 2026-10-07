---
type: entity
title: "useTestServices"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "main.cjs"
language: js
depends_on:
  - "[[entities/main-cjs]]"
used_by: []
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - test-hook
related:
  - "[[concepts/self-test-harness]]"
sources:
  - main.cjs:158
---

# useTestServices

Self-test-only setter for testUrls; throws outside `--self-test`; resets all cached AI clients (main.cjs:158). Passed to `selftest/index.cjs` run().

## Connections

- **depends_on:** [[entities/main-cjs]]
- **used_by:** —
- **related:** [[concepts/self-test-harness]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:158`
