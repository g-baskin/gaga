---
type: concept
title: "Signed in-app update channel"
status: developing
created: 2026-10-07
updated: 2026-10-08
complexity: advanced
domain: "storyloom"
tags:
  - concept
  - storyloom
  - updates
related:
  - "[[entities/updater-cjs]]"
  - "[[entities/main-updates-cjs]]"
  - "[[concepts/release-pipeline]]"
sources:
  - updater.cjs
  - main/updates.cjs
---

# Signed in-app update channel

**Sign → verify → stage → swap with rollback.**

1. **Sign (release side):** [[entities/update-manifest-mjs]] hashes each per-chip `.app.zip` and signs [[entities/signedMessage]] with Ed25519; it refuses to write `latest.json` unless the signature verifies against [[entities/TRUSTED_KEYS]] (scripts/update-manifest.mjs).
2. **Check:** [[entities/createUpdater]] `check()` fetches `latest.json` from GitHub (https, allow-listed hosts, ≤64 KB), compares semver, rebuilds the download URL itself, and runs [[entities/verifySignature]] before reporting `available` (updater.cjs).
3. **Download and verify:** `download()` streams into a private temp folder, enforces the signed size and SHA-256, then unpacks and checks bundle ID, version, chip ([[entities/updater-PLATFORMS]]) and code signature (updater.cjs).
4. **Stage:** main keeps `readyUpdate` (main/updates.cjs); a discarded update's temp folder is deleted (main/updates.cjs).
5. **Swap with rollback:** [[entities/installTarget]] confirms the app can be replaced; [[entities/startInstall]] spawns a detached helper that waits for exit, moves the old app to a backup, copies the new one, and restores the backup if the copy fails (updater.cjs). Storyloom quits via the normal close path so books save (main/updates.cjs).

State phases `idle | checking | up-to-date | available | downloading | ready | installing | failed` are pushed on [[entities/ipc-app-update-state]] and drawn by `updateControls` in [[entities/app-js]]. Background checks obey [[entities/settings-checkUpdates]] and fail silently; manual checks explain failures (main/updates.cjs).

## Entities

- [[entities/updater-cjs]], [[entities/createUpdater]], [[entities/verifySignature]], [[entities/signedMessage]], [[entities/TRUSTED_KEYS]], [[entities/installTarget]], [[entities/startInstall]]
- [[entities/ipc-app-check-update]], [[entities/ipc-app-download-update]], [[entities/ipc-app-install-update]], [[entities/ipc-app-open-update-notes]]
- [[entities/test-url-STORYLOOM_TEST_UPDATES]], [[entities/test-url-STORYLOOM_TEST_UPDATE_KEY]]

## Ownership evidence

Staging/cleanup: `main/updates.cjs` (`readyUpdate`, `discardReadyUpdate`), `main/updates.cjs` (`downloadUpdate`); quit path: `main/updates.cjs` (`installUpdate`); background/manual checks: `main/updates.cjs` (`checkForUpdate`). Registration is still `main.cjs` (`registerHandlers`).
