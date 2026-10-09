---
type: entity
title: "publicSettings"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "main/settings.cjs"
language: js
depends_on:
  - "[[entities/settings-json]]"
used_by:
  - "[[entities/ipc-settings-get]]"
  - "[[entities/saveSettings]]"
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[concepts/secret-storage]]"
sources:
  - main/settings.cjs
---

# publicSettings

## Overview

Defined inside `createSettings` in `main/settings.cjs` (`publicSettings`). Exported on the factory result (`main/settings.cjs` (`createSettings` return value)); `settings:get` remains registered in `main.cjs` (`registerHandlers`).

## Signature

```js
const publicSettings = (s) => (
```

## Behavior

Projection of settings sent to the page: replaces encrypted key values with `hasKey`, `hasOpenrouterKey` and `hasFalKey` booleans (`main/settings.cjs` (`publicSettings`)).

## Changes since 2add52d

In main/settings.cjs. Exposes `hasFalKey`, `falImageModel`, `checkUpdates`.

## Connections

- **depends_on:** [[entities/settings-json]]
- **used_by:** [[entities/ipc-settings-get]], [[entities/saveSettings]]
- **related:** [[concepts/secret-storage]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main/settings.cjs`
