---
type: entity
title: "settings.checkUpdates"
entity_type: config-key
status: developing
created: 2026-10-07
updated: 2026-10-07
path: "main.cjs"
language: js
depends_on:
  - "[[entities/settings-json]]"
used_by:
  - "[[entities/readSettings]]"
  - "[[entities/saveSettings]]"
  - "[[entities/account-screen]]"
last_commit_hash: "eb83d47"
tested_by: []
key: "checkUpdates"
tags:
  - entity
  - config-key
related:
  - "[[concepts/signed-update-channel]]"
sources:
  - main.cjs:82
  - main.cjs:159
  - main.cjs:231
---

# settings.checkUpdates

**Whether Storyloom checks GitHub for updates when it opens.**

Field of [[entities/settings-json]].

- **Type:** boolean
- **Default:** `true` — `raw.checkUpdates !== false` (main.cjs:82)
- **Save:** only changed when the input has the key; must be exactly `true` to turn on (main.cjs:159). Exposed unchanged by [[entities/publicSettings]] (main.cjs:177).

When false, a background check returns `{ phase: 'idle', disabled: true }` without contacting GitHub (main.cjs:231). Manual checks ignore it. Toggled by the "Check for updates when Storyloom opens" checkbox in [[entities/account-screen]] (renderer/screens/account.js:242+).

## Connections

- **depends_on:** [[entities/settings-json]]
- **used_by:** [[entities/readSettings]], [[entities/saveSettings]], [[entities/account-screen]]
- **related:** [[concepts/signed-update-channel]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `main.cjs:82`
- `main.cjs:159`
- `main.cjs:231`
