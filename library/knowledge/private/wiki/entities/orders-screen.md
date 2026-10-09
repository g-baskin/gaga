---
type: entity
title: "renderer/screens/orders.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "renderer/screens/orders.js"
language: js
last_commit_hash: "eb7001a858caffea046c3bcff873b59438da9b52"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/app-js]]"]
tags: [entity, module]
sources:
  - renderer/screens/orders.js
---

# renderer/screens/orders.js

`registerScreen` exposes an app-scoped Orders screen. It explicitly says print orders are unavailable; `pickBook` loads a book to export a print-ready PDF instead. No printing partner or payment integration is implemented here.

## Sources

- `renderer/screens/orders.js` (symbols cited above; manually inspected, not AST-extracted).
