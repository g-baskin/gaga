---
type: entity
title: "sanitizeElement"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "storage.cjs"
language: js
depends_on: []
used_by:
  - "[[entities/sanitizePage]]"
last_commit_hash: "a5dac04"
tested_by:
  - test/storage.test.cjs
tags:
  - entity
  - function
related:
  - "[[entities/element]]"
sources:
  - storage.cjs
---

# sanitizeElement

## Overview

Defined in `storage.cjs`.

## Signature

```js
function sanitizeElement(el)
```

## Behavior

Normalises an [[entities/element]] by `type`; unknown types or invalid images/stickers are dropped (`null`).

## Connections

- **depends_on:** —
- **used_by:** [[entities/sanitizePage]]
- **related:** [[entities/element]]

## Tested by

- test/storage.test.cjs

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `storage.cjs`
