---
type: entity
title: "selftest/index.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "selftest/index.cjs"
language: js
last_commit_hash: "4dd7ad007e3bea5cf94ea07abb16f62691a99251"
depends_on: ["[[entities/selftest-mock-ai-cjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - selftest/index.cjs
---

# selftest/index.cjs

## Verified source surface (2026-10-08)

Scope documented in the source header of `selftest/index.cjs`:

> Self-test runner. Drives the real interface with real mouse/keyboard events, one module per screen. npm run self-test                      → every module in FULL_ORDER (missing modules fail) npm run self-test -- --only=home       → just those modules (screenshots in verification/<run-id>/) Screenshots are local evidence only: verification/ is gitignored. ... --load=screens/home.js             → inject a screen script (and matching .css) that index.html doesn't list yet

Named check assignments: `runner`, `navigation`. These are assertions in code, not evidence of execution.

Named function declarations in `selftest/index.cjs`: `run`. This lexical list includes private helpers; it is not an export list.

Local dependency evidence (literal import/require statements in `selftest/index.cjs`):

- `./mock-ai.cjs` → [[entities/selftest-mock-ai-cjs]].

Execution was not performed during this documentation refresh.
