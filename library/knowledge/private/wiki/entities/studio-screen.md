---
type: entity
title: "renderer/screens/studio.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "renderer/screens/studio.js"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/app-js]]"]
tags: [entity, module]
sources:
  - renderer/screens/studio.js
---

# renderer/screens/studio.js

`startRecording` captures microphone audio as WebM; `recordInto` saves it through `api.saveRecording`. `narrationPanel` supports imported, recorded and AI-generated page narration; `musicPanel` configures background audio and `interactivePanel` adds sound buttons. `openReadAlong` plays pages with narration/music; `stopEverything` runs on leaving Studio to stop owned audio resources.

## Sources

- `renderer/screens/studio.js` (symbols cited above; manually inspected, not AST-extracted).
