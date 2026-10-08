---
type: concept
title: "Atomic file writes"
status: developing
created: 2026-10-06
updated: 2026-10-08
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

Books, shelves, characters, and the profile are written to a random-suffixed temp file (created with `wx`), flushed to disk with `sync()`, then renamed over the old file (`writeJson` in storage.cjs), so a crash or power cut leaves either the old or the new copy, never an empty one. Settings use a pid-suffixed temp (main.cjs); assets use exclusive create (`wx`) and are never overwritten.

## Entities

- [[entities/createStore]]
- [[entities/saveSettings]]
