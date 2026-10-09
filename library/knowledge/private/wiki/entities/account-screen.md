---
type: entity
title: "renderer/screens/account.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "renderer/screens/account.js"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/app-js]]", "[[entities/main-settings-cjs]]"]
tags: [entity, module]
sources:
  - renderer/screens/account.js
---

# renderer/screens/account.js

`profileSection` saves the local author profile. `saveAi` persists only the edited settings patch; `drawAi` loads provider status/models/recommendations in the background. Panels separate writing, pictures and voice services. `updatesSection` shares update controls with the app shell; data/log folder actions and the privacy/source links call named preload APIs. This is a local profile screen, not Storyloom cloud login.

## Sources

- `renderer/screens/account.js` (symbols cited above; manually inspected, not AST-extracted).
