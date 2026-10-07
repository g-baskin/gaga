---
type: entity
title: "package.mjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "package.mjs"
language: js
depends_on: []
used_by: []
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - module
related:
  - "[[concepts/self-test-harness]]"
sources:
  - package.mjs
---

# package.mjs

**Builds the Mac app; shared by the disk-image and release tooling.**

## Overview

Build/packaging script (`npm run package`). Exports `buildApp({ arch, out, quiet })`, which runs `@electron/packager` for macOS with only the app files (`main.cjs`, `preload.cjs`, `storage.cjs`, `epub.cjs`, `renderer/`, `ai/`), plus `readManifest()` and `root`. Run directly, it builds `Storyloom.app` for this Mac under `releases/`.

`dist.mjs` (`npm run dist`) reuses `buildApp` to build both an Intel (`x64`) and an Apple Silicon (`arm64`) app, ad-hoc signs each with `codesign`, checks the chip with `lipo`, and wraps each in a drag-to-Applications disk image with `hdiutil`: `releases/dist/Storyloom_<version>_Intel_x64.dmg` and `Storyloom_<version>_Apple-Silicon_arm64.dmg`, plus `SHA256SUMS.txt`. The apps are not notarized.

Releases: `scripts/changelog.mjs` moves `CHANGELOG.md`'s Unreleased notes into a version section (`npm run release -- X.Y.Z`), and `.github/workflows/release.yml` builds both disk images on a pushed `vX.Y.Z` tag and publishes a GitHub release using that section as the notes.

## Connections

- **depends_on:** —
- **used_by:** —
- **related:** [[concepts/self-test-harness]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `package.mjs`
