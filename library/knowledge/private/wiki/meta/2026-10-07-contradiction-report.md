---
type: meta
title: "Contradiction report 2026-10-07"
created: 2026-10-07
updated: 2026-10-07
tags:
  - meta
  - contradiction-report
related: []
sources: []
---

# Contradiction report 2026-10-07

Range `2add52d..a7b6898`, escape-hatch scan (partial_scan).

| # | Page | Was | Now | Evidence |
|---|---|---|---|---|
| 1 | [[entities/ipc-ai-open-link]] | three allow-listed links | five: adds `fal-keys`, `source` | main.cjs |
| 2 | [[entities/ipc-channels]] | 44 channels | 49 (five `app:*update*` channels) | main.cjs |
| 3 | [[concepts/offline-network-lockdown]] | "Offline renderer" framing | only the page is network-blocked; main uses AI services and GitHub updates | main.cjs, updater.cjs |
| 4 | [[entities/orders-screen]] | "not available offline" | "not available yet (needs a print partner and payments)" | renderer/screens/orders.js |
| 5 | [[entities/settings-pictures]] | custom / openrouter | adds `fal` | main.cjs |

Each row has `[!stale]` or an inline correction on the page.
