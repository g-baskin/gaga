---
type: entity
title: "selftest/designer.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "selftest/designer.cjs"
language: js
last_commit_hash: "6a7c05c7ff9ea19d4f429f77bdfd0ca2c2dd2cf7"
depends_on: ["[[entities/selftest-mock-ai-cjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - selftest/designer.cjs
---

# selftest/designer.cjs

## Verified source surface (2026-10-08)

Scope documented in the source header of `selftest/designer.cjs`:

> Designer: move, resize, rotate, undo/redo, drop a shape, frames, crop rendering, drawer extras, PDF export. A test-only Pictures drawer button proves the extension hook renders.

Named check assignments: `moved`, `resized`, `rotated`, `undo`, `redo`, `dropped`, `drawerExtra`, `cropRendered`, `cropButton`. These are assertions in code, not evidence of execution.

Local dependency evidence (literal import/require statements in `selftest/designer.cjs`):

- `./mock-ai.cjs` → [[entities/selftest-mock-ai-cjs]].

Execution was not performed during this documentation refresh.
