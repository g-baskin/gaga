---
type: concept
title: "Soft-error IPC envelopes"
status: developing
created: 2026-10-06
updated: 2026-10-06
complexity: intermediate
domain: "storyloom"
tags:
  - concept
  - storyloom
related:
  - "[[entities/preload-cjs]]"
  - "[[entities/ipc-settings-save]]"
sources: []
---

# Soft-error IPC envelopes

Expected failures (bad settings, not signed in, offline) return `{ error }` instead of throwing so Electron doesn't log them as crashes (main.cjs:561); preload `soft` rethrows them in the page.

## Entities

- [[entities/preload-cjs]]
- [[entities/ipc-settings-save]]
