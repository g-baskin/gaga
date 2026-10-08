---
type: entity
title: "publicSettings"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-07
path: "main.cjs"
language: js
depends_on:
  - "[[entities/settings-json]]"
used_by:
  - "[[entities/ipc-settings-get]]"
  - "[[entities/saveSettings]]"
last_commit_hash: "eb83d47"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[concepts/secret-storage]]"
sources:
  - main.cjs
---

# publicSettings

## Overview

Defined in `main.cjs`.

## Signature

```js
const publicSettings = (s) => (
```

## Behavior

Projection of settings sent to the page: replaces `apiKeyEnc`/`openrouterKeyEnc` with booleans `hasKey`/`hasOpenrouterKey`.

## Changes since 2add52d

In main.cjs. Exposes `hasFalKey`, `falImageModel`, `checkUpdates`.

## Connections

- **depends_on:** [[entities/settings-json]]
- **used_by:** [[entities/ipc-settings-get]], [[entities/saveSettings]]
- **related:** [[concepts/secret-storage]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`
