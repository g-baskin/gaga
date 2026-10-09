---
ai_description: |
  Architecture of Storyloom, an original open-source (AGPL-3.0-only) Electron picture-book app for macOS.
  Books are saved locally; AI and updates use online services. Main process
  (main.cjs), preload bridge (preload.cjs), renderer screens (renderer/), IPC, app:// protocol.
human_description: |
  How Storyloom is put together and where to look in the code.
---

# Storyloom System Overview

Storyloom is an original desktop app for making children's picture books on a Mac. Books are saved on the Mac; there is no Storyloom account or server. AI is optional and uses online services the user connects (see [PRD-010](../../../requirements/completed/prd-010-ai-services/prd-010-ai-services-index.md)). The app updates itself from signed GitHub releases ([PRD-011](../../../requirements/completed/prd-011-in-app-updates/prd-011-in-app-updates-index.md)). Licensed AGPL-3.0-only (`LICENSE`); `README.md` is the user-facing introduction.

## Processes

```
┌──────────────── main process (main.cjs) ────────────────┐
│ storage.cjs  epub.cjs  ai/*.cjs  settings + keychain     │
│ ipcMain handlers (handle())   app:// protocol (serve)    │
└──────────────▲──────────────────────────▲───────────────┘
   ipcRenderer.invoke                app://local, app://media
┌──────────────┴── preload.cjs ──────────┐│
│ contextBridge → window.storyloom (api) ││
└──────────────▲─────────────────────────┘│
┌──────────────┴───── renderer/ (sandboxed page) ─────────┐
│ core.js → designer/*.js → editor.js → app.js →          │
│ data/templates.js →                                      │
│ screens/*.js (registerScreen)                            │
└──────────────────────────────────────────────────────────┘
```

| Layer | File | Role |
|---|---|---|
| Main | `main.cjs`, `main/*.cjs` | Window, menu, permission + network lockdown, `app://` protocol, all IPC handlers; `main/` holds settings, AI calls, exports, and update state |
| Storage | `storage.cjs` | JSON/media store with sanitizing and file sniffing ([PRD-001](../../../requirements/completed/prd-001-book-storage-data-model/prd-001-book-storage-data-model-index.md)) |
| EPUB | `epub.cjs` | Zip + fixed-layout EPUB 3 writer |
| AI | `ai/claude-code.cjs`, `ai/chatgpt.cjs`, `ai/openrouter.cjs`, `ai/fal.cjs`, `ai/model-picker.cjs` | Optional AI services |
| Updates | `updater.cjs` | Signed update check, download, verification, detached installer |
| Bridge | `preload.cjs` | Exposes `window.storyloom` — one method per IPC channel; `soft()` unwraps `{ok}/{error}` replies |
| Renderer | `renderer/index.html` | Loads scripts with `defer` in order (index.html); strict CSP (index.html) |
| | `renderer/core.js` | Shared helpers (`h()` DOM builder, ids, page rendering) |
| | `renderer/editor.js`, `renderer/designer/*.js` | The Designer: `editor.js` is the screen (layout and keyboard/menu listeners); `designer/` holds its model, canvas, drawers, inspector, and page operations (including `exportPdf`) |
| | `renderer/app.js` | State, autosave, navigation, `registerScreen`, dialogs, sidebar version + update notice, `aiPictureNote` |
| | `renderer/theme.css` | Visual design (loaded last); direction in `DESIGN.md` |
| | `renderer/screens/*.js` | One file per screen |

## Service and Designer ownership

`main.cjs` constructs `createSettings`, `createAiServices`, `createExports` and `createUpdates` from `main/settings.cjs`, `ai-services.cjs`, `export.cjs` and `updates.cjs`. They receive dependencies and window/store getters because those objects are created later. All IPC registration stays in `main.cjs` through `handle()`; extracting a service must not bypass its caller checks. Settings owns the read-modify-write queue and encrypted secrets; AI services owns provider instances, caches and routing; exports owns native dialogs and file writes; updates owns the UI-facing state machine above `updater.cjs`.

Designer scripts are shared globals loaded in explicit `renderer/index.html` order, not independent bundled modules:

| File under `renderer/designer/` | Responsibility |
|---|---|
| `model.js` | Element presets, editor state, `checkpoint`, `undo`, `redo`, `resetDesigner` |
| `canvas.js` | Selection, move/resize/rotate, snapping, inline editing and element operations |
| `drawers.js` | Page/text/shape/sticker/picture/frame insertion and drag payloads |
| `inspector.js` | Page and element properties, crop controls, layer panel |
| `pages.js` | Page navigation/duplication/reordering, text-fit notices, print rendering via `exportPdf` |

`editor.js` assembles the screen and keyboard/menu listeners. `core.js` (`renderPage`, `renderElement`, `fitPageText`) supplies shared page rendering; EPUB has a separate serializer in `screens/export.js`. `screens/crop.js` and `screens/illustrate.js` extend Designer tools rather than registering extra screens. Cropping retains the original asset and stores normalized crop coordinates. `fonts.js` loads bundled fonts; generated font files come from `scripts/fetch-fonts.mjs`, not manual edits.

## Screens (renderer/app.js)

`registerScreen(name, { label, scope, render, leave })` (app.js). Scope is `app` (sidebar) or `book` (tabs of the open book).

- **App sidebar** (`APP_NAV`): home, bookshelf, templates, coloring, orders (Print orders), account.
- **Book tabs** (`BOOK_TABS`): story-builder, manuscript, designer, studio, export.
- An unregistered name shows the "isn't built yet" placeholder; the self-test checks none does.

