---
type: entity
title: "readJsonFile"
entity_type: function
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "storage.cjs"
language: js
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/storage-cjs]]"]
tags: [entity, function]
sources:
  - storage.cjs
---

# readJsonFile

```js
async function readJsonFile(file, fallback, onDamaged)
```

Returns fallback for a missing file, throws on other read failures, and moves malformed JSON to a damaged backup before notifying onDamaged. See source for non-object JSON handling.

Evidence: `storage.cjs` / `readJsonFile`. Factory-scoped helpers are not necessarily module exports. See [[entities/storage-cjs]].
