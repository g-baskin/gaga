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
│ core.js → editor.js → app.js → data/templates.js →      │
│ screens/*.js (registerScreen)                            │
└──────────────────────────────────────────────────────────┘
```

| Layer | File | Role |
|---|---|---|
| Main | `main.cjs` | Window, menu, permission + network lockdown, `app://` protocol, all IPC handlers, AI calls, exports |
| Storage | `storage.cjs` | JSON/media store with sanitizing and file sniffing ([PRD-001](../../../requirements/completed/prd-001-book-storage-data-model/prd-001-book-storage-data-model-index.md)) |
| EPUB | `epub.cjs` | Zip + fixed-layout EPUB 3 writer |
| AI | `ai/claude-code.cjs`, `ai/chatgpt.cjs`, `ai/openrouter.cjs`, `ai/fal.cjs`, `ai/model-picker.cjs` | Optional AI services |
| Updates | `updater.cjs` | Signed update check, download, verification, detached installer |
| Bridge | `preload.cjs` | Exposes `window.storyloom` — one method per IPC channel; `soft()` unwraps `{ok}/{error}` replies |
| Renderer | `renderer/index.html` | Loads scripts with `defer` in order (index.html); strict CSP (index.html) |
| | `renderer/core.js` | Shared helpers (`h()` DOM builder, ids, page rendering) |
| | `renderer/editor.js` | Designer page editor and `exportPdf` |
| | `renderer/app.js` | State, autosave, navigation, `registerScreen`, dialogs, sidebar version + update notice, `aiPictureNote` |
| | `renderer/theme.css` | Visual design (loaded last); direction in `DESIGN.md` |
| | `renderer/screens/*.js` | One file per screen |

## Screens (renderer/app.js)

`registerScreen(name, { label, scope, render, leave })` (app.js). Scope is `app` (sidebar) or `book` (tabs of the open book).

- **App sidebar** (`APP_NAV`): home, bookshelf, templates, coloring, orders (Print orders), account.
- **Book tabs** (`BOOK_TABS`): story-builder, manuscript, designer, studio, export.
- An unregistered name shows the "isn't built yet" placeholder; the self-test checks none does.

**Autosave:** `scheduleSave()` debounces 500 ms; `saveNow()` saves a `structuredClone` snapshot in a promise chain. On window close, main sends `app:before-close`; the page flushes and calls `app:close-ready`. Main force-closes after 3 s so a hung save never traps the user (main.cjs).

## IPC channels (main.cjs)

| Group | Channels |
|---|---|
| Books | `books:list/create/read/save/rename/duplicate/delete` |
| Media | `books:list-images/import-image/save-image/list-audio/import-audio/save-recording`, `import:story-text` |
| Library | `shelves:list/save`, `characters:list/save/delete/insert`, `profile:get/save` |
| Export | `books:export-pdf/export-epub/export-wav/reveal-export` |
| App | `app:info`, `app:open-data-folder`, `app:close-ready`, `settings:get/save` |
| Updates | `app:update-state`, `app:check-update`, `app:download-update`, `app:install-update`, `app:open-update-notes` |
| AI | `ai:generate/chapter/image/speech/recommendations`, `ai:chatgpt-status/sign-in/cancel/welcomed/sign-out/models`, `ai:claude-status`, `ai:open-link` |

Main → page events: `menu:action` (undo/redo), `app:before-close`, `app:update-state`.

`ai:open-link` names: `chatgpt-usage`, `openrouter-keys`, `fal-keys`, `claude-code`, `source` (the GitHub source, from Account → About).

## app:// protocol (`serve`, main.cjs)

- `app://local/<path>` → files in `renderer/`, path-contained, GET only, `nosniff`.
- `app://media/<bookId>/<name>` → book assets via `store.mediaPath` (or `_characters` for the character library); supports HTTP Range (206/416) for audio seeking; CORS only for `app://local`.

## Testing

- `npm test` — unit tests in `test/` (storage, epub, model-picker, ai-services, changelog, updater).
- `npm run self-test` — launches the app with `--self-test` (temp data folder, fake microphone, mock keychain, local fake AI services) and drives every screen via `selftest/*.cjs`.
- `npm run package` — macOS `.app`; `npm run dist` — Intel + Apple Silicon `.dmg` and `.app.zip` (see [Release process](../release/release-process.md)).
- `npm run preview` — `scripts/preview.mjs` serves `renderer/` on port 4173 (or `PORT`) and injects `renderer/preview-boot.js`, a browser stand-in for `window.storyloom` with sample books kept in the tab only. For checking the look; writing, pictures and export run only in the desktop app. Electron never loads it.

## Visual design
`DESIGN.md` records the direction: lavender/purple palette, Rockwell display type, Home as an open notebook page, books on a wooden shelf, left sidebar navigation. Implemented in `renderer/theme.css`.

## Related

- [Security model](../security/security-model.md) · [Data folder](../data/data-folder.md)
- Code wiki: [`../wiki/`](../wiki/) (maintained separately)
- Feature status: `FEATURES.md` at the repo root · Releases: `CHANGELOG.md`, [Release process](../release/release-process.md)
