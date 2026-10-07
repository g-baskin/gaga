---
type: concept
title: "Atomic file writes"
status: developing
created: 2026-10-06
updated: 2026-10-06
complexity: intermediate
domain: "storyloom"
tags:
  - concept
  - storyloom
related:
  - "[[entities/createStore]]"
  - "[[entities/saveSettings]]"
sources: []
---

# Atomic file writes

Books/shelves/profile are written to a random-suffixed temp file then renamed (storage.cjs:318); settings use a pid-suffixed temp (main.cjs:104); assets use exclusive create (`wx`).

## Entities

- [[entities/createStore]]
- [[entities/saveSettings]]
