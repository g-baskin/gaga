# Changelog

Everything that changes in Storyloom is listed here, newest first. Each released version also appears on the
[GitHub releases page](https://github.com/g-baskin/gaga/releases), with the Mac downloads attached.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). New changes go under **Unreleased** until the next release.

## [Unreleased]

### Changed

- Account → About links to a short privacy note (also in the README and FAQ) listing exactly what leaves your Mac. Nothing is sent to Storyloom's makers.
- Illustrate the whole book now says that character portraits are sent to your picture service with each page's description.
- Storyloom.app now includes Electron's and Chromium's licence notices.
- Updated the built-in Electron runtime to 44.7.0, which includes the latest Chromium and V8 security fixes.

### Added

- **Illustrate the whole book** (Designer → Pictures): Storyloom plans a picture for every page from its words, then draws them one at a time, with progress and a Stop button. Choose pages without a picture, or every picture page.
- Characters look the same on every page: their Story builder portraits are sent as reference pictures with OpenRouter and fal.ai.
- **Redraw this picture** on pages drawn by AI, using the same description, with no retyping.
- AI pictures now match the book's shape (square, portrait, or landscape) when the picture model supports it.

### Fixed

- The last beige and peach leftovers from the old colour scheme (the Designer canvas, cover previews, layout icons, hover colours, and the toast's action link) now match the lavender theme, and text sizes, spacing, and corners follow one consistent scale.
- Chapters written with AI and stories you import now read text the same way: `###` subheadings no longer show up as literal hash marks, and lines that wrap inside a paragraph stay one paragraph.
- When a save fails because the disk is full, read-only, or Storyloom isn't allowed to write there, you now get a plain explanation instead of a technical error with a file path, and no leftover temporary files.
- If your settings, profile, shelves, or character library file is ever damaged, Storyloom now keeps the damaged copy, tells you where it is, and starts fresh, instead of quietly replacing it on the next save.
- If your books can't be loaded, screens now say so and offer **Try again**, instead of going blank or claiming you have no books yet. Screens show "Loading…" while they read your library.
- Making a coloring book from a story no longer freezes the window while each picture turns into line art, and painting a coloring page uses far less memory for Undo.
- Home, Bookshelf, and the other library screens open faster in big libraries: books you haven't changed aren't re-read each time.
- On the Bookshelf, in Custom order, a book's ⋯ menu now has **Move earlier** and **Move later**, so you can arrange books without dragging. Keyboard focus is now clearly outlined in that menu and in text fields.
- Storyloom can no longer be started as a plain script runner or with a debugger attached, which keeps other programs on your Mac from using it to read your saved AI keys. The Claude Code location in Account must now point to the `claude` program itself.
- If a book's saved file is damaged, Storyloom now tells you which folder it's in instead of quietly leaving it out of your library. Saves are written all the way to disk before replacing the old copy, so a power cut can't leave a book empty.
- A full character library (500 characters) now says so instead of quietly removing your oldest character to make room.
- If Storyloom's window crashes or freezes, it now offers to reload instead of staying blank. Unexpected errors are saved in a log on your Mac, which you can open from **Account → Open log folder** to attach to a bug report. The log is never sent anywhere.
- The Story builder's cover preview no longer gets cut off at the right edge when the window is at its smallest size.

## [0.6.1] - 2026-10-07

### Fixed

- Pages with more words than fit no longer get cut off at the bottom. The words shrink to fit (down to a readable size) on screen, in PDFs, and in e-books, and the Designer shows "Shrunk to 18 pt so all the words fit". If the words still don't fit, it says so.
- E-books tell e-readers which characters each font file covers, so stricter readers use the right font instead of a fallback.

## [0.6.0] - 2026-10-07

### Added

- 17 free fonts included with Storyloom, for 21 in all: easy-reading fonts for young readers, book fonts, bold title fonts, and handwriting. Font menus group them by kind and show each name in its own font.
- 12 new page themes, for 24 in all, including a new **Animals** category, and 3 new starter books.
- Every theme now pairs a title font with a body font, and cover pages can have their own **Title font**.
- **Templates → Fonts** shows every font with a sample, and search finds fonts by name.

### Changed

- PDFs wait until every font in the book has loaded, so no page prints in a stand-in font.
- E-books now carry the fonts they use, so they look the same on any reader.

### Fixed

- If Storyloom can't close to install an update, it now says so and cleans up the download, instead of showing "Installing…" until you restart it.
- The export option now says the copyright page is added to PDFs and e-books, which is what it does.

## [0.5.0] - 2026-10-07

### Added

- Storyloom can now update itself. When a new version is out, click **Download update** in the sidebar or in **Account → Updates**, then **Restart to update**. Updates are checked against Storyloom's signature before they install.
- **Account → Updates**, with **Check for updates** and a switch for the automatic check when Storyloom opens.
- A README, and Storyloom is now open source under the GNU AGPL v3. Account → About links to the source code.

### Changed

- Wording across the app no longer says Storyloom is offline-only. Your books are saved on your Mac, and AI features use the online services you connect.

## [0.4.0] - 2026-10-07

### Added

- The version number now shows at the bottom of the sidebar on every screen, so you can tell which Storyloom you're running.
- When a newer version is out, a notice under the version number links to its download page. Storyloom checks GitHub once when it opens; you can turn this off in Account → About.

## [0.3.0] - 2026-10-07

### Added

- `npm run preview`, which opens Storyloom's screens in a browser at http://127.0.0.1:4173 with a sample library, so the look can be checked without building the app.

### Changed

- A new picture-book look: a soft lavender sky, deep purple buttons, a slab-serif headline type, and books standing on a wooden shelf.
- The Home page is now an open notebook page with "Start writing", and long story ideas wrap instead of being cut off.
- The bookshelf title uses your author name, such as "Kelly's bookshelf".

## [0.2.0] - 2026-10-07

### Added

- fal.ai for AI pictures: paste a fal.ai key, and Storyloom picks a picture model from fal.ai's live list to match your budget (Best quality, Balanced, or Lowest cost), with a clean line-art model for coloring pages.

### Changed

- Download file names now say which Mac they're for: "Intel" or "Apple-Silicon".
- The cover preview in the Story builder updates as you type and edit characters, including a new portrait before you save, and now shows where the story is set and who's in it.
- Drawing a portrait or generating a picture now says who draws it and who pays. Claude and ChatGPT plans write your stories; pictures come from OpenRouter, fal.ai, or your own AI service. (ChatGPT can draw in its own app, but OpenAI doesn't let other apps use your plan for pictures yet.) The button is turned off, with directions, until pictures are set up.

### Fixed

- The cover preview no longer shows the word "null" when a story has no writing style.

## [0.1.0] - 2026-10-07

### Added

- Picture books you make entirely on your Mac: a home screen with story ideas, a bookshelf with shelves, search, sorting and drag-to-arrange, and a trash for deleted books.
- Story builder with characters you can save to a reusable character library, and a cover preview.
- Manuscript editor with chapters, headings, bold, italic and underline, and word limits matched to the reading level.
- Page designer with text, shapes, stickers, pictures, frames, layers, cropping, rotation, and undo.
- 12 page themes and 4 starter books.
- Studio for recording narration, adding background music and tap-to-play sound buttons, and a full-screen read-along player.
- Coloring books: turn any book into outline pages locally, or make one from an idea, then paint with fill, brush and eraser.
- Export to PDF for screens, PDF for printing (with bleed), EPUB 3 e-books, and WAV audiobooks, with an optional ISBN and copyright page.
- AI writing with your own Claude plan (through Claude Code on your Mac), your ChatGPT plan ("Continue with ChatGPT"), OpenRouter, or any OpenAI-compatible service.
- Automatic model choice for OpenRouter: pick Best quality, Balanced, or Lowest cost, and Storyloom picks a model for each job from OpenRouter's live usage rankings and quality scores, with backup models.
- AI pictures, coloring pages, and narration voices through OpenRouter or your own service.
- Downloads for both Intel Macs and Apple Silicon Macs.
- Project documentation and a code wiki in `library/`.

### Fixed

- Exporting an EPUB no longer fails when a page refers to a picture that was deleted; the missing picture is skipped.
- Narration voices whose names contain a colon (such as OpenRouter's `en-US-Nova:MAI`) are no longer lost when a book is saved.
- Saving several settings at once no longer risks losing one of the changes.
- An ISBN is only stored if its check digit is correct.

[Unreleased]: https://github.com/g-baskin/gaga/compare/v0.6.1...HEAD
[0.6.1]: https://github.com/g-baskin/gaga/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/g-baskin/gaga/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/g-baskin/gaga/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/g-baskin/gaga/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/g-baskin/gaga/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/g-baskin/gaga/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/g-baskin/gaga/releases/tag/v0.1.0
