---
type: entity
title: "--self-test"
entity_type: feature-flag
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
flag_kind: "cli-arg"
default_value: "off"
tags:
  - entity
  - test-hook
related:
  - "[[concepts/self-test-harness]]"
sources:
  - main.cjs
---

# --self-test

CLI flag (main.cjs). Uses a temp `mkdtemp` userData, fake media device, mock keychain; fixed save paths; dialogs bypassed; runs `selftest/index.cjs` after load and exits 0/1. Run with `npm run self-test`.

## Connections

- **depends_on:** [[entities/main-cjs]]
- **used_by:** —
- **related:** [[concepts/self-test-harness]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`
