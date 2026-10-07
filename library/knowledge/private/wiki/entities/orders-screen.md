---
type: entity
title: "renderer/screens/orders.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "renderer/screens/orders.js"
language: js
depends_on:
  - "[[entities/app-js]]"
  - "[[entities/core-js]]"
  - "[[entities/preload-cjs]]"
used_by: []
last_commit_hash: "a5dac04"
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

**Print orders: not available offline; points to a print-ready PDF.**

## Overview

Registered via `registerScreen('orders', …)` at renderer/screens/orders.js:25. Header comment: renderer/screens/orders.js:3.

## IPC used

- `api.listBooks` → [[entities/ipc-books-list]]

## Connections

- **depends_on:** [[entities/app-js]], [[entities/core-js]], [[entities/preload-cjs]]
- **used_by:** —
- **related:** [[concepts/screen-registry]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/screens/orders.js`
