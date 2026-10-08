---
type: entity
title: "registerScreen"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "renderer/app.js"
language: js
depends_on: []
used_by:
  - "[[entities/app-js]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[concepts/screen-registry]]"
sources:
  - renderer/app.js
---

# registerScreen

## Overview

Defined in `renderer/app.js`.

## Signature

```js
function registerScreen(name, def)
```

## Behavior

Registers `{label, scope, render, leave}` by name; re-renders immediately if that screen is on display.

## Connections

- **depends_on:** —
- **used_by:** [[entities/app-js]]
- **related:** [[concepts/screen-registry]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/app.js`
