---
type: entity
title: "renderer/screens/orders.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-07
path: "renderer/screens/orders.js"
language: js
depends_on:
  - "[[entities/app-js]]"
  - "[[entities/core-js]]"
  - "[[entities/preload-cjs]]"
used_by: []
last_commit_hash: "eb83d47"
tested_by: []
tags:
  - entity
  - module
  - screen
related:
  - "[[concepts/screen-registry]]"
sources:
  - renderer/screens/orders.js
---

# renderer/screens/orders.js

> [!contradiction] Changed since 2add52d; see [[meta/2026-10-07-contradiction-report]].

**Print orders: not available yet; points to a print-ready PDF.**

## Overview

Registered via `registerScreen('orders', …)` at renderer/screens/orders.js:25. Header comment: renderer/screens/orders.js:3.

## IPC used

- `api.listBooks` → [[entities/ipc-books-list]]

## Changes since 2add52d

Header now says print orders are "not available yet (needs a print partner and payments)" (renderer/screens/orders.js:3).

## Connections

- **depends_on:** [[entities/app-js]], [[entities/core-js]], [[entities/preload-cjs]]
- **used_by:** —
- **related:** [[concepts/screen-registry]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/screens/orders.js`
