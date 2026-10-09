---
type: entity
title: "scripts/fetch-fonts.mjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "scripts/fetch-fonts.mjs"
language: js
last_commit_hash: "7d459e2d1140ffc4d9f2ab44379827342ea99b24"
depends_on: []
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - scripts/fetch-fonts.mjs
---

# scripts/fetch-fonts.mjs

## Verified source surface (2026-10-08)

Source-header scope (`scripts/fetch-fonts.mjs`):

> Downloads Storyloom's bundled fonts from Fontsource into renderer/fonts/, with their license files, and writes renderer/fonts/fonts.json (exact versions and SHA-256 of every file), plus the two files the app loads: renderer/fonts/fonts.css (@font-face rules) and renderer/fonts/fonts-list.js (the font list).  node scripts/fetch-fonts.mjs          → download (only when the font list changes) node scripts/fetch-fonts.mjs --check  → verify the committed files against fonts.json (no network)


Named function declarations in `scripts/fetch-fonts.mjs`: `generated`, `get`, `download`, `check`. This lexical list includes private helpers; it is not an export list.
