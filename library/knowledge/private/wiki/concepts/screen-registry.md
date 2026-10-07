---
type: concept
title: "Screen registry and navigation"
status: developing
created: 2026-10-06
updated: 2026-10-06
complexity: intermediate
domain: "storyloom"
tags:
  - concept
  - storyloom
related:
  - "[[entities/registerScreen]]"
  - "[[entities/navigate]]"
  - "[[entities/app-js]]"
sources: []
---

# Screen registry and navigation

Screens self-register with [[entities/registerScreen]]; scope `app` vs `book` decides whether a book must be open; [[entities/navigate]] autosaves before switching. Unregistered screens render a "not built" placeholder.

## Entities

- [[entities/registerScreen]]
- [[entities/navigate]]
- [[entities/app-js]]
