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

Header comment states the design (updater.cjs:2-11): every release publishes `latest.json` plus one signed `.app.zip` per Mac chip; the Ed25519 signature covers version, chip, file name, SHA-256 and size so a download can't be swapped for another release or chip. Order of checks: manifest signature, then size and SHA-256, then unpack, then bundle ID / version / chip / code signature.

Constants: `REPO = 'g-baskin/gaga'` (updater.cjs:22), `FEED_URL` (:23), `DOWNLOAD_BASE` (:24), `RELEASES_PAGE` (:25), `GITHUB_HOSTS` (:27), [[entities/TRUSTED_KEYS]] (:30), `BUNDLE_ID = 'local.storyloom.app'` (:31), `SIGNED_PREFIX = 'storyloom-update-v1'` (:32), `MAX_MANIFEST` 64 KB (:33), `MAX_ARCHIVE` 600 MB (:34), [[entities/updater-PLATFORMS]] (:38).

Exports (updater.cjs:267-270): [[entities/createUpdater]], [[entities/installTarget]], `installArgs` and [[entities/startInstall]], [[entities/signedMessage]], [[entities/verifySignature]], `isNewer` (:45, strict `x.y.z` comparison), `UpdateError` (:43, user-facing message class), `PLATFORMS`, `TRUSTED_KEYS`, `BUNDLE_ID`, `RELEASES_PAGE`.

Packed into the app by [[entities/package-mjs]] (package.mjs:9).

## Connections

- **depends_on:** —
- **used_by:** [[entities/main-cjs]], [[entities/update-manifest-mjs]]
- **related:** [[concepts/signed-update-channel]], [[concepts/release-pipeline]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `updater.cjs`
