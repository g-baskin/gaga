---
type: entity
title: "plainFsError"
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

# plainFsError

```js
function plainFsError(error)
```

Maps recognized disk error codes to plain user-facing messages; passes other errors through.

Evidence: `storage.cjs` / `plainFsError`. Factory-scoped helpers are not necessarily module exports. See [[entities/storage-cjs]].
