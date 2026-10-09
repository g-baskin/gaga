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

> [!stale] Prior description retained below
> The concept still described a PID-only temporary filename. This is not the current contract.

> [!contradiction] Verified correction 2026-10-08
> writePrivate uses PID plus randomUUID and cleanup; saveSettings queues read-modify-write saves. The resolved [[questions/writeprivate-temp-name-collision]] retains the original finding. Evidence: `main/settings.cjs` / `writePrivate`, `saveSettings`. See [[meta/2026-10-08-contradiction-report]].

## Prior scan / historical description


Books, shelves, characters, and the profile are written to a random-suffixed temp file (created with `wx`), flushed to disk with `sync()`, then renamed over the old file (`writeJson` in storage.cjs), so a crash or power cut leaves either the old or the new copy, never an empty one. Settings use a pid-suffixed temp (main.cjs); assets use exclusive create (`wx`) and are never overwritten.

## Entities

- [[entities/createStore]]
- [[entities/saveSettings]]
