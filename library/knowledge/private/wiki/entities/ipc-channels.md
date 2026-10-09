---
type: entity
title: "IPC channel index (main ↔ preload)"
entity_type: service
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "main.cjs"
language: js
depends_on:
  - "[[entities/main-cjs]]"
  - "[[entities/preload-cjs]]"
used_by: []
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
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

> [!stale] Prior description retained below
> Earlier scans recorded 44, then 49 invoke channels. This is not the current contract.

> [!contradiction] Verified correction 2026-10-08
> There are 52 registered invoke channels and matching preload wrappers, including scene planning and local logging. Evidence: `main.cjs` / `registerHandlers`; `preload.cjs` / `contextBridge.exposeInMainWorld`. See [[meta/2026-10-08-contradiction-report]].

## Current channel map

Literal registrations in `main.cjs` / `registerHandlers` paired with literal wrappers in `preload.cjs`. Settings has a custom response adapter. This was a lexical comparison, not an IPC execution test.

| Channel | Preload method |
|---|---|
| `books:list` | `listBooks` |
| `books:create` | `createBook` |
| `books:read` | `readBook` |
| `books:save` | `saveBook` |
| `books:rename` | `renameBook` |
| `books:duplicate` | `duplicateBook` |
| `books:delete` | `deleteBook` |
| `books:list-images` | `listImages` |
| `books:import-image` | `importImage` |
| `books:save-image` | `saveImage` |
| `books:list-audio` | `listAudio` |
| `books:import-audio` | `importAudio` |
| `books:save-recording` | `saveRecording` |
| `import:story-text` | `importStoryText` |
| `shelves:list` | `listShelves` |
| `shelves:save` | `saveShelves` |
| `characters:list` | `listCharacters` |
| `characters:save` | `saveCharacter` |
| `characters:delete` | `deleteCharacter` |
| `characters:insert` | `insertCharacter` |
| `profile:get` | `getProfile` |
| `profile:save` | `saveProfile` |
| `books:export-pdf` | `exportPdf` |
| `books:export-epub` | `exportEpub` |
| `books:export-wav` | `exportWav` |
| `books:reveal-export` | `revealExport` |
| `app:log-error` | `logError` |
| `app:open-logs` | `openLogs` |
| `app:open-data-folder` | `openDataFolder` |
| `app:info` | `appInfo` |
| `app:update-state` | `updateState` |
| `app:check-update` | `checkForUpdate` |
| `app:download-update` | `downloadUpdate` |
| `app:install-update` | `installUpdate` |
| `app:open-update-notes` | `openUpdateNotes` |
| `settings:get` | `getSettings` |
| `settings:save` | `saveSettings` |
| `ai:generate` | `generateStory` |
| `ai:chapter` | `generateChapter` |
| `ai:scene-prompts` | `scenePrompts` |
| `ai:image` | `generateImage` |
| `ai:speech` | `generateSpeech` |
| `ai:recommendations` | `aiRecommendations` |
| `ai:chatgpt-status` | `chatGptStatus` |
| `ai:chatgpt-sign-in` | `chatGptSignIn` |
| `ai:chatgpt-cancel` | `chatGptCancel` |
| `ai:chatgpt-welcomed` | `chatGptWelcomed` |
| `ai:chatgpt-sign-out` | `chatGptSignOut` |
| `ai:chatgpt-models` | `chatGptModels` |
| `ai:claude-status` | `claudeStatus` |
| `ai:open-link` | `openLink` |
| `app:close-ready` | `closeReady` |

Subscriptions: `onBeforeClose` → `app:before-close`; `onMenuAction` → `menu:action`; `onUpdateState` → `app:update-state` (`preload.cjs`).

The earlier five-channel update addition remains recorded in [[meta/2026-10-07-contradiction-report]]. Old source-line tables were replaced by stable channel identifiers.
