# PRD-007: Studio — Narration, Music, Sound Buttons & Read-along *(Retroactive)*

> **Status:** Shipped
> **Priority:** - *(retroactive - work is done)*
> **Written:** October 2026
> **Retroactive:** Yes - this PRD was written after implementation.

---

## What was built

`renderer/screens/studio.js` (book scope). Everything is saved in `book.audio` (see PRD-001) and in the book's `assets/` folder.

- **Per-page voice recording:** microphone via `MediaRecorder` (`audio/webm`, studio.js). Play, re-record, delete, or import a file (`audio:import`, file-sniffed). Microphone permission is granted only for audio, only for the app's own page (main.cjs).
- **AI voice narration** (needs an AI voice service: your own service or OpenRouter): per page or "Narrate all pages" (asks before replacing existing narration, studio.js). Uses `ai:speech` → `generateSpeech` (main.cjs).
- **Background music:** the user's own file (WAV/MP3/M4A/OGG/WebM), volume, loop, preview. No bundled music library (studio.js).
- **Sound buttons:** designer `sound` elements (emoji, numbers, letters), each with an assigned sound; tappable in the read-along.
- **Read-along player:** full screen, page turns, narration + music; pages without narration advance after 4 s (studio.js).
- **Not available:** publish to an online bookshelf (studio.js, labelled).

## Acceptance criteria (as verified)
- [x] `selftest/studio.cjs` (uses Chromium's fake microphone, main.cjs).

## Related
- [PRD-009 export (WAV mix)](../prd-009-export/prd-009-export-index.md) · [PRD-010 AI services](../prd-010-ai-services/prd-010-ai-services-index.md)
