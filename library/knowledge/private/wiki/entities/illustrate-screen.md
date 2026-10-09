---
type: entity
title: "renderer/screens/illustrate.js"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "renderer/screens/illustrate.js"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/designer-drawers]]", "[[entities/designer-inspector]]", "[[entities/main-ai-services-cjs]]"]
tags: [entity, module]
sources:
  - renderer/screens/illustrate.js
---

# renderer/screens/illustrate.js

`castOf` selects character portraits; `targets` selects eligible picture-layout pages. `openIllustrateDialog` calls `api.scenePrompts` once then `api.generateImage` sequentially, passing reference filenames and aspect. It re-finds pages by id when results return and stops on service-wide failures. `redrawPage` uses the saved imagePrompt or page words.

This is a Designer extension, not a separately registered navigation screen: it appends hooks to `picturesDrawerExtras` and `pagePictureExtras`.

## Sources

- `renderer/screens/illustrate.js` (symbols cited above; manually inspected, not AST-extracted).
