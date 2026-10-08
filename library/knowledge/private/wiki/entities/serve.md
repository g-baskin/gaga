---
type: entity
title: "serve"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "main.cjs"
language: js
depends_on:
  - "[[entities/createStore]]"
used_by:
  - "[[entities/main-cjs]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[concepts/offline-network-lockdown]]"
sources:
  - main.cjs
---

# serve

## Overview

Defined in `main.cjs`.

## Signature

```js
async function serve(request)
```

## Behavior

`app://` protocol handler. `app://local/…` serves files from `renderer/` with path-traversal guard; `app://media/<bookId>/<name>` serves validated media with HTTP Range (206/416) and CORS for `app://local`. Non-GET → 405; errors → 404.

## Connections

- **depends_on:** [[entities/createStore]]
- **used_by:** [[entities/main-cjs]]
- **related:** [[concepts/offline-network-lockdown]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`
