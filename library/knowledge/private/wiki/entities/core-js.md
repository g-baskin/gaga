---
type: entity
title: "renderer/core.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "renderer/core.js"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/preload-cjs]]"]
tags: [entity, module]
sources:
  - renderer/core.js
---

# renderer/core.js

`h` and `svg` create DOM nodes; `icon` builds decorative SVGs. `withBusy` disables a button, updates aria-busy/label and restores it after a task. `logError` sends page errors to `api.logError` and uses warnings for errors already shown to the user. `scrollBehavior` respects reduced motion.

`renderElement`/`renderPage` share rendering with thumbnails and exports. `fitPageText` chooses a fitting display font size without changing the saved page font size; font loading invalidates fit measurements. `BOOK_INK` is shared by convention with storage.cjs.

## Sources

- `renderer/core.js` (symbols cited above; manually inspected, not AST-extracted).
