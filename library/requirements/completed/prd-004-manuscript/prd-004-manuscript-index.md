# PRD-004: Manuscript *(Retroactive)*

> **Status:** Shipped
> **Priority:** - *(retroactive - work is done)*
> **Written:** October 2026
> **Retroactive:** Yes - this PRD was written after implementation.

---

## What was built

`renderer/screens/manuscript.js` (book scope):

- Chapter list: add, rename, reorder, delete.
- `contenteditable` editor whose content is converted to **structured blocks** (paragraph, heading, subheading, quote, list item; runs with bold / italic / underline). Toolbar plus ⌘B/⌘I/⌘U; paste is plain text. HTML is never saved (manuscript.js:3, storage `sanitizeBlock`).
- Live word count with a per-chapter limit by reading level (manuscript.js:5). Typing past the limit is blocked with a notice; a session-only override allows longer text (`allowLonger`, manuscript.js:11).
- Title / author areas.
- **Write / rewrite chapter with AI** (needs AI writing service) → `ai:chapter` → `generateChapter` (main.cjs:316).
- **Lay out into pages** → creates/updates Designer pages from chapters, page font size by reading level; warns before replacing existing page text.

## Acceptance criteria (as verified)
- [x] `selftest/manuscript.cjs`.

## Related
- [PRD-003](../prd-003-story-builder-character-library/prd-003-story-builder-character-library-index.md) · [PRD-005 designer](../prd-005-designer-page-editor/prd-005-designer-page-editor-index.md)
