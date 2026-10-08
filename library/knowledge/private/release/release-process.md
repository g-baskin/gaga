---
ai_description: |
  How Storyloom versions and releases are made: CHANGELOG.md + scripts/changelog.mjs,
  dist.mjs builds per-chip .dmg and .app.zip, tag-driven GitHub release workflow that signs latest.json.
human_description: |
  The steps to ship a new Storyloom version and what each file does.
---

# Storyloom Release Process

## Versions and the changelog
- `package.json` `version` is the single source. The app shows it at the foot of the sidebar and in Account → Updates (`app.getVersion()`).
- `CHANGELOG.md` has an `Unreleased` section plus one `## [x.y.z] - YYYY-MM-DD` section per release.
- `scripts/changelog.mjs`:
  - `release <v>` (`npm run release -- <v>`): moves Unreleased into a dated section and sets the app version; refuses older versions.
  - `check <v>`: fails unless `package.json` is `<v>` and the changelog has a non-empty `<v>` section.
  - `notes <v>`: prints that section for the GitHub release notes.

## Building (`npm run dist`, dist.mjs)
- Builds Intel and Apple Silicon apps (`--arch=x64|arm64` for one), ad-hoc signed, not notarized.
- Checks each built app's chip and that its `CFBundleShortVersionString` matches `package.json` (dist.mjs).
- Outputs in `releases/dist/`: `Storyloom_<v>_Intel_x64.dmg`, `Storyloom_<v>_Apple-Silicon_arm64.dmg`, a matching `.app.zip` per chip for the in-app updater, and `SHA256SUMS.txt`.

## Publishing (`.github/workflows/release.yml`)
1. Run `npm run release -- <v>`, commit, then `git tag v<v> && git push origin main v<v>`.
2. The workflow (on `v*` tags, `macos-14`) checks the tag format, that the tag is on `main`, and `changelog.mjs check`.
3. `npm ci`, `npm test`, `npm run dist`.
4. **Sign the in-app updates:** `node scripts/update-manifest.mjs <v>` writes a signed `latest.json` (see [PRD-011](../../../requirements/completed/prd-011-in-app-updates/prd-011-in-app-updates-index.md)). Only this step receives the `STORYLOOM_UPDATE_SIGNING_KEY` secret. The private key lives in that GitHub Actions secret and with the maintainer; it is never committed.
5. `gh release create` with the changelog section as notes and both `.dmg` files, both `.app.zip` files, `latest.json`, and `SHA256SUMS.txt` attached, labelled for Intel or Apple Silicon (M1 and newer).

## License
Storyloom is free and open source under **AGPL-3.0-only** (`LICENSE`, `package.json`). Account → About links to the source code.

Related: [System overview](../architecture/system-overview.md)
