<p align="center">
  <img src="docs/storyloom-banner.jpg" alt="An otter steps out of an open picture book on a wooden shelf, with a golden thread weaving between the books" width="100%">
</p>

# Storyloom

**Make picture books on your Mac: write the story, design the pages, add narration, and export a PDF, e-book, or audiobook.**

Storyloom is a free, open-source Mac app for parents, teachers, and new authors. Your books are saved on your own Mac. When you want help, Storyloom can write stories with your Claude or ChatGPT plan, and draw pictures and read pages aloud with OpenRouter, fal.ai, or your own AI service.

[**Download the latest version**](https://github.com/g-baskin/gaga/releases/latest)

## What you can do

- **Start from one line.** Type an idea, pick a star for the story, and Storyloom sets up the book.
- **Write.** A manuscript editor with chapters and word limits that match the reading level. Ask AI to write or rewrite a chapter, or start from an outline without any AI.
- **Design every page.** Text, shapes, stickers, your own pictures, frames, layers, cropping, and undo. Choose from 21 fonts, and start from 24 page themes or 7 starter books.
- **Add characters.** Describe them once, give them a photo or an AI portrait, and reuse them in other books.
- **Illustrate the whole book in one go.** Storyloom plans a picture for every page and draws them, keeping your characters looking the same from page to page. Redraw any picture you don't like.
- **Make it talk.** Record narration for each page, add background music and tap-to-play sound buttons, then play it back as a full-screen read-along.
- **Make coloring books.** Turn any book into outline pages, or make one from an idea, then paint with fill, brush, and eraser.
- **Export.** PDF for screens, PDF for printing (with bleed), EPUB 3 e-books, and WAV audiobooks, with an optional ISBN and copyright page.
- **Keep it organized.** A bookshelf with shelves, search, sorting, and drag to arrange.

See [FEATURES.md](FEATURES.md) for the full list, including what isn't available yet.

## Install

1. Open the [latest release](https://github.com/g-baskin/gaga/releases/latest) and download the `.dmg` for your Mac:
   - **Apple Silicon** (M1 and newer): `Storyloom_<version>_Apple-Silicon_arm64.dmg`
   - **Intel**: `Storyloom_<version>_Intel_x64.dmg`

   Not sure which? Apple menu → **About This Mac**. "Chip: Apple M…" means Apple Silicon.
2. Open the `.dmg` and drag **Storyloom** into **Applications**.
3. The first time, macOS blocks it because Storyloom isn't notarized by Apple yet. Go to **System Settings → Privacy & Security** and click **Open Anyway**.

## Updates

Storyloom updates itself. When a new version is out, a notice appears at the bottom of the sidebar. You can also go to **Account → Updates** and click **Check for updates**.

Click **Download update**, then **Restart to update**. Storyloom saves your work, installs the new version, and reopens.

Every update is signed when it's released. Storyloom checks that signature, the download's checksum, and the new app's version and chip before anything is installed. It sends nothing about you or your books when it checks. You can turn off the automatic check in **Account → Updates**.

Storyloom needs to be in your **Applications** folder to update itself.

## AI services

AI is optional. Choose services in **Account → AI services**:

| Service | Writing | Pictures | Voices | What you need |
| --- | :-: | :-: | :-: | --- |
| Claude plan | ✓ | | | Claude Pro or Max, and [Claude Code](https://claude.com/product/claude-code) installed and signed in on your Mac |
| ChatGPT plan | ✓ | | | ChatGPT Plus or Pro; click **Continue with ChatGPT** |
| OpenRouter | ✓ | ✓ | ✓ | An [OpenRouter](https://openrouter.ai) key with credit |
| fal.ai | | ✓ | | A [fal.ai](https://fal.ai) key with credit |
| Your own service | ✓ | ✓ | ✓ | Any OpenAI-compatible address, such as [Ollama](https://ollama.com) on your Mac |

ChatGPT can draw pictures in its own app, but OpenAI doesn't yet let other apps use a ChatGPT plan for pictures, so pictures come from OpenRouter, fal.ai, or your own service.

With OpenRouter and fal.ai, pick a budget (**Best quality**, **Balanced**, or **Lowest cost**) and Storyloom chooses a model for each job from the services' live model lists. You can also pin a specific model.

Your keys are encrypted with your Mac's keychain. Your story text is sent only to the services you choose.

## For developers

You need macOS and Node.js 22 or newer.

```sh
git clone https://github.com/g-baskin/gaga.git storyloom
cd storyloom
npm ci
npm start            # run the app
```

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests |
| `npm run test:live` | Optional checks against the real OpenRouter. Needs `OPENROUTER_TEST_API` in `scrively/.env.local`; costs a fraction of a cent |
| `npm run self-test` | Drives every screen of the real app with mouse and keyboard events, against local stand-in services, and saves screenshots to `verification/` |
| `npm run preview` | Opens the screens in a browser at http://127.0.0.1:4173 with sample books |
| `npm run package` | Builds `Storyloom.app` for this Mac in `releases/` |
| `npm run dist` | Builds the Intel and Apple Silicon `.dmg` files and update archives |
| `npm run release -- 1.2.3` | Moves the **Unreleased** notes in [CHANGELOG.md](CHANGELOG.md) into version 1.2.3 and sets the version |

### Releasing

1. Run `npm run release -- 1.2.3`, then commit.
2. Push the commit and a `v1.2.3` tag: `git push origin main v1.2.3`.
3. GitHub Actions checks the version and changelog, runs the tests, builds both Macs' downloads, signs the update, and publishes the release with that version's changelog as its notes.

The release needs one repository secret, `STORYLOOM_UPDATE_SIGNING_KEY`: the Ed25519 private key whose public half is in `updater.cjs` (`TRUSTED_KEYS`). Without it, the release stops before publishing.

### How it's built

- Electron, plain JavaScript, and no front-end framework. Screens live in `renderer/screens/`.
- `main.cjs` owns files, AI requests, and updates; screens reach it only through the small API in `preload.cjs`.
- Books are JSON files with their pictures and recordings, in Storyloom's folder in your Mac's Application Support.
- AI connections are in `ai/`, and the model picker is `ai/model-picker.cjs`.
- Design notes are in [DESIGN.md](DESIGN.md), and deeper documentation in [`library/`](library/).

## Contributing

Issues and pull requests are welcome. Run `npm test` and `npm run self-test` before opening a pull request, and add a line under **Unreleased** in [CHANGELOG.md](CHANGELOG.md) for anything people would notice.

## License

Storyloom is free software under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-only). You can use, change, and share it. If you share a changed version, or let people use a changed version over a network, you must share your changed source code under the same license.

The bundled fonts in `renderer/fonts/` keep their own licenses (SIL Open Font License 1.1 or Apache 2.0); each font's license is in `renderer/fonts/licenses/`. Both allow including the fonts in the app and in the PDFs and e-books you export.
