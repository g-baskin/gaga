---
type: concept
title: "Renderer network lockdown"
status: developing
created: 2026-10-06
updated: 2026-10-07
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

# Renderer network lockdown

> [!stale] Superseded 2026-10-07
> Earlier text said: the concept was titled "Offline renderer"; it read as if Storyloom were offline-only.
> Current code: only the renderer page is blocked from the network. See [[meta/2026-10-07-contradiction-report]].

The page never reaches the network: `onBeforeRequest` cancels everything except `app:`, `data:`, `blob:`, `devtools:` (main.cjs). Only the main process talks to AI services. Permissions: only audio-only microphone for the app page (main.cjs). Content is served by [[entities/serve]].

## Entities

- [[entities/serve]]
- [[entities/main-cjs]]

## Changes since 2add52d

> [!contradiction] Contract changed; see [[meta/2026-10-07-contradiction-report]].

The lockdown still applies to the page (main.cjs). The app as a whole is not offline-only: the main process talks to the chosen AI services and checks GitHub for signed updates ([[concepts/signed-update-channel]]).
