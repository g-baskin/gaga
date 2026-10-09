---
type: entity
title: "renderer/screens/manuscript.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "renderer/screens/manuscript.js"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/app-js]]", "[[entities/core-js]]"]
tags: [entity, module]
sources:
  - renderer/screens/manuscript.js
---

# renderer/screens/manuscript.js

`renderBlock`, `collectRuns` and `parseEditor` translate structured blocks to/from the editing DOM rather than storing HTML. `wireEditor` handles pasted/dropped plain text; `wordsAllowed` enforces chapter limits. `writeWithAi` calls `api.generateChapter`; `layOut` saves page layout and applies a chosen theme. `leave` flushes screen editing state.

## Sources

- `renderer/screens/manuscript.js` (symbols cited above; manually inspected, not AST-extracted).
