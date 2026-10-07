# Storyloom features

Storyloom is a Mac app for making picture books. Your books are saved on your Mac; AI writing, pictures, and voices use online services you connect (your Claude or ChatGPT plan, OpenRouter, fal.ai, or your own). Updates install from inside the app.

Status: ✅ built and tested · 🟡 partly built · ⛔ not available yet (clearly labelled in the app) · ➖ not needed

"AI service" means the feature needs a service chosen on the Account screen. Without one, the feature explains what it needs; everything else still works.

## AI services

| Service | Writing | Pictures | Voices | How it signs in |
| --- | --- | --- | --- | --- |
| Claude plan (Claude Code) | ✅ | — | — | Runs the user's installed, signed-in Claude Code (`claude -p`) with all tools, settings, MCP servers and history switched off. Storyloom never touches the Claude login. |
| ChatGPT plan | ✅ | — | — | OpenAI's official "Sign in with ChatGPT" self-serve flow for open-source local apps (preview): PKCE, verified ID token, `chatgpt.tokens.use.direct`, Responses API with `store:false`. |
| OpenRouter | ✅ | ✅ | ✅ | User's OpenRouter key, encrypted with the Mac keychain. |
| fal.ai | — | ✅ | — | User's fal.ai key, encrypted with the Mac keychain. Pictures only. |
| Your own service | ✅ | ✅ | ✅ | Any OpenAI-compatible address and key. |

Automatic model choice (`ai/model-picker.cjs`) picks a model per job from a budget (Best quality / Balanced / Lowest cost):
- **Writing (OpenRouter):** starts from OpenRouter's live usage ranking for creative writing. It ranks by measured quality scores (OpenRouter benchmarks, when a key is saved) and applies a price cap per budget. It skips routers, models about to be retired, models with too little context, free (rate-limited) models and non-text models. Non-English books favour models also popular for translation. Two backup models are sent so a busy model doesn't fail the job. Simple jobs (coloring captions) drop one budget step.
- **Pictures (fal.ai):** reads fal.ai's live text-to-image list and picks a model family per budget (GPT Image / Nano Banana / FLUX schnell today), the newest Recraft for coloring pages, and skips vector, LoRA and inactive models. Each model's published input schema decides which settings are sent (square size, PNG, inline result).
- ChatGPT draws pictures in OpenAI's own apps, but OpenAI's "Sign in with ChatGPT" for other apps doesn't support image generation yet (preview limitations, developers.openai.com/siwc), so the ChatGPT plan only writes here.
- **Pictures / coloring pages / voices (OpenRouter):** per-budget model families matched against OpenRouter's live lists. Line-art models are used for coloring pages, vector-only models are skipped, and a voice the model actually has is chosen.
- **Claude / ChatGPT plans:** Opus/Sonnet/Haiku by job and budget; ChatGPT uses the account's own model list in OpenAI's order.
- Any job can be pinned to a specific model.

## Matrix

