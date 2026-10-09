---
type: entity
title: "dist.mjs"
entity_type: script
status: developing
created: 2026-10-07
updated: 2026-10-08
path: "dist.mjs"
language: js
depends_on:
  - "[[entities/package-mjs]]"
used_by:
  - "[[entities/release-workflow]]"
last_commit_hash: "cee7902605e955a437522e21109449a3c2b0e812"
tested_by: []
tags:
  - entity
  - script
related:
  - "[[concepts/release-pipeline]]"
  - "[[entities/updater-PLATFORMS]]"
sources:
  - dist.mjs
---

# dist.mjs

**npm run dist: builds Intel and Apple Silicon apps as .dmg plus .app.zip update archives.**

## Overview

Uses only macOS tools (dist.mjs). `ARCHES = { x64: 'Intel_x64', arm64: 'Apple-Silicon_arm64' }` (dist.mjs) names the files. For each arch: [[entities/package-mjs]] `buildApp`, `makeDmg` (checks `lipo` arch and that Info.plist `CFBundleShortVersionString` equals package.json version, dist.mjs), `makeUpdateZip` (`ditto -c -k --sequesterRsrc --keepParent`, dist.mjs), then both files go into `SHA256SUMS.txt`.

Outputs in `releases/dist/`: `Storyloom_<v>_Intel_x64.dmg`, `Storyloom_<v>_Apple-Silicon_arm64.dmg`, matching `.app.zip`s, `SHA256SUMS.txt`.

## Connections

- **depends_on:** [[entities/package-mjs]]
- **used_by:** [[entities/release-workflow]]
- **related:** [[concepts/release-pipeline]], [[entities/updater-PLATFORMS]]

## History

- First wiki page for this file (it predates `2add52d` but had no page). Last touched by `eb83d47`; file names changed in `94e2726` (see contradiction report).

## Sources

- `dist.mjs`

## Verified source surface (2026-10-08)


Named function declarations in `dist.mjs`: `chosenArches`, `makeDmg`, `makeUpdateZip`. This lexical list includes private helpers; it is not an export list.

Local dependency evidence (literal import/require statements in `dist.mjs`):

- `./package.mjs` → [[entities/package-mjs]].
- `./scripts/sha256.mjs` → [[entities/scripts-sha256-mjs]].
