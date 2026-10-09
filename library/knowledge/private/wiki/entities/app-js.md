---
type: entity
title: "renderer/app.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "renderer/app.js"
language: js
last_commit_hash: "4dd7ad007e3bea5cf94ea07abb16f62691a99251"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/core-js]]", "[[entities/editor-js]]"]
tags: [entity, module]
sources:
  - renderer/app.js
---

# renderer/app.js

`registerScreen` records app/book screen definitions; `navigate` opens a book when needed and invokes leave hooks. `saveNow` serializes saves and `scheduleSave` debounces them. `loadFailed` provides retry UI instead of treating load errors as empty libraries.

`startUpdates`, `setUpdateView` and `updateControls` share state between the sidebar and Account. Startup waits for DOMContentLoaded and installs Designer listeners after deferred scripts. `picturesReady`/`aiPictureNote` distinguish picture-service credentials from writing subscriptions.

## Sources

- `renderer/app.js` (symbols cited above; manually inspected, not AST-extracted).
