---
type: entity
title: "renderer/screens/home.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "renderer/screens/home.js"
language: js
last_commit_hash: "eb7001a858caffea046c3bcff873b59438da9b52"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/app-js]]", "[[entities/core-js]]"]
tags: [entity, module]
sources:
  - renderer/screens/home.js
---

# renderer/screens/home.js

`splitStory` converts imported text to chapter blocks; `importStory` uses `api.importStoryText`, the local profile and `api.createBook`. `render` distinguishes a failed library read from an empty library. `hero`, `recent` and `templates` provide entry points, and `registerScreen` registers the app-scoped home screen.

## Sources

- `renderer/screens/home.js` (symbols cited above; manually inspected, not AST-extracted).
