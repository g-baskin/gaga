---
type: entity
title: "renderer/screens/templates.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "renderer/screens/templates.js"
language: js
last_commit_hash: "eb7001a858caffea046c3bcff873b59438da9b52"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/app-js]]", "[[entities/fonts-js]]", "[[entities/data-templates-js]]"]
tags: [entity, module]
sources:
  - renderer/screens/templates.js
---

# renderer/screens/templates.js

`render` filters the template catalogue; `openPreview` presents page-flipping previews and waits for real fonts to redraw them. `chooseBook` applies a theme to an existing non-coloring book; starter creation uses `api.createBook` with the local profile author. `fontSection` renders grouped font samples.

## Sources

- `renderer/screens/templates.js` (symbols cited above; manually inspected, not AST-extracted).
