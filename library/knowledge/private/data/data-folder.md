---
ai_description: |
  Layout of Storyloom's data folder (Electron userData) and which module owns each file.
human_description: |
  Where Storyloom keeps books, pictures, sounds, and settings on disk.
---

# Storyloom Data Folder

Location: Electron `app.getPath('userData')` (on macOS normally `~/Library/Application Support/Storyloom`). The Account screen shows it and can open it (`app:info`, `app:open-data-folder`).

| Path | Owner | Contents |
|---|---|---|
| `books/<id>/book.json` | storage.cjs | One book (schema: [PRD-001](../../../requirements/completed/prd-001-book-storage-data-model/prd-001-book-storage-data-model-index.md)) |
| `books/<id>/assets/<id>.<ext>` | storage.cjs | Pictures and sounds of that book |
| `characters.json`, `characters/` | storage.cjs | Reusable character library |
| `shelves.json` | storage.cjs | Shelves |
| `profile.json` | storage.cjs | Default author, custom bookshelf order |
| `settings.json` | main/settings.cjs | AI service settings (keys encrypted with safeStorage) and `checkUpdates` (on unless turned off) |
| `chatgpt.json` | main/ai-services.cjs + main/settings.cjs | Encrypted ChatGPT sign-in record |

Downloaded updates are staged outside this folder, in a `storyloom-update-*` folder in the system temp folder, and deleted after install or on quit.

Book/supporting JSON writes use a mode-0600 temporary file, sync it, then rename it (`storage.cjs`, `writeJson`). Settings and ChatGPT records use `main/settings.cjs` (`writePrivate`) with temporary-file replacement. Asset bytes use exclusive writes; imported/duplicated assets use exclusive copies, not JSON's atomic-replacement path. Do not assume every file write has identical durability or permission behavior.

## Stored document and assets

`sanitizeBook()` retains identity, kind, title/author, page size, valid ISBN, language, builder plan, manuscript, audio and timestamps. It caps books at 500 pages and supplies a cover if none remain. `sanitizePage()` retains layout text, image, normalized crop, `imagePrompt`, typography, frame and up to 200 placed elements. `sanitizeElement()` accepts supported text, image, shape, sticker and sound fields only. Add new editor fields to these allow-lists or a save discards them.

`sanitizeManuscript()` stores up to 200 chapters with structured blocks and bold/italic/underline runs, not HTML. `sanitizeAudio()` keys narration by surviving page IDs and stores a background track with volume/loop settings and a voice choice. Removing a reference does not itself delete the asset.

`sniffImage()` and `sniffAudio()` inspect content signatures. Images are limited to 25 MiB (PNG/JPEG/WebP/GIF), audio to 100 MiB (WAV/MP3/M4A/OGG/WebM), and text import to 2 MiB of valid UTF-8, optionally with a UTF-8 BOM. Byte-uploaded audio must be nonempty. Assets receive generated filenames. `duplicate()` copies recognized image/audio files to a new book; `remove()` sends the whole folder to macOS Trash and removes shelf memberships.

`saveCharacter()` copies a portrait into the reusable character library; `insertCharacter()` copies it back into a book. Removing a library entry leaves existing book copies intact. `_characters` is the special media namespace, not a valid book ID.

## Listings and recovery

`createStore().list()` caches summaries by file identity, modification time and size, uses at most 16 concurrent reads, and returns cloned summaries. Unreadable `book.json` files are left in place and skipped, with `onUnreadableBook` reporting once per session; this is not automatic book repair.

Supporting JSON follows `readJsonFile()`: missing files use defaults; invalid JSON is renamed to `.damaged-<timestamp>` and defaults are returned, without immediately writing a replacement. Permission and other read errors propagate. `main.cjs` shows recovery messages and records details in the local log.

## Backups

Copy the whole data folder while Storyloom is closed. Keep `books/` assets and supporting files, including `characters/`, if reusable portraits, shelves and author defaults matter. PDF/EPUB/WAV exports are publications, not editable project backups. Credentials encrypted by the Mac keychain may need reconnecting on another Mac/user. Never attach settings, sign-in records or logs to a public report without reviewing them.

Related: [Security model](../security/security-model.md)
