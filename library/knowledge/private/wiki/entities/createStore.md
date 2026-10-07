---
type: entity
title: "createStore"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "storage.cjs"
language: js
depends_on:
  - "[[entities/sanitizeBook]]"
used_by:
  - "[[entities/main-cjs]]"
last_commit_hash: "a5dac04"
tested_by:
  - test/storage.test.cjs
tags:
  - entity
  - function
related:
  - "[[concepts/atomic-file-writes]]"
  - "[[concepts/sanitize-on-every-boundary]]"
sources:
  - storage.cjs:310
---

# createStore

## Overview

Defined at `storage.cjs:310`.

## Signature

```js
function createStore(root)
```

## Behavior

Factory over a userData root: `books/<id>/book.json` + `assets/`, `characters/`, `shelves.json`, `characters.json`, `profile.json`. Methods: list, create, read, save, remove, rename, duplicate, importImage, saveImageBytes, importAudio, saveAudioBytes, readStoryText, listShelves, saveShelves, listCharacters, saveCharacter, deleteCharacter, insertCharacter, getProfile, saveProfile, listImages, listAudio, mediaPath. Writes go through temp-file+rename; assets are created with `flag:"wx"`.

## Connections

- **depends_on:** [[entities/sanitizeBook]]
- **used_by:** [[entities/main-cjs]]
- **related:** [[concepts/atomic-file-writes]], [[concepts/sanitize-on-every-boundary]]

## Tested by

- test/storage.test.cjs

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `storage.cjs:310`
