---
ai_description: |
  Storyloom's security model: sandboxed renderer, trusted-caller IPC, network lockdown,
  path containment, file sniffing, keychain-encrypted secrets, AI request limits.
human_description: |
  What protects the user's books and keys, and where each protection lives in the code.
---

# Storyloom Security Model

Principle: the page is untrusted-by-default UI. It cannot touch the disk, the network, or secrets; the main process validates every request.

## Renderer isolation
- `BrowserWindow` with `contextIsolation`, `sandbox`, `nodeIntegration: false`, `webviewTag: false` (main.cjs:672-679).
- New windows denied; navigation blocked (`setWindowOpenHandler`, `will-navigate`).
- CSP: `default-src 'self'`, no inline script, images/media only from self, `app://media`, `data:`, `blob:` (renderer/index.html:5).

## Trusted-caller IPC
Every handler is registered through `handle()` (main.cjs:46-54), which throws `Untrusted caller` unless the sender is the app window's **main frame** at `app://local/`.

## Network lockdown
`session.webRequest.onBeforeRequest` cancels any page request whose scheme is not `app:`, `data:`, `blob:` or `devtools:`. Only the main process reaches the internet, and only for optional AI services.

## Permissions
Only microphone (audio-only media) for the app's own page; everything else denied (main.cjs:652-661).

## Path containment
- `app://local` resolves inside `renderer/` and rejects `..`/absolute escapes (403).
- Book ids must match `^[a-z0-9-]{1,64}$`; asset names must match strict image/audio patterns (storage.cjs:9-11, 537-546).
- Deleted books go to the macOS Trash, not permanent deletion.

## File sniffing and limits
Imported files are identified by magic bytes, not extension (storage.cjs:269-287). Limits: pictures 25 MB, sounds 100 MB, story text 2 MB strict UTF-8, WAV export 1 GB with RIFF/WAVE check. Asset writes use `wx` (never overwrite).

## Stored data sanitizing
All JSON is sanitized on read and write; Manuscript text is structured blocks, never HTML. EPUB export rejects `<script`, `on…=` handlers, `javascript:`, and CSS `@import`/non-book `url()` (main.cjs:444-448).

## Secrets
- API keys (custom service, OpenRouter) are encrypted with Electron `safeStorage` (macOS keychain) and stored base64 in `settings.json`; files written atomically with mode 0600 (main.cjs:96-107).
- The ChatGPT sign-in record is encrypted as a whole in `chatgpt.json`.
- The page only gets `hasKey`/`hasOpenrouterKey` booleans (`publicSettings`, main.cjs:147).
- Claude Code: Storyloom never reads Claude's credentials; it runs `claude -p` with tools, settings, MCP and slash commands off, in an empty folder, with a minimal environment.

## AI request limits
Custom base URL must be https (http only for localhost), no credentials in the URL. Requests use `redirect: 'error'`, timeouts, and response-size caps. Model/voice names are pattern-checked. The ChatGPT browser sign-in only opens `https://auth.openai.com/…`; external links come from a fixed allow-list (`ai:open-link`).

## Test-only paths
`--self-test` uses a temp data folder, mock keychain, fake microphone, and fake service URLs; `useTestServices` throws outside the self-test.

## Known limits
The app is unsigned. AI integrations were tested only against local fakes.

Related: [System overview](../architecture/system-overview.md) · [Data folder](../data/data-folder.md)
