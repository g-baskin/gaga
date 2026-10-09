---
type: entity
title: "scripts/check-package.mjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "scripts/check-package.mjs"
language: js
last_commit_hash: "41aa0bcf45a02b25706807f3ee990db79185dd96"
depends_on: ["[[entities/package-mjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - scripts/check-package.mjs
---

# scripts/check-package.mjs

## Verified source surface (2026-10-08)

Source-header scope (`scripts/check-package.mjs`):

> Checks a built Storyloom.app has every file it loads, so a module missing from package.mjs's keep list fails here instead of crashing the packaged app (npm start would still work, because it reads the source folder). node scripts/check-package.mjs releases/Storyloom-darwin-arm64/Storyloom.app Follows every local require() from main.cjs and preload.cjs (the self-test is never shipped, so it's skipped), and every script and stylesheet that renderer/index.html loads.


Local dependency evidence (literal import/require statements in `scripts/check-package.mjs`):

- `../package.mjs` → [[entities/package-mjs]].
