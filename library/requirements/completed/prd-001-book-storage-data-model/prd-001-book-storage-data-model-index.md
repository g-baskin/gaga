# PRD-001: Book Storage & Data Model *(Retroactive)*

> **Status:** Shipped
> **Priority:** - *(retroactive - work is done)*
> **Written:** October 2026
> **Retroactive:** Yes - this PRD was written after implementation.

---

## What was built

All user data lives as plain JSON plus media files in Electron's `userData` folder, managed by one module, `storage.cjs` (`createStore(root)`, storage.cjs:310). Every value is **sanitized on read and on write**, so a hand-edited or damaged file can never feed unexpected data to the renderer. Writes are atomic (temp file + rename, mode 0600; storage.cjs:315-319).

### Folder layout (inside `userData`)

| Path | Contents |
|---|---|
| `books/<id>/book.json` | One book (pages, manuscript, builder, audio, metadata) |
| `books/<id>/assets/` | Pictures (png/jpg/webp/gif) and sounds (wav/mp3/m4a/ogg/webm) |
| `characters.json` + `characters/` | Reusable character library and its pictures (served as media id `_characters`) |
| `shelves.json` | Shelves `{id, name, bookIds[], order}` |
| `profile.json` | Default author name, custom bookshelf order |
| `settings.json`, `chatgpt.json` | AI settings / sign-in (owned by `main.cjs`, see PRD-010) |

### Book shape (sanitizeBook, storage.cjs:230)

- Metadata: `id`, `title`, `author`, `kind` (`story` \| `coloring`), `size` (`square` \| `portrait` \| `landscape`), `isbn` (valid ISBN-10/13 including check digit, `isValidIsbn` in storage.cjs), `language`, timestamps.
- `pages[]` (max 500): layout (`cover`, `image-top`, `image-left`, `image-full`, `text-only`, `blank`), text, font, colours, frame, page image + `crop`, `elements[]` (max 200: text, shape, sticker, image, `sound`).
- `builder`: idea, genre, writingStyle[], location, era, extras, readingLevel (`first-words`…`confident-reader`), length (`tiny`…`long`), template, illustration style, characters[].
- `manuscript.chapters[]` → `blocks[]` of `{type: p|h2|h3|quote|li, runs:[{text,b,i,u}]}`. **No HTML is ever stored.**
- `audio`: `narration` (pageId → {file, duration, source: recording|import|ai}), `music` {file, volume}, `voice` (same characters as the settings voice, including `:`, up to 80).
- `crop` = `{x,y,w,h}` fractions 0–1 of the source picture (sanitizeCrop, storage.cjs:50).

### Assets and file sniffing

Files are accepted by **content**, not extension (storage.cjs:269-297): PNG/JPEG/GIF/WebP magic bytes (≤25 MB); WAV/MP3/M4A/OGG/WebM (≤100 MB); story text must decode as strict UTF-8 with no control characters (≤2 MB). Asset names are generated (`<newId>.<kind>`) and written with `wx` so nothing is overwritten.

### Operations

list, create, read, save, rename, duplicate (copies assets under a new id, title "(copy)"), remove (moves folder to the macOS Trash via `shell.trashItem`, main.cjs:485-496), list/import/save images and audio, shelves, characters (save/delete/insert into a book), profile, `mediaPath` (resolves app://media requests; names must match strict patterns, storage.cjs:537).

## Acceptance criteria (as verified)

- [x] `test/storage.test.cjs` (11 tests): sanitizing, sniffing, duplicate, shelves, characters, profile, story-text decoding.
- [x] Ids must match `^[a-z0-9-]{1,64}$` (storage.cjs:9, 130) — prevents path traversal.

## Related

- [System overview](../../../knowledge/private/architecture/system-overview.md)
- [Data folder](../../../knowledge/private/data/data-folder.md)
- [Security model](../../../knowledge/private/security/security-model.md)
