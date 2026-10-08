---
type: entity
title: "IPC channel index (main ↔ preload)"
entity_type: service
status: developing
created: 2026-10-06
updated: 2026-10-07
path: "main.cjs"
language: js
depends_on:
  - "[[entities/main-cjs]]"
  - "[[entities/preload-cjs]]"
used_by: []
last_commit_hash: "eb83d47"
tested_by: []
tags:
  - entity
  - ipc
related:
  - "[[concepts/ipc-trust-boundary]]"
sources:
  - main.cjs
  - preload.cjs
---

# IPC channel index (main ↔ preload)

> [!stale] Superseded 2026-10-07
> Earlier text said: "All 44 handle(...) channels".
> Current code: 49 channels after the five update channels. See [[meta/2026-10-07-contradiction-report]].

All 44 `handle(...)` channels in `main.cjs` and their `window.storyloom` wrappers. Every channel has exactly one preload method and vice versa (verified by script at scan time). This is a per-chunk listing page, not the driver-owned `_index.md`.

| Channel | main.cjs | preload method | soft |
|---|---|---|---|
| [[entities/ipc-books-list]] | 472 | `listBooks` |  |
| [[entities/ipc-books-create]] | 473 | `createBook` |  |
| [[entities/ipc-books-read]] | 474 | `readBook` |  |
| [[entities/ipc-books-save]] | 475 | `saveBook` |  |
| [[entities/ipc-books-rename]] | 476 | `renameBook` |  |
| [[entities/ipc-books-duplicate]] | 477 | `duplicateBook` |  |
| [[entities/ipc-books-delete]] | 485 | `deleteBook` |  |
| [[entities/ipc-books-list-images]] | 497 | `listImages` |  |
| [[entities/ipc-books-import-image]] | 498 | `importImage` |  |
| [[entities/ipc-books-save-image]] | 503 | `saveImage` |  |
| [[entities/ipc-books-list-audio]] | 504 | `listAudio` |  |
| [[entities/ipc-books-import-audio]] | 505 | `importAudio` |  |
| [[entities/ipc-books-save-recording]] | 510 | `saveRecording` |  |
| [[entities/ipc-import-story-text]] | 511 | `importStoryText` |  |
| [[entities/ipc-shelves-list]] | 516 | `listShelves` |  |
| [[entities/ipc-shelves-save]] | 517 | `saveShelves` |  |
| [[entities/ipc-characters-list]] | 518 | `listCharacters` |  |
| [[entities/ipc-characters-save]] | 519 | `saveCharacter` |  |
| [[entities/ipc-characters-delete]] | 520 | `deleteCharacter` |  |
| [[entities/ipc-characters-insert]] | 521 | `insertCharacter` |  |
| [[entities/ipc-profile-get]] | 522 | `getProfile` |  |
| [[entities/ipc-profile-save]] | 523 | `saveProfile` |  |
| [[entities/ipc-books-export-pdf]] | 524 | `exportPdf` |  |
| [[entities/ipc-books-export-epub]] | 534 | `exportEpub` |  |
| [[entities/ipc-books-export-wav]] | 535 | `exportWav` |  |
| [[entities/ipc-books-reveal-export]] | 544 | `revealExport` |  |
| [[entities/ipc-app-open-data-folder]] | 545 | `openDataFolder` |  |
| [[entities/ipc-app-info]] | 546 | `appInfo` |  |
| [[entities/ipc-settings-get]] | 547 | `getSettings` |  |
| [[entities/ipc-settings-save]] | 550 | `None` |  |
| [[entities/ipc-ai-generate]] | 557 | `generateStory` |  |
| [[entities/ipc-ai-chapter]] | 558 | `generateChapter` |  |
| [[entities/ipc-ai-image]] | 559 | `generateImage` |  |
| [[entities/ipc-ai-speech]] | 560 | `generateSpeech` |  |
| [[entities/ipc-ai-recommendations]] | 565 | `aiRecommendations` | yes |
| [[entities/ipc-ai-chatgpt-status]] | 566 | `chatGptStatus` | yes |
| [[entities/ipc-ai-chatgpt-sign-in]] | 567 | `chatGptSignIn` | yes |
| [[entities/ipc-ai-chatgpt-cancel]] | 568 | `chatGptCancel` |  |
| [[entities/ipc-ai-chatgpt-welcomed]] | 569 | `chatGptWelcomed` | yes |
| [[entities/ipc-ai-chatgpt-sign-out]] | 570 | `chatGptSignOut` | yes |
| [[entities/ipc-ai-chatgpt-models]] | 571 | `chatGptModels` | yes |
| [[entities/ipc-ai-claude-status]] | 572 | `claudeStatus` | yes |
| [[entities/ipc-ai-open-link]] | 573 | `openLink` |  |
| [[entities/ipc-app-close-ready]] | 583 | `closeReady` |  |

Preload methods with no caller found in `renderer/`: none (selftest may still use them).

Push events main→page: `app:before-close` (main.cjs), `menu:action` (main.cjs).

## Changes since 2add52d

> [!contradiction] Contract changed; see [[meta/2026-10-07-contradiction-report]].

Added channels (main.cjs): [[entities/ipc-app-update-state]], [[entities/ipc-app-check-update]], [[entities/ipc-app-download-update]], [[entities/ipc-app-install-update]], [[entities/ipc-app-open-update-notes]]. Line numbers in the table above are from `2add52d`. New push event: `app:update-state`.

## Connections

- **depends_on:** [[entities/main-cjs]], [[entities/preload-cjs]]
- **used_by:** —
- **related:** [[concepts/ipc-trust-boundary]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs`
- `preload.cjs`
