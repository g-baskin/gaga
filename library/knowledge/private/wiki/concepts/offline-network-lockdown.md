---
type: concept
title: "Offline renderer / network lockdown"
status: developing
created: 2026-10-06
updated: 2026-10-06
complexity: intermediate
domain: "storyloom"
tags:
  - concept
  - storyloom
related:
  - "[[entities/serve]]"
  - "[[entities/main-cjs]]"
sources: []
---

# Offline renderer / network lockdown

The page never reaches the network: `onBeforeRequest` cancels everything except `app:`, `data:`, `blob:`, `devtools:` (main.cjs:662). Only the main process talks to AI services. Permissions: only audio-only microphone for the app page (main.cjs:655). Content is served by [[entities/serve]].

## Entities

- [[entities/serve]]
- [[entities/main-cjs]]
