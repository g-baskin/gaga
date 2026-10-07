---
type: entity
title: "saveSettings"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "main.cjs"
language: js
depends_on:
  - "[[entities/readSettings]]"
  - "[[entities/settings-json]]"
used_by:
  - "[[entities/ipc-settings-save]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[concepts/secret-storage]]"
  - "[[concepts/atomic-file-writes]]"
sources:
  - main.cjs:108
---

# saveSettings

## Overview

Defined at `main.cjs:108`.

## Signature

```js
async function saveSettings(input = {})
```

## Behavior

Runs one save at a time (a queue), so overlapping saves can't lose each other's changes. Merges input over current settings, validates (`checkBaseUrl`: https or loopback http, no credentials; `checkModel` regex; voice regex; absolute `claudePath`), encrypts new keys with `safeStorage`, honours `clearKey`/`clearOpenrouterKey`, writes atomically with mode 0600 via `writePrivate`, resets the Claude status cache when the path changes, returns [[entities/publicSettings]].

## Connections

- **depends_on:** [[entities/readSettings]], [[entities/settings-json]]
- **used_by:** [[entities/ipc-settings-save]]
- **related:** [[concepts/secret-storage]], [[concepts/atomic-file-writes]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:108`