| Feature | Status | Notes |
| --- | --- | --- |
| Storyloom account, password, subscription | ➖ | Not needed: books are saved on your Mac. AI services are billed by their own providers. |
| In-app updates | ✅ | Account → Updates and the sidebar: check, download with progress, restart to install. Only updates signed with Storyloom's release key install. |
| Version shown in the app | ✅ | Bottom of the sidebar and Account → Updates. |
| Changelog | ✅ | `CHANGELOG.md`; each GitHub release uses its section as the release notes. |
| Home: prompt box, quick ideas, star of the story | ✅ | Opens the Story builder prefilled. |
| Home: import a story file | ✅ | `.txt` / `.md`, split into Manuscript chapters. |
| Home: story from a drawing, photo → avatar | ⛔ | Needs a vision AI service. Shown as unavailable cards. |
| Bookshelf: grid, open, delete | ✅ | Delete moves the book to the Trash. |
| Bookshelf: search, sort, rename, duplicate, ⋯ menu, drag to reorder | ✅ | Custom order survives a restart. |
| Bookshelf: shelves (create, rename, delete, add/remove books) | ✅ | Deleting a shelf keeps its books. |
| Bookshelf: public share link | ⛔ | Labelled "Share online" → not available. |
| Story builder: title, author, genre, styles, place, era, extras, language, reading level, length | ✅ | Validation shows missing fields. |
| Story builder: characters + reusable character library | ✅ | Photo from file. Portrait drawing needs a picture service. |
| Story builder: template, illustration style, page size, cover preview | ✅ | Live preview. |
| Story builder: write the story | ✅ AI service | "Start with an outline" needs no AI service. |
| Manuscript: chapters, rich text, title/author | ✅ | Text stored as structured blocks, never raw HTML. |
| Manuscript: word limit per reading level | ✅ | Blocks typing past the limit, with a notice and an override. |
| Manuscript: AI write/rewrite chapter | ✅ AI service | |
| Manuscript → designer pages | ✅ | Warns before replacing page text. |
| Designer: pages, text, shapes, stickers, pictures, frames, layers, undo, drag/resize/rotate | ✅ | |
| Designer: image crop | ✅ | Free, square, 4:3, 3:4, 16:9. |
| Designer: AI page illustration | ✅ AI service | "Generate a picture" in the Pictures drawer. |
| Designer: image upscale | ⛔ | Labelled as not available. |
| Templates catalogue + premade books | ✅ | 24 original themes in 7 categories (each with its own title + body font pairing), 7 original starter books, preview, use or apply. |
| Fonts | ✅ | 21 fonts: 4 Mac fonts plus 17 free fonts bundled with the app (easy-reading, book, title, and handwriting). Browse them in Templates → Fonts; pick per page, per text box, and a separate title font on covers. PDFs wait for fonts to load, and e-books carry the fonts they use. |
| Studio: per-page voice recording | ✅ | Record, play, re-record, delete, import. |
| Studio: AI voice narration | ✅ AI service | Per page or all pages. |
| Studio: background music | ✅ | User's own files (volume, loop). No bundled music library. |
| Studio: interactive sound buttons | ✅ | Emoji, numbers, and letters; each plays an assigned sound. |
| Studio: read-along player | ✅ | Full screen, page turns, narration + music, tappable sounds. |
| Studio: publish to online bookshelf | ⛔ | Labelled as not available. |
| Coloring: book → coloring book | ✅ | Local line-art filter (edge detection), not AI. |
| Coloring: idea → coloring book | ✅ AI service | |
| Coloring: paint (fill, brush, eraser, undo, save) | ✅ | |
| Coloring: unlock / purchase | ➖ | Free, no unlock. |
| Export: PDF for screens | ✅ | |
| Export: PDF for printing (0.125 in bleed, page-count warning) | ✅ | |
| Export: EPUB 3 | ✅ | Fixed layout, nav, images, ISBN metadata. |
| Export: audiobook WAV | ✅ | Narration + music mixed. |
| Export: audiobook MP3 | ⛔ | No MP3 encoder bundled. Labelled; suggests converting the WAV. |
| ISBN + copyright page | ✅ | Validated ISBN; optional copyright page in exported PDFs and EPUBs. |
| Print ordering, addresses, order list | ⛔ | Orders screen explains this and offers a print-ready PDF export. |
| Account settings | ✅ | Default author name, AI services, data folder, updates, version, source code link. |

## How this is tested

- `npm test`: unit tests for storage, file checks, the EPUB/zip writer, the model picker, every AI service connection, the changelog tool, and the updater (signature checks, tampered and corrupted downloads, and a real app swap and rollback).
- `npm run self-test`: drives every screen with real mouse and keyboard events, including connecting each AI service and installing an update, against local stand-in services. Screenshots are saved in `verification/`.
- `npm run dist`: builds the Intel and Apple Silicon disk images and update archives, checking each app's chip and version.

## Known limits

- AI features are tested against local stand-in services, not real accounts.
- ChatGPT plan use in other apps is an OpenAI preview and covers writing only. Claude plans are meant for personal use; if you build a product on Storyloom, use an API key.
- The line-art filter's quality depends on the picture.
- The app isn't notarized by Apple, so macOS asks you to confirm the first time it opens. In-app updates keep working after that.
