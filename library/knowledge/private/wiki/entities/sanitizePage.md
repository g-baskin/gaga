---
type: entity
title: "sanitizePage"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "storage.cjs"
language: js
depends_on:
  - "[[entities/sanitizeElement]]"
used_by:
  - "[[entities/sanitizeBook]]"
last_commit_hash: "a5dac04"
tested_by:
  - test/storage.test.cjs
tags:
  - entity
  - function
related:
  - "[[entities/page]]"
sources:
  - storage.cjs:135
---

# sanitizePage

## Overview

Defined at `storage.cjs:135`.

## Signature

```js
function sanitizePage(page = {})
```

## Behavior

Normalises a [[entities/page]]; cover pages default to font size 48, others 24.

## Connections

- **depends_on:** [[entities/sanitizeElement]]
- **used_by:** [[entities/sanitizeBook]]
- **related:** [[entities/page]]

## Tested by

- test/storage.test.cjs

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `storage.cjs:135`
