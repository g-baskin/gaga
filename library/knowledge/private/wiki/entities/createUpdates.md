---
type: entity
title: "createUpdates"
entity_type: function
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "main/updates.cjs"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/main-updates-cjs]]"]
tags: [entity, function]
sources:
  - main/updates.cjs
---

# createUpdates

```js
function createUpdates({ app, selfTest, testUrls, readSettings, getWindow })
```

Creates the observable update state machine and delegates cryptographic/download/install helpers to updater.cjs.

Evidence: `main/updates.cjs` / `createUpdates`. Factory-scoped helpers are not necessarily module exports. See [[entities/main-updates-cjs]].
