# PRD-009: Export — PDF, Print PDF, EPUB 3, WAV & ISBN *(Retroactive)*

> **Status:** Shipped
> **Priority:** - *(retroactive - work is done)*
> **Written:** October 2026
> **Retroactive:** Yes - this PRD was written after implementation.

---

## What was built

`renderer/screens/export.js` (book scope), `renderer/editor.js` `exportPdf` (editor.js:943), `epub.cjs`, and IPC handlers in `main.cjs`.

| Output | How | Status |
|---|---|---|
| PDF for screens | Renderer builds print pages; main calls `webContents.printToPDF` (CSS page size, no margins) → `books:export-pdf` | ✅ |
| PDF for printing | Same, `mode: 'print'` adds 0.125 in bleed each edge (`print-bleed` class); warns under 24 pages (export.js:277) | ✅ |
| EPUB 3 | Renderer serializes pages to escaped XHTML + CSS (`buildEpubInput`, export.js:157); main validates (no scripts / handlers / `javascript:`, CSS may only reference `images/`), packages only referenced book images, cover first; a referenced picture that no longer exists is skipped and its references removed instead of failing the export (`collectImages`, epub.cjs); `epub.cjs` writes a fixed-layout EPUB 3 zip (mimetype stored first, nav, OPF with ISBN metadata) | ✅ |
| Audiobook WAV | `OfflineAudioContext` at 44.1 kHz stereo mixes narration in page order with looping music (export.js:177-230), encodes 16-bit PCM; main checks RIFF/WAVE header (≤1 GB) | ✅ |
| Audiobook MP3 | — | ⛔ Not available: no MP3 encoder bundled; labelled, suggests converting the WAV (export.js:295) |
| Print ordering | `renderer/screens/orders.js` | ⛔ Not available: explains this and offers print-ready PDF |

- **ISBN:** validated in the UI with ISBN-10 / ISBN-13 check digits (export.js:10-25); storage also checks the check digit and drops anything that is not a real ISBN-10/13 (`isValidIsbn`, storage.cjs).
- **Copyright page:** optional (title, author, year, ISBN); added temporarily to exported PDF/EPUB only — the book is saved first and never changed (export.js:45-52).
- Save location chosen via native dialog; "Show in Finder" uses `books:reveal-export`.

## Acceptance criteria (as verified)
- [x] `test/epub.test.cjs` (3 tests), `selftest/export-orders-account.cjs`.

## Related
- [PRD-005 designer](../prd-005-designer-page-editor/prd-005-designer-page-editor-index.md) · [PRD-007 studio](../prd-007-studio-audio-read-along/prd-007-studio-audio-read-along-index.md)
