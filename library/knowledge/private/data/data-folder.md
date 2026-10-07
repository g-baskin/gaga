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
| `settings.json` | main.cjs | AI service settings (keys encrypted with safeStorage) and `checkUpdates` (on unless turned off) |
| `chatgpt.json` | main.cjs | Encrypted ChatGPT sign-in record |

Downloaded updates are staged outside this folder, in a `storyloom-update-*` folder in the system temp folder, and deleted after install or on quit.

All writes are atomic (temp + rename) with mode 0600. Back up by copying the folder while the app is closed. Files can be inspected but edits are re-sanitized on load.

Related: [Security model](../security/security-model.md)
