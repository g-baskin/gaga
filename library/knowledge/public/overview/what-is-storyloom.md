# What is Storyloom?

Storyloom is a Mac app for writing, illustrating, narrating, and exporting children's picture books. Your books are saved on your Mac — no account needed. Optional AI features use online services you connect. Storyloom is free and open source (GNU AGPL v3) and updates itself from inside the app.

## What you can do
- **Start a story** from an idea on Home, or import a `.txt`/`.md` file.
- **Plan it** in the Story builder: characters (with a reusable character library), genre, place, reading level, length, template, page size.
- **Write it** in the Manuscript, with word limits that fit the reader's age.
- **Design pages** in the Designer: text, shapes, stickers, pictures, frames, layers, nondestructive crop and text-fit guidance. Optional whole-book illustration plans and draws picture pages with your connected services.
- **Start from templates**: 24 themes and 7 starter books, plus 21 fonts to choose from.
- **Add sound** in the Studio: record your voice, add your own music, tappable sound buttons, and a full-screen read-along.
- **Make coloring books** from any book, then paint them.
- **Stay up to date**: the version is shown at the bottom of the sidebar; a notice appears there when an update is available, and Account → Updates checks, downloads, and installs it.
- **Export** as PDF (screen or print with bleed), EPUB 3, or a narrated WAV audiobook, with an optional ISBN and copyright page.

## Start here

Follow [Make a book](../guides/making-a-book.md) for every screen, narration and export choices, or [Connecting AI](../guides/connecting-ai.md) for provider setup. The [FAQ](../faqs/storyloom-faq.md) covers updates, backups and common limits.

Manuscript chapters and Designer page text are separate: use **Lay out into pages** to transfer chapter changes. Studio's read-along and sound buttons play inside Storyloom; PDF/EPUB export does not include that interactive audio. WAV export mixes recorded/generated narration with optional music, not sound-button effects.

## Optional AI
Connect one of: your Claude plan (through Claude Code installed on your Mac), your ChatGPT plan (Sign in with ChatGPT), OpenRouter, or any OpenAI-compatible service. Claude and ChatGPT plans cover writing in Storyloom; pictures come from OpenRouter, fal.ai, or your own service, and voices from OpenRouter or your own service. (ChatGPT can draw pictures in its own app, but OpenAI doesn't let other apps use your plan for pictures yet.) Storyloom can pick a model for each job based on your budget. Without AI, everything else still works. Before you draw, Storyloom tells you which service draws the pictures and that it is charged to that service's credit.

## Not available
MP3 audiobooks (export WAV and convert it), print ordering (export a print PDF and check your printer's requirements), online sharing/publishing, picture upscaling, and stories from a drawing or photo.

Implementation references: `renderer/app.js` (`APP_NAV`, `BOOK_TABS`), `renderer/screens/`, `renderer/designer/`, `main/ai-services.cjs`, `main/export.cjs`, `main/updates.cjs`.
