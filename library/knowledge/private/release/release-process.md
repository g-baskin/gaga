---
ai_description: |
  How Storyloom versions and releases are made: CHANGELOG.md + scripts/changelog.mjs,
  dist.mjs builds per-chip .dmg and .app.zip, tag-driven GitHub release workflow that signs latest.json.
human_description: |
  The steps to ship a new Storyloom version and what each file does.
---

# Storyloom Release Process

## Current release boundary

At source baseline `6a7c05c`, `package.json` is **0.7.0**. Release status recorded on 2026-10-08: **v0.7.0 has not been tagged or published**, and the Apple Silicon packaged-app manual check remains pending. A version/changelog entry or a completed implementation PRD is not proof of publication. No build, release, remote mutation or manual app check was performed for this documentation update.

## Versions and the changelog
- `package.json` `version` is the single source. The app shows it at the foot of the sidebar and in Account → Updates (`app.getVersion()`).
- `CHANGELOG.md` has an `Unreleased` section plus one `## [x.y.z] - YYYY-MM-DD` section per release.
- `scripts/changelog.mjs`:
  - `release <v>` (`npm run release -- <v>`): moves Unreleased into a dated section and sets the app and lockfile versions; refuses older versions. It does not commit, tag or push.
  - `check <v>`: fails unless `package.json` is `<v>` and the changelog has a non-empty `<v>` section.
  - `notes <v>`: prints that section for the GitHub release notes.

## Packaging (`package.mjs`)

`npm run package` builds only the current Mac's chip; it is not a two-chip distribution command and takes no `--arch` option. `package.mjs` enforces the shipping allow-list and `DEV_ONLY` exclusions through its packaging filter. Its `lockFuses()` sets and reads back the Electron fuses; `checkRuntimeNotices()` checks that the copied runtime notice files exist. Separately, `scripts/check-package.mjs` checks reachable literal single-quoted local `require()` modules from `main.cjs` and `preload.cjs` (excluding self-tests), scripts/styles referenced by `renderer/index.html`, and absence of `DEV_ONLY` files. It does not verify fuses, runtime notices or the complete shipping allow-list. See [Development and verification](../development/development-and-verification.md).

## Building (`npm run dist`, dist.mjs)
- Builds Intel and Apple Silicon apps (`--arch=x64|arm64` for one), ad-hoc signed, not notarized.
- Checks each built app's chip and that its `CFBundleShortVersionString` matches `package.json` (dist.mjs).
- Clears `releases/dist/` before building; do not treat that directory as durable evidence storage.
- Outputs in `releases/dist/`: `Storyloom_<v>_Intel_x64.dmg`, `Storyloom_<v>_Apple-Silicon_arm64.dmg`, a matching `.app.zip` per chip for the in-app updater, and `SHA256SUMS.txt`.

## Publishing (`.github/workflows/release.yml`)
1. Run `npm run release -- <v>`, commit, then `git tag v<v> && git push origin main v<v>`.
2. The workflow (on `v*` tags, `macos-14`) checks the tag format, that the tag is on `main`, and `changelog.mjs check`.
3. `npm ci`, `npm run lint`, `npm test`, `npm run dist`. The tag workflow does **not** rerun the Electron self-test; the main/PR workflow has a separate required `self-test` job. Check the actual tagged commit's evidence rather than assuming the release job covers it.
4. **Sign the in-app updates:** `node scripts/update-manifest.mjs <v>` writes a signed `latest.json` (see [PRD-011](../../../requirements/completed/prd-011-in-app-updates/prd-011-in-app-updates-index.md)). Only this step receives the `STORYLOOM_UPDATE_SIGNING_KEY` secret. The private key lives in that GitHub Actions secret and with the maintainer; it is never committed.
5. `gh release create` with the changelog section as notes and both `.dmg` files, both `.app.zip` files, `latest.json`, and `SHA256SUMS.txt` attached, labelled for Intel or Apple Silicon (M1 and newer).

## In-app update behavior

`main/updates.cjs` (`createUpdates`) owns `idle`, `checking`, `up-to-date`, `available`, `downloading`, `ready`, `installing` and `failed` states. Automatic checks honor `checkUpdates`; manual checks can still run when it is off. Background failures return silently to idle, while manual failures show a message. Downloads require an available verified manifest, and installation requires a staged verified app. Only checks are automatic: the user chooses download and restart.

`updater.cjs` verifies Ed25519 manifest signatures against `TRUSTED_KEYS`, archive size/hash, bundle ID `local.storyloom.app`, version/chip and code signature. `installTarget()` rejects unsuitable install locations; the detached installer backs up the old app and rolls back a failed copy. `main/updates.cjs` quits through the normal save handshake and cleans staged updates on reset/quit where appropriate. Self-tests stage an update but deliberately stop before swapping the running application.

Never change the bundle ID to fix an update failure. Rotate signing keys by first shipping a release that trusts both old and new keys, then switch signing; dropping the old key too early strands installed copies. The decision remains in [ADR-1](../architecture/ADR-1-signed-self-update-from-github-releases.md).

## License
Storyloom is free and open source under **AGPL-3.0-only** (`LICENSE`, `package.json`). Account → About links to the source code.

Related: [System overview](../architecture/system-overview.md)
