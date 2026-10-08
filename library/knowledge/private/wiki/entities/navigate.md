---
type: entity
title: "navigate"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "renderer/app.js"
language: js
depends_on:
  - "[[entities/registerScreen]]"
  - "[[entities/preload-cjs]]"
used_by:
  - "[[entities/app-js]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[concepts/screen-registry]]"
sources:
  - renderer/app.js
---

# navigate

## Overview

Defined in `renderer/app.js`.

## Signature

```js
async function navigate(name, params = {})
```

## Behavior

Leaves current screen, `saveNow()`, opens `params.bookId` if given, redirects book-scope screens to bookshelf when no book is open, guards against stale navigations with a sequence number, renders.

## Connections

- **depends_on:** [[entities/registerScreen]], [[entities/preload-cjs]]
- **used_by:** [[entities/app-js]]
- **related:** [[concepts/screen-registry]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/app.js`
