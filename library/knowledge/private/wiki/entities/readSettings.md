---
type: entity
title: "readSettings"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-07
path: "main.cjs"
language: js
depends_on:
  - "[[entities/settings-json]]"
used_by:
  - "[[entities/saveSettings]]"
  - "[[entities/aiRequest]]"
  - "[[entities/writeText]]"
  - "[[entities/aiRecommendations]]"
last_commit_hash: "eb83d47"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[entities/settings-json]]"
sources:
  - main.cjs:64
---

# readSettings

## Overview

Defined at `main.cjs:64`.

## Signature

```js
async function readSettings()
```

## Behavior

Reads `settings.json` from userData and coerces every field: strings default to `""`, `writer` ∈ WRITERS (default custom), `pictures`/`voices` ∈ MEDIA (default custom), `tier` ∈ TIERS (default balanced). Missing/invalid file → defaults (first run).

## Changes since 2add52d

Now at main.cjs:69 (line numbers in older text are from `2add52d`). Reads `falKeyEnc`, `falImageModel`, and `checkUpdates` (default on).

## Connections

- **depends_on:** [[entities/settings-json]]
- **used_by:** [[entities/saveSettings]], [[entities/aiRequest]], [[entities/writeText]], [[entities/aiRecommendations]]
- **related:** [[entities/settings-json]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:64`
