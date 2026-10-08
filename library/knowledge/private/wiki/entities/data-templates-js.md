---
type: entity
title: "renderer/data/templates.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "renderer/data/templates.js"
language: js
depends_on: []
used_by:
  - "[[entities/templates-screen]]"
  - "[[entities/manuscript-screen]]"
  - "[[entities/home-screen]]"
  - "[[entities/story-builder-screen]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - module
related:
  - "[[concepts/screen-registry]]"
sources:
  - renderer/data/templates.js
---

# renderer/data/templates.js

**Built-in page themes and starter books (`window.STORYLOOM_TEMPLATES`).**

## Overview

Exposes `{ themes, starters, categories, applyTheme, bookFromTemplate }` on `window.STORYLOOM_TEMPLATES` (renderer/data/templates.js). Decoration positions are authored for a 612×612 pt page and scaled on apply (renderer/data/templates.js).

## Connections

- **depends_on:** —
- **used_by:** [[entities/templates-screen]], [[entities/manuscript-screen]], [[entities/home-screen]], [[entities/story-builder-screen]]
- **related:** [[concepts/screen-registry]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/data/templates.js`
