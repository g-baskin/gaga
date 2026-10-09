---
type: entity
title: "eslint.config.mjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "eslint.config.mjs"
language: js
last_commit_hash: "7d459e2d1140ffc4d9f2ab44379827342ea99b24"
depends_on: []
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - eslint.config.mjs
---

# eslint.config.mjs

## Verified source surface (2026-10-08)

Source-header scope (`eslint.config.mjs`):

> ESLint config for Storyloom. Run with npm run lint. Three kinds of code live here: - Node CommonJS (.cjs): the main process, preload, storage, AI clients, tests, self-test. - Node ES modules (.mjs): build and release scripts. - Renderer scripts (renderer/**/*.js): plain browser scripts loaded in order by index.html. They share top-level names (h, api, registerScreen, ...) across files, so each file is told


Named function declarations in `eslint.config.mjs`: `rendererScripts`, `sharedNames`. This lexical list includes private helpers; it is not an export list.
