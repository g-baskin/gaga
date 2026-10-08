# PRD-002: Home, Bookshelf & Shelves *(Retroactive)*

> **Status:** Shipped
> **Priority:** - *(retroactive - work is done)*
> **Written:** October 2026
> **Retroactive:** Yes - this PRD was written after implementation.

---

## What was built

### Home (`renderer/screens/home.js`, app scope)
- Prompt box with quick-idea chips and a "star of the story" name; continuing opens the Story builder prefilled.
- "Import a story" (.txt / .md via `import:story-text`) — text is split into Manuscript chapters on headings / blank lines (`window.storyloomSplitStory`, home.js).
- Recent books row and template strip.
- **Not available (labelled cards):** story from a drawing, photo → avatar. Both need a vision AI service (home.js).

### Bookshelf (`renderer/screens/bookshelf.js`, app scope)
- Grid of all books; search; sort: recently edited, oldest, A–Z, Z–A, custom (drag to reorder). Sort choice kept in `localStorage`; custom order kept in `profile.json` (`bookOrder`) so it survives restart.
- Shelves sidebar: create, rename, delete (books are kept), add/remove books (`shelves:list`/`shelves:save`).
- Per-book ⋯ / right-click menu: open, rename, duplicate, add to shelf, convert to coloring book (PRD-008), move to Trash.
- Title of the all-books view is the author's name ("<Author>'s bookshelf", from `profile.json`), else "Your bookshelf".
- **Not available:** "Share online" — needs a Storyloom web service, which doesn't exist yet; the dialog suggests exporting a PDF or EPUB instead.

### Look (`renderer/theme.css`, see `DESIGN.md`)
Lavender/purple palette (paper #f4f0fa, ink #2c2458, main buttons #2a2158, lilac sky gradient), Rockwell display headings (Georgia fallback), Home drawn as an open notebook page with a margin rule, and books standing on a wooden shelf (#b07a45). `theme.css` loads last and restyles each screen.

## Acceptance criteria (as verified)
- [x] `selftest/home.cjs`, `selftest/bookshelf.cjs` drive these with real mouse/keyboard input.

## Related
- [PRD-001 storage](../prd-001-book-storage-data-model/prd-001-book-storage-data-model-index.md) · [PRD-003 story builder](../prd-003-story-builder-character-library/prd-003-story-builder-character-library-index.md)
