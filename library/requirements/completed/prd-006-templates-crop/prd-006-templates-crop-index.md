# PRD-006: Templates & Crop *(Retroactive)*

> **Status:** Shipped
> **Priority:** - *(retroactive - work is done)*
> **Written:** October 2026
> **Retroactive:** Yes - this PRD was written after implementation.

---

## What was built

### Template data (`renderer/data/templates.js`)
`window.STORYLOOM_TEMPLATES = { themes, starters, categories, applyTheme, bookFromTemplate }` (templates.js:424). **12 original themes** (cover/page layouts, palette, fonts, frame, decorations built from shapes and stickers) and **4 original starter books**. Decorations are authored for a 612 × 612 pt square page and scaled to the book size; decoration elements are tagged with a `tpl-` prefix so re-applying a theme replaces them.

### Templates screen (`renderer/screens/templates.js`, app scope)
Categories, search, a page-flipping preview modal, **Use this template** (new book) and **Apply to this book**.

### Crop dialog (`renderer/screens/crop.js`)
`window.openCropDialog({bookId, image, crop}, onApply)` (crop.js:12, 152): drag-to-crop with handles and aspect presets Free, Square, 4:3, 3:4, 16:9; returns `{x,y,w,h}` fractions or `null`. `core.js` renders the crop without changing the stored picture.

### Generate a picture
`crop.js` pushes a "Generate a picture" button onto `window.picturesDrawerExtras` (crop.js:189); it calls `ai:image` (needs AI picture service) and places the result with `addImageToPage`. Image upscale is shown as **not available**.

## Acceptance criteria (as verified)
- [x] `selftest/templates.cjs`.

## Related
- [PRD-005](../prd-005-designer-page-editor/prd-005-designer-page-editor-index.md) · [PRD-010](../prd-010-ai-services/prd-010-ai-services-index.md)
