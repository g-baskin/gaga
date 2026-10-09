---
type: entity
title: "createAiServices"
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

# createAiServices

```js
function createAiServices({ app, safeStorage, shell, selfTest, testUrls, testUrl, settings, getStore })
```

Creates lazy provider clients plus writing, image, speech, scene-planning and recommendation operations; accepts getStore for the store created later.

Evidence: `main/ai-services.cjs` / `createAiServices`. Factory-scoped helpers are not necessarily module exports. See [[entities/main-ai-services-cjs]].
