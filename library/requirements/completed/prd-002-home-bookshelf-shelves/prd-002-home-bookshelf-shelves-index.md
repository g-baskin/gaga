# PRD-002: Home, Bookshelf & Shelves *(Retroactive)*

> **Status:** Shipped
> **Priority:** - *(retroactive - work is done)*
> **Written:** October 2026
> **Retroactive:** Yes - this PRD was written after implementation.

---

## What was built

### Home (`renderer/screens/home.js`, app scope)
- Prompt box with quick-idea chips and a "star of the story" name; continuing opens the Story builder prefilled.
- "Import a story" (.txt / .md via `import:story-text`) — text is split into Manuscript chapters on headings / blank lines (`window.storyloomSplitStory`, home.js:170).
- Recent books row and template strip.
- **Not available (labelled cards):** story from a drawing, photo → avatar. Both need a vision AI service (home.js:147-160).

### Bookshelf (`renderer/screens/bookshelf.js`, app scope)
- Grid of all books; search; sort: recently edited, oldest, A–Z, Z–A, custom (drag to reorder). Sort choice kept in `localStorage`; custom order kept in `profile.json` (`bookOrder`) so it survives restart.
- Shelves sidebar: create, rename, delete (books are kept), add/remove books (`shelves:list`/`shelves:save`).
- Per-book ⋯ / right-click menu: open, rename, duplicate, add to shelf, convert to coloring book (PRD-008), move to Trash.
- **Not available:** "Share online" (bookshelf.js:125).

## Acceptance criteria (as verified)
- [x] `selftest/home.cjs`, `selftest/bookshelf.cjs` drive these with real mouse/keyboard input.

## Related
- [PRD-001 storage](../prd-001-book-storage-data-model/prd-001-book-storage-data-model-index.md) · [PRD-003 story builder](../prd-003-story-builder-character-library/prd-003-story-builder-character-library-index.md)
