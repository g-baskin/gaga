---
type: entity
title: "createUpdater"
entity_type: function
status: developing
created: 2026-10-07
updated: 2026-10-08
path: "updater.cjs"
language: js
depends_on:
  - "[[entities/updater-cjs]]"
  - "[[entities/verifySignature]]"
  - "[[entities/updater-PLATFORMS]]"
  - "[[entities/TRUSTED_KEYS]]"
used_by:
  - "[[entities/main-updates-cjs]]"
last_commit_hash: "7d459e2d1140ffc4d9f2ab44379827342ea99b24"
tested_by:
  - test/updater.test.cjs
  - selftest/updates.cjs
tags:
  - entity
  - function
related:
  - "[[concepts/signed-update-channel]]"
sources:
  - updater.cjs
  - main/updates.cjs
---

# createUpdater

**Factory for the update client: returns { check, download, verifyApp }.**

## Signature

```js
function createUpdater({ currentVersion, arch = process.arch, feedUrl = FEED_URL, downloadBase = DOWNLOAD_BASE,
  trustedKeys = TRUSTED_KEYS, allowHost = (host) => GITHUB_HOSTS.has(host), tmpDir = os.tmpdir() })
```

Defined in updater.cjs. Internal `open()` (updater.cjs) fetches with `redirect: 'manual'`, max 5 hops, each hop must be https (or http on loopback) and pass `allowHost`.

- **check()** (updater.cjs): reads `latest.json` (≤64 KB). 404 → `{ status: 'no-feed' }`; not newer → `up-to-date`; otherwise rebuilds the download URL from the version (never from the manifest), requires `raw.file` to match the expected name, a 64-hex SHA-256 and a size ≤600 MB, then [[entities/verifySignature]]. Returns `{ status: 'available', version, entry, url, notesUrl }`.
- **download(update, { onProgress })** (updater.cjs): streams into a `storyloom-update-*` temp dir (mode 0600), aborts if bytes exceed the signed size, checks size and SHA-256, unpacks with `/usr/bin/ditto`, then `verifyApp`. Removes the temp dir on any failure. Returns `{ appPath, workdir, version }`.
- **verifyApp** (updater.cjs): exactly one `Storyloom.app`, not a symlink, real path inside workdir; Info.plist `CFBundleIdentifier`, `CFBundleShortVersionString`, `CFBundleExecutable`; `lipo -archs` matches the chip; `codesign --verify --deep --strict`.

The self-test swaps `feedUrl`, `downloadBase`, `allowHost` and `trustedKeys` through `getUpdater()` (main/updates.cjs) using [[entities/test-url-STORYLOOM_TEST_UPDATES]] and [[entities/test-url-STORYLOOM_TEST_UPDATE_KEY]].

## Connections

- **depends_on:** [[entities/updater-cjs]], [[entities/verifySignature]], [[entities/updater-PLATFORMS]], [[entities/TRUSTED_KEYS]]
- **used_by:** [[entities/main-updates-cjs]]
- **related:** [[concepts/signed-update-channel]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `updater.cjs`
- `main/updates.cjs`

## Ownership evidence

Current caller: `main/updates.cjs` (`getUpdater`). The IPC registrations remain at `main.cjs` (`registerHandlers`).
