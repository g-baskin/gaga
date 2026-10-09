---
type: entity
title: "readReferences"
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

# readReferences

```js
async function readReferences(bookId, names)
```

Loads at most four distinct plain asset names through store.mediaPath, skips missing/oversized images, and identifies the actual image type with sniffImage.

Evidence: `main/ai-services.cjs` / `readReferences`. Factory-scoped helpers are not necessarily module exports. See [[entities/main-ai-services-cjs]].