| Screen source under `renderer/screens/` | Current behavior |
|---|---|
| `home.js` | Creates an idea/character plan without an AI request, imports text into chapters, shows recent books |
| `bookshelf.js` | Search, sort, custom order, shelves, rename, duplicate and Trash |
| `story-builder.js` | Character portraits and reusable library, story plan, manual outline or AI manuscript |
| `manuscript.js` | Structured rich text, chapter ordering and word guidance, AI chapter rewrite, explicit layout into pages |
| `templates.js` + `renderer/data/templates.js` | Theme/starter previews, apply theme to an existing book, font samples |
| `coloring.js` + `renderer/line-art.js` | Local line-art conversion and painting, plus optional AI line-art creation |
| `studio.js` | Per-page recorded/imported/generated narration, music, sound buttons and local read-along |
| `export.js` | Digital/print PDF, fixed-layout EPUB, mixed narration WAV, ISBN/copyright metadata |
| `orders.js` | Explains that print ordering is unavailable; links into export workflow |
| `account.js` | Local author profile, AI provider settings/sign-ins, updates, data-folder/log access and About |

Manuscript chapters and designed page text are separate persisted representations. `manuscript.js` (`layOut`) copies chapter text into pages after the cover; existing pictures, layouts and decorations are retained. Editing a chapter does not silently rebuild the Designer. `illustrate.js` plans scenes using the writing service, then draws eligible image-layout pages sequentially; cover/text-only pages are excluded. Stopping takes effect between picture requests. See the [app guide](../../public/guides/making-a-book.md).

**Autosave:** `scheduleSave()` debounces 500 ms; `saveNow()` saves a `structuredClone` snapshot in a promise chain. On window close, main sends `app:before-close`; the page flushes and calls `app:close-ready`. Main force-closes after 3 s so a hung save never traps the user (main.cjs).

## IPC channels (main.cjs)

| Group | Channels |
|---|---|
| Books | `books:list/create/read/save/rename/duplicate/delete` |
| Media | `books:list-images/import-image/save-image/list-audio/import-audio/save-recording`, `import:story-text` |
| Library | `shelves:list/save`, `characters:list/save/delete/insert`, `profile:get/save` |
| Export | `books:export-pdf/export-epub/export-wav/reveal-export` |
| App | `app:info`, `app:open-data-folder`, `app:open-logs`, `app:log-error`, `app:close-ready`, `settings:get/save` |
| Updates | `app:update-state`, `app:check-update`, `app:download-update`, `app:install-update`, `app:open-update-notes` |
| AI | `ai:generate/chapter/scene-prompts/image/speech/recommendations`, `ai:chatgpt-status/sign-in/cancel/welcomed/sign-out/models`, `ai:claude-status`, `ai:open-link` |

Main → page events: `menu:action` (undo/redo), `app:before-close`, `app:update-state`.

`ai:open-link` names: `chatgpt-usage`, `openrouter-keys`, `fal-keys`, `claude-code`, `source` (the GitHub source, from Account → About).

## app:// protocol (`serve`, main.cjs)

- `app://local/<path>` → files in `renderer/`, path-contained, GET only, `nosniff`.
- `app://media/<bookId>/<name>` → book assets via `store.mediaPath` (or `_characters` for the character library); supports HTTP Range (206/416) for audio seeking; CORS only for `app://local`.

## Testing

- `npm test` — Node's test runner over `test/*.test.cjs`, including storage, EPUB, providers/model selection, changelog, updater, logging, fonts and import boundaries. This is not `pytest`.
- `npm run self-test` — launches the app with `--self-test` (temp data folder, fake microphone, mock keychain, local fake AI services) and drives every screen via `selftest/*.cjs`.
- `npm run package` — macOS `.app`; `npm run dist` — Intel + Apple Silicon `.dmg` and `.app.zip` (see [Release process](../release/release-process.md)).
- `npm run preview` — `scripts/preview.mjs` serves `renderer/` on port 4173 (or `PORT`) and injects `renderer/preview-boot.js`, a browser stand-in for `window.storyloom` with sample books kept in the tab only. For checking the look; writing, pictures and export run only in the desktop app. Electron never loads it.

## Diagnostics and recovery

`log.cjs` (`createLog`) writes local `storyloom.log` and a rotated `storyloom.old.log` under `app.getPath('logs')`, normally `~/Library/Logs/Storyloom`. The log has a roughly 1 MiB rotation threshold and bounded entries. It is never uploaded automatically. `main.cjs` records process errors, damaged supporting JSON, unreadable books and renderer failures; `core.js` (`logError`) sends renderer diagnostics over IPC. Account can reveal the log.

A crashed window offers Reload/Quit; an unresponsive window offers Wait/Reload. Failed saves display “Not saved.” Recovery and the close handshake cannot guarantee the last unsaved edit survives. Supporting JSON and unreadable-book recovery differ; see [Data folder](../data/data-folder.md).

## Visual design
`DESIGN.md` records the direction: lavender/purple palette, Rockwell display type, Home as an open notebook page, books on a wooden shelf, left sidebar navigation. Implemented in `renderer/theme.css`.

## Related

- [Security model](../security/security-model.md) · [Data folder](../data/data-folder.md)
- [AI services](../ai/ai-services.md) · [Development and verification](../development/development-and-verification.md)
- Code wiki: [`../wiki/`](../wiki/) (maintained separately)
- Feature status: `FEATURES.md` at the repo root · Releases: `CHANGELOG.md`, [Release process](../release/release-process.md)
