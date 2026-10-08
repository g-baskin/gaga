# PRD-005: Designer / Page Editor *(Retroactive)*

> **Status:** Shipped
> **Priority:** - *(retroactive - work is done)*
> **Written:** October 2026
> **Retroactive:** Yes - this PRD was written after implementation.

---

## What was built

The Designer is the book-scoped page editor in `renderer/editor.js`; page rendering is shared from `renderer/core.js` (`renderPage`, `PAGE_PT` sizes) so the editor, previews, PDF print root, templates and read-along all draw pages the same way.

- Pages: add, reorder, delete; layouts cover / image-top / image-left / image-full / text-only / blank; page background, text colour, font (21 choices from `renderer/fonts.js`: 4 Mac fonts plus 17 bundled free fonts, grouped by kind and shown in their own type), a separate **Title font** on cover pages (`titleFont`), alignment, frames (thin, thick, double, dashed, dotted, rounded).
- Elements: text, shapes (rect, rounded, ellipse, triangle, star, burst, heart, cloud, speech, arrow), stickers, pictures, `sound` buttons (PRD-007 Studio). Drag / resize / rotate, layers, lock, opacity.
- Undo / redo via the app menu (main.cjs `buildMenu` sends `menu:action`; the page decides text-field vs designer undo).
- Pictures drawer: import (sniffed, ≤25 MB) and list book images.
- Extension hooks so other screens never edit the editor:
  - `window.openCropDialog(target, onApply)` — Crop button for images (PRD-006).
  - `window.picturesDrawerExtras` — array of `(book) => HTMLElement`; receives `addImageToPage(name)`.
  - `window.openExportDialog()` — Export button (PRD-009).
  - If a hook is missing, a "isn't built yet" toast shows instead of a broken button.
- PDF printing: `exportPdf({mode})` (editor.js) builds `#print-root` (adds `print-bleed` sheets in print mode) and calls `books:export-pdf`.
- Saves on change and on window close (`app:before-close` → `app:close-ready`, 3 s safety timeout, main.cjs).

**Not available:** image upscale (labelled in the Pictures drawer, crop.js).

## Acceptance criteria (as verified)
- [x] `selftest/designer.cjs`: editing checks, crop renders clipped, a test `picturesDrawerExtras` button appears, no `[data-missing-screen]` marker.

## Related
- [PRD-006 templates & crop](../prd-006-templates-crop/prd-006-templates-crop-index.md) · [System overview](../../../knowledge/private/architecture/system-overview.md)
