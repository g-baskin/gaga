# PRD-008: Coloring — Line-art Conversion & Painting *(Retroactive)*

> **Status:** Shipped
> **Priority:** - *(retroactive - work is done)*
> **Written:** October 2026
> **Retroactive:** Yes - this PRD was written after implementation.

---

## What was built

`renderer/screens/coloring.js` (app scope + painting view).

- **Book → coloring book:** `convertToColoringBook` (coloring.js:~95) duplicates the book with `kind: 'coloring'` and title "(coloring)", then converts every page picture and image element with a **local line-art filter**: grayscale → 3×3 blur → Sobel edge magnitude → threshold 48 (coloring.js:14-46). Not AI. Backgrounds become white, text and shape outlines dark ink, shape fills cleared. Quality depends on the picture.
- **Idea → coloring book** (needs AI writing + picture services): story captions via `ai:generate` with `purpose: 'coloring'` (uses the `captions` job, one budget step cheaper) and line-art pictures via `ai:image` with `lineArt: true`.
- **Paint:** fill (flood up to outlines), brush, eraser, colour palette, undo, save. Outlines are kept on top of brush/eraser strokes (coloring.js:302).
- Unlock/purchase: not needed — free.

## Acceptance criteria (as verified)
- [x] `selftest/coloring.cjs`.

## Related
- [PRD-002 bookshelf](../prd-002-home-bookshelf-shelves/prd-002-home-bookshelf-shelves-index.md) · [PRD-010 AI services](../prd-010-ai-services/prd-010-ai-services-index.md)
