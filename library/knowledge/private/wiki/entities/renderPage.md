---
type: entity
title: "renderPage"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "renderer/core.js"
language: js
depends_on: []
used_by:
  - "[[entities/designer-canvas]]"
  - "[[entities/designer-pages]]"
  - "[[entities/export-screen]]"
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[entities/page]]"
sources:
  - renderer/designer/pages.js
  - renderer/designer/canvas.js
  - renderer/core.js
---

# renderPage

## Overview

Defined in `renderer/core.js`.

## Signature

```js
function renderPage(page, book, { print = false } = {})
```

## Behavior

Renders a [[entities/page]] and its elements to DOM (also used for thumbnails and PDF print).

## Connections

- **depends_on:** —
- **used_by:** [[entities/designer-canvas]], [[entities/designer-pages]], [[entities/export-screen]]
- **related:** [[entities/page]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/core.js`

## Ownership evidence

Designer callers are `renderer/designer/canvas.js` (`renderCanvas`) and `renderer/designer/pages.js` (`exportPdf`), not renderer/editor.js.
