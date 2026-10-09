---
ai_description: |
  Source-grounded user workflow across Storyloom's book and app screens.
human_description: |
  Start a book, design its pages, add sound and export a copy to share.
---

# Make a book in Storyloom

You can write, design, record and export without connecting AI. Books save on this Mac; exports do not replace your editable project. See [Connecting AI](connecting-ai.md) only if you want generated text, pictures or voices.

## 1. Start and organize

On **Home**, enter an idea and optional main character, choose **Blank book**, import a `.txt`/`.md` story, or browse **Templates**. Starting from an idea opens the Story builder; it does not immediately buy an AI generation. Imported text becomes Manuscript chapters, not finished designed pages. Use UTF-8 text files no larger than 2 MB; Markdown headings can separate chapters.

**Templates** previews page themes and starter books. Applying a theme to an existing story changes colors, lettering, frames and theme decorations while retaining your words, pictures and own stickers. **Bookshelf** provides search, sorting, custom order and shelves; rename, duplicate or delete there. Deletion sends the book folder to macOS Trash. **Account** stores the author name used for new books; it is not a Storyloom online account.

## 2. Plan and write

In **Story builder**, set the idea, characters, reader level, length, language and look. A character portrait can be imported and saved to the reusable character library. Use **Start with an outline** for manual writing or **Write the story with AI** for the connected writing service. Replacing an existing manuscript asks for confirmation.

In **Manuscript**, edit and reorder chapters, format text and watch word guidance. AI rewriting replaces the selected chapter only after confirmation when it already has text. **Lay out into pages** copies chapter text into pages after the cover, preserving existing pictures, layouts and decorations. Chapters and Designer page text are separate: later manuscript edits do not automatically update designed pages. Review any replacement prompt before laying out again.

## 3. Design and illustrate

**Designer** lets you change page layout, text, fonts, colors and frames, and add text boxes, pictures, shapes and stickers. Select an object to edit its properties/layer, move, resize or rotate it; use undo/redo for Designer edits. Crop changes the visible area without overwriting the original picture. Watch text-fit warnings and inspect pages before export.

Import PNG, JPEG, WebP or GIF pictures up to 25 MB. Optional AI pictures use the separately configured picture service and its credit. **Illustrate the book** uses the writing service to plan scenes, then draws image-layout pages one at a time; it skips the cover and text-only pages. It can use up to four character portraits on supported providers. Stopping lets the current request finish; completed pictures remain saved.

**Coloring** can convert an existing story with a local line-art filter or use optional AI line art. Conversion quality depends on the original picture; it is not an AI redraw. The painting tools work locally; choose **Save colored page** to keep your painted result.

## 4. Add sound

In **Studio**, record, import or generate narration for each page. Microphone recording needs macOS permission. Imported sounds can be WAV, MP3, M4A, OGG or WebM up to 100 MB. Add your own background music, adjust its volume/looping, or add tappable sound buttons and position them in Designer.

Use the full-screen read-along inside Storyloom to hear narration/music and tap sound buttons. Storyloom does not host this player online. AI narration needs OpenRouter or your custom speech service, not just a Claude/ChatGPT writing sign-in.

## 5. Export

| Export choice | What to expect |
|---|---|
| PDF for screens | Static pages for viewing/sharing |
| PDF for printing | Adds 0.125-inch bleed on every edge; check the printer's trim, page-count and file requirements yourself |
| EPUB 3 | Fixed-layout pages and referenced pictures/bundled fonts, not a reflowable novel or the interactive read-along |
| Audiobook (WAV) | Existing narration in page order, short pauses and optional background music; pages without narration are omitted |

The WAV is a stereo 44.1 kHz, 16-bit mix with 0.6-second gaps between narration clips. Sound-button effects are not automatically mixed into it. PDFs/EPUBs do not carry Studio narration or tappable audio. MP3 export, online publishing and print ordering are unavailable; convert the WAV externally or submit a print PDF to your chosen printer.

An optional copyright page is added to PDF/EPUB output without changing book pages. ISBN validation checks formatting/check digits; Storyloom does not issue or register an ISBN. After export, use **Show in Finder** to locate the file.

## Saving and recovery

Wait for **All changes saved** before quitting. **Not saved** means a write failed; resolve the error rather than assuming the work is safe. Account can open the data folder and reveal the local log. Back up the complete data folder with the app closed; publication exports are not editable backups. A crash/reload may lose the last unsaved edit.

## Implementation references

- `renderer/screens/home.js`, `bookshelf.js`, `templates.js`, `account.js`; `renderer/app.js` (`scheduleSave`, `saveNow`).
- `renderer/screens/story-builder.js` (`startOutline`, `writeWithAi`), `manuscript.js` (`layOut`).
- `renderer/editor.js`, `renderer/designer/`, `renderer/screens/crop.js`, `illustrate.js`, `coloring.js`; `renderer/line-art.js`.
- `renderer/screens/studio.js` (`openReadAlong`), `export.js` (`buildEpubInput`, `wav`), `renderer/designer/pages.js` (`exportPdf`), `main/export.cjs`, `storage.cjs`.
