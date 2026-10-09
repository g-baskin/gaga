---
type: entity
title: "renderer/screens/story-builder.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "renderer/screens/story-builder.js"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/app-js]]"]
tags: [entity, module]
sources:
  - renderer/screens/story-builder.js
---

# renderer/screens/story-builder.js

`builder` supplies the book plan; `validate` checks inputs before `writeWithAi` calls `api.generateStory`. `editCharacter` previews unsaved character edits and restores saved characters when the dialog closes. `saveToLibrary`/`openLibrary` use the character IPC APIs. `schedulePreview` batches cover-preview redraws.

## Sources

- `renderer/screens/story-builder.js` (symbols cited above; manually inspected, not AST-extracted).
