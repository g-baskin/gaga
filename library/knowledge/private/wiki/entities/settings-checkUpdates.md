---
type: entity
title: "settings.checkUpdates"
entity_type: config-key
status: developing
created: 2026-10-07
updated: 2026-10-08
path: "main/settings.cjs"
language: js
depends_on:
  - "[[entities/settings-json]]"
used_by:
  - "[[entities/readSettings]]"
  - "[[entities/saveSettings]]"
  - "[[entities/account-screen]]"
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
key: "checkUpdates"
tags:
  - entity
  - config-key
related:
  - "[[concepts/signed-update-channel]]"
sources:
  - main/settings.cjs
  - main/updates.cjs
---

# settings.checkUpdates

**Whether Storyloom checks GitHub for updates when it opens.**

Field of [[entities/settings-json]].

- **Type:** boolean
- **Default:** `true` — `raw.checkUpdates !== false` (main/settings.cjs)
- **Save:** only changed when the input has the key; must be exactly `true` to turn on (main/settings.cjs). Exposed unchanged by [[entities/publicSettings]] (main/settings.cjs).

When false, a background check returns `{ phase: 'idle', disabled: true }` without contacting GitHub (`main/updates.cjs` / `checkForUpdate`). Manual checks ignore it. Toggled by the "Check for updates when Storyloom opens" checkbox in [[entities/account-screen]] (renderer/screens/account.js+).

## Connections

- **depends_on:** [[entities/settings-json]]
- **used_by:** [[entities/readSettings]], [[entities/saveSettings]], [[entities/account-screen]]
- **related:** [[concepts/signed-update-channel]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `main/settings.cjs` (`readSettings`, `saveSettingsNow`)
- `main/updates.cjs` (`checkForUpdate`)

## Source ownership

Implementation moved to `main/settings.cjs` (factory-scoped symbols); IPC registration remains in `main.cjs` / `registerHandlers`. This is a source-location correction, not an inferred behavior change.
