---
status: accepted
date: 2026-10-07
recorded: 2026-10-08
---

# ADR-4: Only the main process goes online; the page never does

## Context and problem statement

Storyloom began as an offline-only app (first commit `a5dac04`). Optional AI writing, pictures, and voices, plus in-app updates, need the network. But the page (renderer) shows content from books and AI services, and if it could reach the internet, a malicious picture, a font, or a compromised script could send someone's books or keys away.

## Considered options

1. **Stay offline-only**: no AI services and no updates.
2. **Let the page call AI services directly** with the user's keys.
3. **All network traffic goes through the main process**; the page is cut off from the network entirely.

## Decision outcome

Option 3. The "offline-only" wording was dropped in commit `eb83d47` once updates and AI services shipped. In `main.cjs`, `onBeforeRequest` cancels every request from the page except `app:`, `data:`, `blob:`, and `devtools:`, and the page's Content-Security-Policy has no `unsafe-inline`. AI and update requests are made in the main process, which keeps the keys (encrypted with `safeStorage`) and saves generated pictures and audio into the book. The page only gets the file name back.

Option 1 would have meant no AI help and no updates. Option 2 would have put API keys in the page, within reach of anything rendered there.

## Consequences

- Every new feature that talks to the internet needs an IPC channel registered with `handle()` in `main.cjs`, which checks that the call came from Storyloom's own page.
- The renderer never sees keys, only `publicSettings` booleans such as `hasOpenrouterKey`.
- The privacy promise is narrower than "offline": books stay on the Mac, and only the text and pictures needed for a job are sent to the AI service the person chose. Nothing is sent to the people who make Storyloom.
- External links open only from the fixed allow-list in `ai:open-link`.
