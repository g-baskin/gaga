---
type: entity
title: "buildEpub"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "epub.cjs"
language: js
depends_on:
  - "[[entities/epub-cjs]]"
used_by:
  - "[[entities/exportEpub]]"
last_commit_hash: "a5dac04"
tested_by:
  - test/epub.test.cjs
tags:
  - entity
  - function
related: []
sources:
  - epub.cjs
---

# buildEpub

## Overview

Defined in `epub.cjs`.

## Signature

```js
function buildEpub({ book, pages, css, width, height, images = [] })
```

## Behavior

Builds a fixed-layout EPUB 3 zip: one XHTML per page (`page-0001.xhtml`…), identifier `urn:isbn:` if ISBN else `urn:uuid:<book id>`, first image is the cover.

## Connections

- **depends_on:** [[entities/epub-cjs]]
- **used_by:** [[entities/exportEpub]]
- **related:** —

## Tested by

- test/epub.test.cjs

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `epub.cjs`
