---
type: entity
title: "createSettings"
entity_type: function
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "main/settings.cjs"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/main-settings-cjs]]"]
tags: [entity, function]
sources:
  - main/settings.cjs
---

# createSettings

```js
function createSettings({ app, safeStorage, reportDamaged, onClaudePathChanged = () => {} })
```

Creates the queued settings/secret boundary; returns read, save, public projection, validation and private-write helpers.

Evidence: `main/settings.cjs` / `createSettings`. Factory-scoped helpers are not necessarily module exports. See [[entities/main-settings-cjs]].
