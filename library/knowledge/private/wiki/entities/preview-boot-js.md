---
type: entity
title: "renderer/preview-boot.js"
entity_type: module
status: developing
created: 2026-10-07
updated: 2026-10-08
path: "renderer/preview-boot.js"
language: js
depends_on: []
used_by:
  - "[[entities/preview-mjs]]"
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
tested_by: []
tags:
  - entity
  - module
related:
  - "[[entities/window-storyloom-api]]"
sources:
  - renderer/preview-boot.js
---

# renderer/preview-boot.js

**Browser stand-in for window.storyloom, used only by the preview server.**

## Overview

Sets `data-preview="1"` on `<html>` and defines an in-memory `window.storyloom` (books live in the tab only; renderer/preview-boot.js). AI, export and file actions return a preview note instead of working. Since `eb83d47` it also stubs the update API (`updateState: () => ok({ phase: 'idle', current: 'preview' })`, renderer/preview-boot.js) so the sidebar version box renders. Electron never loads this file; it uses [[entities/preload-cjs]].

## Connections

- **depends_on:** —
- **used_by:** [[entities/preview-mjs]]
- **related:** [[entities/window-storyloom-api]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `renderer/preview-boot.js`

## Verified source surface (2026-10-08)


Named function declarations in `renderer/preview-boot.js`: `shape`, `page`, `makeBook`, `story`. This lexical list includes private helpers; it is not an export list.
