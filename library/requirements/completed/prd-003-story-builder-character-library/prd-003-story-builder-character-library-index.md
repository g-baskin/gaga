# PRD-003: Story Builder & Character Library *(Retroactive)*

> **Status:** Shipped
> **Priority:** - *(retroactive - work is done)*
> **Written:** October 2026
> **Retroactive:** Yes - this PRD was written after implementation.

---

## What was built

`renderer/screens/story-builder.js` (book scope) — a single scrolling page of cards that fills `book.builder`:

- Title / author (author defaults from `profile.json`).
- Characters: add / edit / delete, photo from file, save to and insert from the **reusable character library** (`characters:*` IPC → `characters.json` + `characters/` media). Portrait generation needs an AI picture service (OpenRouter, fal.ai, or the author's own API service; Claude and ChatGPT plans don't draw in Storyloom). The character dialog explains who draws and who pays, and disables **Draw a portrait with AI** until pictures are set up (`aiPictureNote` in renderer/app.js; the Designer's **Generate a picture** dialog uses the same note).
- Details: genre, writing styles (multi-select), place, era, extras, language.
- Reading level (4 levels, ages 2–10) and length (tiny/short/medium/long → 8/12/18/24 pages, main.cjs LENGTH_PAGES).
- Template, illustration style, page size, live cover preview. The preview redraws on every change (batched per change), shows the setting (place, era) and the cast, and follows unsaved edits in an open character dialog, such as a newly chosen or drawn portrait; cancelling reverts it.
- Validation lists missing fields.

Actions:
- **Write the story** (needs AI writing service) → `ai:generate` → `generateStory` (main.cjs:286) returns JSON chapters which become Manuscript chapters.
- **Start with an outline** — offline; creates empty chapters with prompts.

Word limits per reading level are shared with the Manuscript via `window.STORYLOOM_WORD_LIMITS` (40/80/150/300), with a fallback copy in story-builder.js:5.

## Acceptance criteria (as verified)
- [x] `selftest/story-builder.cjs`; AI path exercised only against the local mock service.

## Related
- [PRD-004 manuscript](../prd-004-manuscript/prd-004-manuscript-index.md) · [PRD-010 AI services](../prd-010-ai-services/prd-010-ai-services-index.md)
