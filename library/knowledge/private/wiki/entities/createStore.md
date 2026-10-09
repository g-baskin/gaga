---
type: entity
title: "createStore"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "storage.cjs"
language: js
depends_on:
  - "[[entities/sanitizeBook]]"
used_by:
  - "[[entities/main-cjs]]"
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
tested_by:
  - test/storage.test.cjs
tags:
  - entity
  - function
related:
  - "[[concepts/atomic-file-writes]]"
  - "[[concepts/sanitize-on-every-boundary]]"
sources:
  - storage.cjs
---

# createStore

> [!stale] Prior description retained below
> The prior signature was createStore(root). This is not the current contract.

> [!contradiction] Verified correction 2026-10-08
> The signature is createStore(root, { onDamaged, onUnreadableBook } = {}); list caches summaries against mtime/size/inode, bounds concurrent reads, and reports unreadable existing books without deleting them. Evidence: `storage.cjs` / `createStore`, `list`. See [[meta/2026-10-08-contradiction-report]].

## Prior scan / historical description


## Overview

Defined in `storage.cjs`.

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

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `storage.cjs`
