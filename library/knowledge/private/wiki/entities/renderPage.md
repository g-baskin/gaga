---
type: entity
title: "renderPage"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "renderer/core.js"
language: js
depends_on: []
used_by:
  - "[[entities/editor-js]]"
  - "[[entities/export-screen]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[entities/page]]"
sources:
  - renderer/core.js:168
---

# renderPage

## Overview

Defined at `renderer/core.js:168`.

## Signature

```js
function renderPage(page, book, { print = false } = {})
```

## Behavior

Renders a [[entities/page]] and its elements to DOM (also used for thumbnails and PDF print).

## Connections

- **depends_on:** —
- **used_by:** [[entities/editor-js]], [[entities/export-screen]]
- **related:** [[entities/page]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/core.js:168`
