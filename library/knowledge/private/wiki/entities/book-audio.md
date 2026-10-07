---
type: entity
title: "book-audio (data model)"
entity_type: data-model
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "storage.cjs"
language: js
depends_on: []
used_by:
  - "[[entities/createStore]]"
last_commit_hash: "a5dac04"
tested_by:
  - test/storage.test.cjs
tags:
  - entity
  - data-model
related:
  - "[[concepts/sanitize-on-every-boundary]]"
sources:
  - storage.cjs:205
---

# book-audio (data model)

Shape enforced by `sanitizeAudio` (storage.cjs:205).

`{ narration: { [pageId]: { file, duration, source: recording|import|ai } }, music: { file, volume, loop } | null, voice }`; narration for deleted pages is dropped. `voice` accepts the same names as the settings voice (letters, digits, `. : - _`, up to 80), so OpenRouter voices like `en-US-Nova:MAI` are kept.

Invalid fields are replaced by defaults rather than rejected.

## Connections

- **depends_on:** —
- **used_by:** [[entities/createStore]]
- **related:** [[concepts/sanitize-on-every-boundary]]

## Tested by

- test/storage.test.cjs

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `storage.cjs:205`
