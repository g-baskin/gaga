---
type: entity
title: "updater.cjs"
entity_type: module
status: developing
created: 2026-10-07
updated: 2026-10-07
path: "updater.cjs"
language: js
depends_on: []
used_by:
  - "[[entities/main-cjs]]"
  - "[[entities/update-manifest-mjs]]"
last_commit_hash: "eb83d47"
tested_by:
  - test/updater.test.cjs
  - selftest/updates.cjs
tags:
  - entity
  - module
related:
  - "[[concepts/signed-update-channel]]"
  - "[[concepts/release-pipeline]]"
sources:
  - updater.cjs
---

# updater.cjs

**In-app updater: check → download → verify → stage → install and restart.**

## Overview

Header comment states the design (updater.cjs): every release publishes `latest.json` plus one signed `.app.zip` per Mac chip; the Ed25519 signature covers version, chip, file name, SHA-256 and size so a download can't be swapped for another release or chip. Order of checks: manifest signature, then size and SHA-256, then unpack, then bundle ID / version / chip / code signature.

Constants: `REPO = 'g-baskin/gaga'` (updater.cjs), `FEED_URL`, `DOWNLOAD_BASE`, `RELEASES_PAGE`, `GITHUB_HOSTS`, [[entities/TRUSTED_KEYS]], `BUNDLE_ID = 'local.storyloom.app'`, `SIGNED_PREFIX = 'storyloom-update-v1'`, `MAX_MANIFEST` 64 KB, `MAX_ARCHIVE` 600 MB, [[entities/updater-PLATFORMS]].

Exports (updater.cjs): [[entities/createUpdater]], [[entities/installTarget]], `installArgs` and [[entities/startInstall]], [[entities/signedMessage]], [[entities/verifySignature]], `isNewer` (strict `x.y.z` comparison), `UpdateError` (user-facing message class), `PLATFORMS`, `TRUSTED_KEYS`, `BUNDLE_ID`, `RELEASES_PAGE`.

Packed into the app by [[entities/package-mjs]] (package.mjs).

## Connections

- **depends_on:** —
- **used_by:** [[entities/main-cjs]], [[entities/update-manifest-mjs]]
- **related:** [[concepts/signed-update-channel]], [[concepts/release-pipeline]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `updater.cjs`
