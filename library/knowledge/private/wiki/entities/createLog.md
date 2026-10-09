---
type: entity
title: "createLog"
entity_type: function
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "log.cjs"
language: js
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/log-cjs]]"]
tags: [entity, function]
sources:
  - log.cjs
---

# createLog

```js
function createLog(dir, { maxBytes = MAX_BYTES, now = () => new Date() } = {})
```

Creates local rotating synchronous logging with best-effort failure handling; defaults and entry limits live in MAX_BYTES and write.

Evidence: `log.cjs` / `createLog`. Factory-scoped helpers are not necessarily module exports. See [[entities/log-cjs]].
