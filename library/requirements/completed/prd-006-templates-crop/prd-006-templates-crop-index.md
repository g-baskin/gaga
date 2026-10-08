# PRD-006: Templates & Crop *(Retroactive)*

> **Status:** Shipped
> **Priority:** - *(retroactive - work is done)*
> **Written:** October 2026
> **Retroactive:** Yes - this PRD was written after implementation.

---

## What was built

### Template data (`renderer/data/templates.js`)
`window.STORYLOOM_TEMPLATES = { themes, starters, categories, applyTheme, bookFromTemplate }` (templates.js). **24 original themes** in 7 categories (Bedtime, Adventure, Nature, Seasons, Learning, Celebration, Animals), each with a palette, a title font + body font pairing (`titleFont`, `font`), a frame, and decorations built from shapes and stickers, plus **7 original starter books**. `applyTheme` sets both fonts on every page. Decorations are authored for a 612 × 612 pt square page and scaled to the book size; decoration elements are tagged with a `tpl-` prefix so re-applying a theme replaces them.

### Templates screen (`renderer/screens/templates.js`, app scope)
Categories, search, a page-flipping preview modal, **Use this template** (new book) and **Apply to this book**. Each card and preview names its font pairing. A **Fonts** category lists every font with a sample in that font; search also finds fonts by name.

### Crop dialog (`renderer/screens/crop.js`)
`window.openCropDialog({bookId, image, crop}, onApply)` (crop.js): drag-to-crop with handles and aspect presets Free, Square, 4:3, 3:4, 16:9; returns `{x,y,w,h}` fractions or `null`. `core.js` renders the crop without changing the stored picture.

### Generate a picture
`crop.js` pushes a "Generate a picture" button onto `window.picturesDrawerExtras` (crop.js); it calls `ai:image` (needs AI picture service) and places the result with `addImageToPage`. Image upscale is shown as **not available**.

## Acceptance criteria (as verified)
- [x] `selftest/templates.cjs`.

## Related
- [PRD-005](../prd-005-designer-page-editor/prd-005-designer-page-editor-index.md) · [PRD-010](../prd-010-ai-services/prd-010-ai-services-index.md)
