---
type: entity
title: "STORYLOOM_TEST_UPDATE_KEY"
entity_type: env-var
status: developing
created: 2026-10-07
updated: 2026-10-07
path: "main.cjs"
language: js
depends_on:
  - "[[entities/useTestServices]]"
used_by:
  - "[[entities/createUpdater]]"
last_commit_hash: "eb83d47"
tested_by: []
key: "STORYLOOM_TEST_UPDATE_KEY"
tags:
  - entity
  - env-var
related:
  - "[[concepts/self-test-harness]]"
sources:
  - main.cjs:184
---

# STORYLOOM_TEST_UPDATE_KEY

**Self-test-only service address (not a real environment variable).**

Key in `testUrls`, set only through [[entities/useTestServices]], which throws outside `--self-test` (main.cjs:184-186); read through `testUrl()`/`testUrls`. Test-only public key replacing [[entities/TRUSTED_KEYS]] when the fake update server is in use (main.cjs:223). Set alongside `STORYLOOM_TEST_UPDATES` by selftest/updates.cjs:32.

Setting test services also resets the update client, pending/ready update, and update state (main.cjs:187-190).

## Connections

- **depends_on:** [[entities/useTestServices]]
- **used_by:** [[entities/createUpdater]]
- **related:** [[concepts/self-test-harness]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `main.cjs:184`
