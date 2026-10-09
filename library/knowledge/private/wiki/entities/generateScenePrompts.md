---
type: entity
title: "generateScenePrompts"
entity_type: function
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "main/ai-services.cjs"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/main-ai-services-cjs]]"]
tags: [entity, function]
sources:
  - main/ai-services.cjs
---

# generateScenePrompts

```js
async function generateScenePrompts(input = {})
```

Plans up to 60 pages with the selected writer, limits cast to eight characters, normalizes indices and falls back to page words/book title when a scene is missing.

Evidence: `main/ai-services.cjs` / `generateScenePrompts`. Factory-scoped helpers are not necessarily module exports. See [[entities/main-ai-services-cjs]].
