# Changelog

Everything that changes in Storyloom is listed here, newest first. Each released version also appears on the
[GitHub releases page](https://github.com/g-baskin/gaga/releases), with the Mac downloads attached.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). New changes go under **Unreleased** until the next release.

## [Unreleased]

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

[Unreleased]: https://github.com/g-baskin/gaga/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/g-baskin/gaga/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/g-baskin/gaga/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/g-baskin/gaga/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/g-baskin/gaga/releases/tag/v0.1.0
