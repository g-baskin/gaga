---
type: concept
title: "IPC trust boundary"
status: developing
created: 2026-10-06
updated: 2026-10-06
complexity: intermediate
domain: "storyloom"
tags:
  - concept
  - storyloom
related:
  - "[[entities/handle]]"
  - "[[entities/preload-cjs]]"
  - "[[entities/ipc-channels]]"
sources: []
---

# IPC trust boundary

Every channel goes through [[entities/handle]], which rejects senders other than the main window's main frame at `app://local/`. Inputs are re-validated in main ([[entities/sanitizeBook]], `clip`, regexes) regardless of renderer behaviour. Window is `contextIsolation`, `sandbox`, no `nodeIntegration`, no webview; new windows denied and navigation prevented (main.cjs:675).

## Entities

- [[entities/handle]]
- [[entities/preload-cjs]]
- [[entities/ipc-channels]]
