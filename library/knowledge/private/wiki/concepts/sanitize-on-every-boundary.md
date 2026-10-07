---
type: concept
title: "Sanitize on every read and write"
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
  - "[[entities/sanitizeBook]]"
  - "[[entities/sanitizePage]]"
  - "[[entities/sanitizeElement]]"
sources: []
---

# Sanitize on every read and write

The store sanitizes on read *and* on save, so hand-edited or old files are normalised and never crash the library (unreadable book folders are skipped in `list`).

## Entities

- [[entities/createStore]]
- [[entities/sanitizeBook]]
- [[entities/sanitizePage]]
- [[entities/sanitizeElement]]
