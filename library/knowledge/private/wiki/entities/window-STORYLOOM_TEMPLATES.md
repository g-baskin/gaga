---
type: entity
title: "window.STORYLOOM_TEMPLATES / STORYLOOM_WORD_LIMITS"
entity_type: exported-symbol
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "renderer/data/templates.js"
language: js
depends_on:
  - "[[entities/data-templates-js]]"
  - "[[entities/manuscript-screen]]"
used_by: []
last_commit_hash: "a5dac04"
tested_by: []
symbol_kind: "object"
is_default_export: false
tags:
  - entity
  - test-hook
related:
  - "[[concepts/self-test-harness]]"
sources:
  - renderer/data/templates.js:2
---

# window.STORYLOOM_TEMPLATES / STORYLOOM_WORD_LIMITS

Renderer globals: templates catalogue (renderer/data/templates.js:2) and word limits shared from Manuscript to Story builder (renderer/screens/manuscript.js:6, read at renderer/screens/story-builder.js:6).

## Connections

- **depends_on:** [[entities/data-templates-js]], [[entities/manuscript-screen]]
- **used_by:** —
- **related:** [[concepts/self-test-harness]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/data/templates.js:2`
