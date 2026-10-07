# Storyloom ↔ Scrively feature parity

Storyloom is an original picture-book app that runs entirely on this Mac. Scrively 2.1.25's recovered code was used only as a reference for *what* features exist. No Scrively code, templates, artwork, music, product names, or interface text was copied.

Status: ✅ built and tested · 🟡 partly built · ⛔ not available (clearly labelled in the app) · ➖ not needed in a local app

"Own key" means the feature needs an AI service chosen on the Account screen. Without one, the feature explains what it needs; everything else still works.

## AI services

| Service | Writing | Pictures | Voices | How it signs in |
| --- | --- | --- | --- | --- |
| Claude plan (Claude Code) | ✅ | — | — | Runs the user's installed, signed-in Claude Code (`claude -p`) with all tools, settings, MCP servers and history switched off. Storyloom never touches the Claude login. |
| ChatGPT plan | ✅ | — | — | OpenAI's official "Sign in with ChatGPT" self-serve flow for open-source local apps (preview): PKCE, verified ID token, `chatgpt.tokens.use.direct`, Responses API with `store:false`. |
| OpenRouter | ✅ | ✅ | ✅ | User's OpenRouter key, encrypted with the Mac keychain. |
| Your own service | ✅ | ✅ | ✅ | Any OpenAI-compatible address and key. |

Automatic model choice (`ai/model-picker.cjs`) picks a model per job from a budget (Best quality / Balanced / Lowest cost):
- **Writing (OpenRouter):** starts from OpenRouter's live usage ranking for creative writing. It ranks by measured quality scores (OpenRouter benchmarks, when a key is saved) and applies a price cap per budget. It skips routers, models about to be retired, models with too little context, free (rate-limited) models and non-text models. Non-English books favour models also popular for translation. Two backup models are sent so a busy model doesn't fail the job. Simple jobs (coloring captions) drop one budget step.
- **Pictures / coloring pages / voices (OpenRouter):** per-budget model families matched against OpenRouter's live lists. Line-art models are used for coloring pages, vector-only models are skipped, and a voice the model actually has is chosen.
- **Claude / ChatGPT plans:** Opus/Sonnet/Haiku by job and budget; ChatGPT uses the account's own model list in OpenAI's order.
- Any job can be pinned to a specific model.

## Matrix

| Scrively feature | Storyloom | Notes |
| --- | --- | --- |
| Login, signup, password reset, recovery codes | ➖ | No account. The Account screen says so. |
| Server-down page, auto-updater, changelog, telemetry, agreement modal | ➖ | Nothing runs on a server. |
| Home: prompt box, quick ideas, star of the story | ✅ | Opens the Story builder prefilled. |
| Home: import a story file | ✅ | `.txt` / `.md`, split into Manuscript chapters. |
| Home: story from a drawing, photo → avatar | ⛔ | Needs a vision AI service. Shown as unavailable cards. |
| Bookshelf: grid, open, delete | ✅ | Delete moves the book to the Trash. |
| Bookshelf: search, sort, rename, duplicate, ⋯ menu, drag to reorder | ✅ | Custom order survives a restart. |
| Bookshelf: shelves (create, rename, delete, add/remove books) | ✅ | Deleting a shelf keeps its books. |
| Bookshelf: public share link | ⛔ | Labelled "Share online" → not available. |
| Story builder: title, author, genre, styles, place, era, extras, language, reading level, length | ✅ | Validation shows missing fields. |
| Story builder: characters + reusable character library | ✅ | Photo from file. Portrait generation needs own key. |
| Story builder: template, illustration style, page size, cover preview | ✅ | Live preview. |
| Story builder: write the story | ✅ own key | "Start with an outline" works offline. |
| Manuscript: chapters, rich text, title/author | ✅ | Text stored as structured blocks, never raw HTML. |
| Manuscript: word limit per reading level | ✅ | Blocks typing past the limit, with a notice and an override. |
| Manuscript: AI write/rewrite chapter | ✅ own key | |
| Manuscript → designer pages | ✅ | Warns before replacing page text. |
| Designer: pages, text, shapes, stickers, pictures, frames, layers, undo, drag/resize/rotate | ✅ | |
| Designer: image crop | ✅ | Free, square, 4:3, 3:4, 16:9. |
| Designer: AI page illustration | ✅ own key | "Generate a picture" in the Pictures drawer. |
| Designer: image upscale | ⛔ | Labelled as not available. |
| Templates catalogue + premade books | ✅ | 12 original themes, 4 original starter books, preview, use or apply. |
| Studio: per-page voice recording | ✅ | Record, play, re-record, delete, import. |
| Studio: AI voice narration | ✅ own key | Per page or all pages. |
| Studio: background music | ✅ | User's own files (volume, loop). No bundled music library. |
| Studio: interactive sound buttons | ✅ | Emoji, numbers, and letters; each plays an assigned sound. |
| Studio: read-along player | ✅ | Full screen, page turns, narration + music, tappable sounds. |
| Studio: publish to online bookshelf | ⛔ | Labelled as not available. |
| Coloring: book → coloring book | ✅ | Local line-art filter (edge detection), not AI. |
| Coloring: idea → coloring book | ✅ own key | |
| Coloring: paint (fill, brush, eraser, undo, save) | ✅ | |
| Coloring: unlock / purchase | ➖ | Free. |
| Export: PDF for screens | ✅ | |
| Export: PDF for printing (0.125 in bleed, page-count warning) | ✅ | |
| Export: EPUB 3 | ✅ | Fixed layout, nav, images, ISBN metadata. |
| Export: audiobook WAV | ✅ | Narration + music mixed. |
| Export: audiobook MP3 | ⛔ | No MP3 encoder bundled. Labelled; suggests converting the WAV. |
| ISBN + copyright page | ✅ | Validated ISBN; optional copyright page in the PDF. |
| Print ordering, addresses, order list | ⛔ | Orders screen explains this and offers a print-ready PDF export. |
| Account: name, usage, credits, purchases, password | 🟡 | Default author name, AI service settings, data folder, version. Credits, purchases, and passwords aren't needed. |

## How this was verified

- `npm test`: 30 unit tests pass. They cover storage, sanitizing, file sniffing, the EPUB/zip writer, the model picker, the ChatGPT sign-in (registration, refresh rotation, sign-out revocation, and rejection of tampered identity tokens), OpenRouter, and the locked-down Claude Code call.
- `npm run self-test`: the full run drives every screen with real mouse and keyboard events. It also visits every sidebar item and book tab and checks none shows the "isn't built yet" placeholder. All modules pass. Screenshots are in `verification/`.
- `npm run package`: builds an unsigned `releases/Storyloom-darwin-x64/Storyloom.app`. The built app launched and stayed running.

## Known limits

- AI features were tested only against local fake services (OpenRouter, ChatGPT sign-in and API, and a stand-in `claude` program), never real accounts.
- ChatGPT plan use in other apps is an OpenAI preview; it covers writing only. Claude plans are meant for personal use; anyone building a product on Storyloom should use an API key.
- The line-art filter's quality depends on the picture.
- The app is unsigned. macOS may ask for confirmation the first time it opens.
