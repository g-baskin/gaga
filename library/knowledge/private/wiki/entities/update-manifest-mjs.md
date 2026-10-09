---
type: entity
title: "scripts/update-manifest.mjs"
entity_type: script
status: developing
created: 2026-10-07
updated: 2026-10-08
path: "scripts/update-manifest.mjs"
language: js
depends_on:
  - "[[entities/updater-cjs]]"
  - "[[entities/signedMessage]]"
  - "[[entities/verifySignature]]"
  - "[[entities/TRUSTED_KEYS]]"
used_by:
  - "[[entities/release-workflow]]"
last_commit_hash: "7d459e2d1140ffc4d9f2ab44379827342ea99b24"
tested_by: []
tags:
  - entity
  - script
related:
  - "[[concepts/release-pipeline]]"
  - "[[concepts/signed-update-channel]]"
sources:
  - scripts/update-manifest.mjs
---

# scripts/update-manifest.mjs

**Release step: signs the .app.zip archives and writes releases/dist/latest.json.**

## Overview

Usage: `node scripts/update-manifest.mjs <version>` with the signing key supplied in the `STORYLOOM_UPDATE_SIGNING_KEY` environment variable (scripts/update-manifest.mjs). The key is read from the environment only, never written or printed.

Steps (scripts/update-manifest.mjs; sign :42, self-verify :43): require `x.y.z` matching package.json; for each [[entities/updater-PLATFORMS]] entry hash and size the zip, sign [[entities/signedMessage]] with Ed25519, and **verify against [[entities/TRUSTED_KEYS]]** so a wrong key fails the release instead of publishing unverifiable updates; write `{ version, pub_date, notes_url, platforms }`.

Run by the `Sign the in-app updates` step of `.github/workflows/release.yml` after `npm run dist`.

## Connections

- **depends_on:** [[entities/updater-cjs]], [[entities/signedMessage]], [[entities/verifySignature]], [[entities/TRUSTED_KEYS]]
- **used_by:** [[entities/release-workflow]]
- **related:** [[concepts/release-pipeline]], [[concepts/signed-update-channel]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `scripts/update-manifest.mjs`

## Verified source surface (2026-10-08)

Source-header scope (`scripts/update-manifest.mjs`):

> Signs the update archives in releases/dist and writes releases/dist/latest.json for the in-app updater.  STORYLOOM_UPDATE_SIGNING_KEY="$(cat key.pem)" node scripts/update-manifest.mjs 0.5.0  The key is the Ed25519 private key (PKCS#8 PEM) whose public half is in updater.cjs (TRUSTED_KEYS). It is read from the environment only, never written to disk or printed. Every signature is checked


Named function declarations in `scripts/update-manifest.mjs`: `main`. This lexical list includes private helpers; it is not an export list.

Local dependency evidence (literal import/require statements in `scripts/update-manifest.mjs`):

- `./sha256.mjs` → [[entities/scripts-sha256-mjs]].
- `../updater.cjs` → [[entities/updater-cjs]].
