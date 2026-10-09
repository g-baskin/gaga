---
type: entity
title: "createExports"
entity_type: function
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "main/export.cjs"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/main-export-cjs]]"]
tags: [entity, function]
sources:
  - main/export.cjs
---

# createExports

```js
function createExports({ app, dialog, selfTest, getWindow, getStore, rendererDir })
```

Creates the dialog/export boundary with deferred getWindow/getStore access, font collection and last-export tracking.

Evidence: `main/export.cjs` / `createExports`. Factory-scoped helpers are not necessarily module exports. See [[entities/main-export-cjs]].
