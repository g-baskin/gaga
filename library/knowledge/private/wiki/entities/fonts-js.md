---
type: entity
title: "renderer/fonts.js"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "renderer/fonts.js"
language: js
last_commit_hash: "dec43bdfdf6e578945857dc98c7e782dee8ee022"
depends_on: []
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - renderer/fonts.js
---

# renderer/fonts.js

`loadFonts` waits for requested faces; `bookFontKeys` collects fonts used by a book and `fontOptions` builds grouped choices. `FONTS`, `FONT_LABEL`, `FONT_GROUPS` and `FONT_FILES` combine Mac font choices with the generated bundled manifest. The generated list/CSS are owned by scripts/fetch-fonts.mjs, not hand-edited.

## Sources

- `renderer/fonts.js` (symbols cited above; manually inspected, not AST-extracted).
