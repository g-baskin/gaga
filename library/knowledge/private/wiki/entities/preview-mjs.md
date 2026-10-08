---
type: entity
title: "scripts/preview.mjs"
entity_type: script
status: developing
created: 2026-10-07
updated: 2026-10-07
path: "scripts/preview.mjs"
language: js
depends_on:
  - "[[entities/preview-boot-js]]"
used_by: []
last_commit_hash: "3312b4e"
tested_by: []
tags:
  - entity
  - script
related:
  - "[[entities/theme-css]]"
sources:
  - scripts/preview.mjs
---

# scripts/preview.mjs

**npm run preview: serves renderer/ in a browser on 127.0.0.1 for design review.**

## Overview

Plain `http` server bound to `127.0.0.1:${PORT||4173}` (scripts/preview.mjs). `fileFor()` decodes the path and rejects anything resolving outside `renderer/`. For `index.html` only, it injects `<script src="preview-boot.js">` before `core.js`, so Electron's own index.html is untouched. `Cache-Control: no-store`.

Added by Kelly's commit `99aea2b` ("browser preview"); script `preview` in package.json.

## Connections

- **depends_on:** [[entities/preview-boot-js]]
- **used_by:** —
- **related:** [[entities/theme-css]]

## History

- Last touched by commit `3312b4e` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `scripts/preview.mjs`
