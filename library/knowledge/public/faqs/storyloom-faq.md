# Storyloom FAQ

**Do I need an account?** No. Storyloom has no sign-up. Your books stay in a folder on your Mac (Account → open data folder).

**Does it need the internet?** Your books are saved on your Mac, and writing, designing, recording, and exporting work without AI. AI writing, pictures, and voices use online services you connect (your Claude or ChatGPT plan, OpenRouter, fal.ai, or your own service). Update checks also go online to GitHub; you can turn the automatic check off in Account → Updates.

**What does Storyloom send, and to whom?** Nothing to us: there's no analytics, tracking, or account. AI features send what they need (story text, picture descriptions, and character portraits when you draw pictures with characters) to the AI service you chose, under that service's privacy policy. Update checks go to GitHub. The README's Privacy section lists everything.

**How do I update?** When a new version is out, a notice appears at the bottom of the sidebar, or use Account → Updates → Check for updates. Click Download update, then Restart to update. Only updates signed by Storyloom's release key install. Keep Storyloom in your Applications folder so it can update itself.

**Which download is mine?** `Storyloom_<version>_Apple-Silicon_arm64.dmg` for M1 and newer, `Storyloom_<version>_Intel_x64.dmg` for Intel Macs (Apple menu → About This Mac).

**Is Storyloom open source?** Yes, under the GNU AGPL v3. Account → About has a link to the source code.

**Where are my API keys kept?** Encrypted with your Mac's keychain. The app's pages never see them.

**I deleted a book by mistake.** Deleted books go to the macOS Trash.

**How do I back up editable books?** Close Storyloom and copy its entire data folder, including assets and supporting files. PDF, EPUB and WAV are published copies, not editable project backups. Provider connections may need setting up again on another Mac.

**Why didn't a Manuscript edit change my designed page?** Chapters and page text are separate. Use **Lay out into pages** to transfer text and review the replacement prompt. Existing page pictures and layouts are retained.

**Does an EPUB include my read-along?** No. EPUB exports fixed-layout pages, pictures and bundled fonts, not Studio narration or tappable sounds. Use the in-app read-along, or export WAV narration with background music separately.

**Does a Claude or ChatGPT sign-in pay for pictures and voices?** No. Those use separate provider settings and credit. See [Connecting AI](../guides/connecting-ai.md).

**What does “Not saved” mean?** A disk write failed. Resolve the error before quitting; closing or reloading is not proof the last edit was saved. Account → Open log folder shows local diagnostics; review a log before sharing it.

**Can I export MP3?** Not yet — export WAV and convert it in Music or QuickTime Player.

**Can I order printed copies?** Not from Storyloom. Export a print PDF (0.125 in bleed) and use any print service; many need at least 24 pages.

**Is the coloring-book conversion AI?** No, it's a local edge-detection filter; results depend on the picture.

**Where do I start?** Follow [Make a book](../guides/making-a-book.md) from Home through Export.

**macOS warns when I open it.** Storyloom isn't notarized by Apple yet; click Open Anyway once in System Settings → Privacy & Security. In-app updates still verify Storyloom's signed update manifest; Gatekeeper approval is not Apple notarization.

Implementation references: `renderer/screens/account.js`, `manuscript.js` (`layOut`), `studio.js`, `export.js` (`buildEpubInput`, `wav`); `storage.cjs`; `main/settings.cjs`, `main/ai-services.cjs`, `main/updates.cjs`; `updater.cjs`.
