---
type: entity
title: "handle"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "main.cjs"
language: js
depends_on:
  - "[[entities/main-cjs]]"
used_by:
  - "[[entities/ipc-channels]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[concepts/ipc-trust-boundary]]"
sources:
  - main.cjs:46
---

# handle

## Overview

Defined at `main.cjs:46`.

## Signature

```js
function handle(channel, fn)
```

## Behavior

IPC registration wrapper that rejects any caller other than the main window's top frame on `app://local/` (throws "Untrusted caller").

## Connections

- **depends_on:** [[entities/main-cjs]]
- **used_by:** [[entities/ipc-channels]]
- **related:** [[concepts/ipc-trust-boundary]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:46`
