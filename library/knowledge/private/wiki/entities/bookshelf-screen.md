---
type: entity
title: "renderer/screens/bookshelf.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "renderer/screens/bookshelf.js"
language: js
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/app-js]]"]
tags: [entity, module]
sources:
  - renderer/screens/bookshelf.js
---

# renderer/screens/bookshelf.js

`load` fetches books, shelves and profile. `visibleBooks` applies shelf/search/order choices; `persistOrder` merges the visible arrangement into the full saved book order. `enableDrag` and `moveBook` provide pointer and keyboard ordering. `trashBook` honors a cancelled delete response; shelf actions persist through `api.saveShelves`.

## Sources

- `renderer/screens/bookshelf.js` (symbols cited above; manually inspected, not AST-extracted).
