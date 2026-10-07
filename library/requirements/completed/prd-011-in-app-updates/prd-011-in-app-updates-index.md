# PRD-011: In-App Updates *(Retroactive)*

> **Status:** Shipped (v0.5.0)
> **Priority:** - *(retroactive - work is done)*
> **Written:** October 2026
> **Retroactive:** Yes - this PRD was written after implementation.

---

## What was built

Storyloom checks GitHub releases for a newer version, downloads the update for the Mac's chip with progress, verifies it, and on **Restart to update** quits, swaps the app, and reopens. Only updates signed with Storyloom's release key install.

### Files touched

| File | Role |
|---|---|
| `updater.cjs` | Check, download, verify, stage, install helper (pure module, no Electron) |
| `main.cjs` | Update state machine, `app:*update*` IPC, `checkUpdates` setting, cleanup on quit |
| `preload.cjs` | `updateState`, `checkForUpdate`, `downloadUpdate`, `installUpdate`, `openUpdateNotes`, `onUpdateState` |
| `renderer/app.js` | Sidebar version label + compact update notice; shared `updateControls` |
| `renderer/screens/account.js` | Account → Updates section (`updatesSection`) |
| `scripts/update-manifest.mjs` | Signs the `.app.zip` archives and writes `latest.json` at release time |
| `dist.mjs` | Builds a `.app.zip` per chip next to each `.dmg` (`makeUpdateZip`, `ditto --keepParent`) |
| `.github/workflows/release.yml` | "Sign the in-app updates" step; uploads archives + `latest.json` |
| Tests | `test/updater.test.cjs`, `selftest/updates.cjs`, `selftest/mock-updates.cjs` |

### Release side

- Each release publishes `latest.json` plus `Storyloom_<v>_Intel_x64.app.zip` and `Storyloom_<v>_Apple-Silicon_arm64.app.zip` (`PLATFORMS`, updater.cjs:38-41).
- `latest.json`: `{ version, pub_date, notes_url, platforms: { "darwin-x64" | "darwin-arm64": { file, sha256, size, signature } } }`.
- Signature: Ed25519 over `storyloom-update-v1\n<version>\n<platform>\n<file>\n<sha256>\n<size>` (`signedMessage`, updater.cjs). Binding version and chip blocks rollback and cross-chip swaps.
- `scripts/update-manifest.mjs` refuses to run if `package.json` doesn't match the version, and checks every signature against the built-in `TRUSTED_KEYS` before writing `latest.json`, so a wrong key fails the release.
- The private key lives only in the `STORYLOOM_UPDATE_SIGNING_KEY` GitHub Actions secret (readable only by the signing step) and with the maintainer. Key rotation: ship a release signed with the current key that adds the new public key to `TRUSTED_KEYS`.

### App side (`createUpdater`, updater.cjs)

1. **Check:** fetches `releases/latest/download/latest.json` over https; redirects are followed only to `github.com` and GitHub's asset hosts (max 5 hops). Manifest capped at 64 KB. 404 → `no-feed`; not newer (strict `x.y.z` compare) → `up-to-date`.
2. **Entry checks:** file name must match the expected per-chip name, `sha256` hex, size 1 byte–600 MB, valid signature from a trusted key. The download URL is rebuilt from the version, never taken from the manifest.
3. **Download:** streamed into a fresh `storyloom-update-*` temp folder (`wx`, 0600); aborts if bigger than signed size; size and SHA-256 must match before anything is unpacked.
4. **Unpack + app checks (`verifyApp`):** `ditto -x -k`; exactly one `Storyloom.app`, a real directory inside the work folder; `CFBundleIdentifier` = `local.storyloom.app`, `CFBundleShortVersionString` = expected version, `CFBundleExecutable` = `Storyloom`; `lipo -archs` matches the chip; `codesign --verify --deep --strict` passes.
5. **Install:** `installTarget` requires a real `.app`, not App Translocation, and write access (otherwise asks the user to move Storyloom to Applications). `startInstall` spawns a detached `/bin/bash` script with values passed as `$1..$6` (never pasted into the script). It waits up to ~120 s for the app's PID to exit; if Storyloom hasn't closed by then, it replaces nothing, deletes the download, and stops, and the app (still open) switches from "Installing" to a "didn't close" message about 10 s later. Otherwise it moves the old app to `*.update-backup.app`, copies the new one with `ditto`, deletes the backup on success or restores it on failure, removes the work folder, and reopens Storyloom.

### State machine (main.cjs)

`phase`: `idle → checking → up-to-date | available → downloading (percent) → ready → installing`, or `failed` with a friendly message. Every change is pushed to the page as `app:update-state`.

- `checkForUpdate({ manual })`: background check once per launch unless `checkUpdates` is off (setting defaults on, main.cjs:82); background failures stay quiet, manual ones show the message.
- `installUpdate` quits through the normal close path, so open books save first.
- `discardReadyUpdate` deletes a downloaded but uninstalled update on quit (`will-quit`) and when settings are reset.
- IPC: `app:update-state`, `app:check-update`, `app:download-update`, `app:install-update`, `app:open-update-notes` (main.cjs:678-685).

### UI

- **Sidebar foot:** `Version <x>` always; a compact notice only for available / downloading / ready / installing (renderer/app.js `versionLabel`).
- **Account → Updates:** current version, status, **Check for updates**, **Download update**, **What's new** (opens the release page), **Restart to update**, and a "Check for updates when Storyloom opens" checkbox. The check sends no data about the user or books (only a `Storyloom/<version>` User-Agent).

## Acceptance criteria (as verified)
- [x] `test/updater.test.cjs`: signature checks, tampered/corrupted downloads, a real app swap and rollback.
- [x] `selftest/updates.cjs` against a local signed feed (`STORYLOOM_TEST_UPDATES`); the self-test stops before the swap because it can't replace the running Electron.

## Known limits
- Apps are ad-hoc signed, not notarized; macOS asks once on first open. Updates keep working after that.
- Storyloom must be in a writable location such as Applications to update itself.

## Related
- [Release process](../../../knowledge/private/release/release-process.md) · [Security model](../../../knowledge/private/security/security-model.md) · [System overview](../../../knowledge/private/architecture/system-overview.md)
