---
type: entity
title: "readSettings"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "main/settings.cjs"
language: js
depends_on:
  - "[[entities/settings-json]]"
used_by:
  - "[[entities/saveSettings]]"
  - "[[entities/aiRequest]]"
  - "[[entities/writeText]]"
  - "[[entities/aiRecommendations]]"
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[entities/settings-json]]"
sources:
  - main/settings.cjs
---

# readSettings

## Overview

Defined in `main/settings.cjs`.

## Signature

```js
async function readSettings()
```

## Behavior

Reads `settings.json` from userData and coerces every field: strings default to `""`, `writer` ∈ WRITERS (default custom), `pictures`/`voices` ∈ MEDIA (default custom), `tier` ∈ TIERS (default balanced). Missing/invalid file → defaults (first run).

## Changes since 2add52d

In main/settings.cjs. Reads `falKeyEnc`, `falImageModel`, and `checkUpdates` (default on).

## Connections

- **depends_on:** [[entities/settings-json]]
- **used_by:** [[entities/saveSettings]], [[entities/aiRequest]], [[entities/writeText]], [[entities/aiRecommendations]]
- **related:** [[entities/settings-json]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main/settings.cjs`

## Source ownership

Implementation moved to `main/settings.cjs` (factory-scoped symbols); IPC registration remains in `main.cjs` / `registerHandlers`. This is a source-location correction, not an inferred behavior change.
