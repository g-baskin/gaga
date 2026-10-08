---
type: entity
title: "scripts/changelog.mjs"
entity_type: script
status: developing
created: 2026-10-07
updated: 2026-10-07
path: "scripts/changelog.mjs"
language: js
depends_on: []
used_by:
  - "[[entities/release-workflow]]"
last_commit_hash: "eb83d47"
tested_by:
  - test/changelog.test.cjs
tags:
  - entity
  - script
related:
  - "[[concepts/release-pipeline]]"
sources:
  - scripts/changelog.mjs
---

# scripts/changelog.mjs

**CHANGELOG.md helper for releases: check a version has notes and print GitHub release notes.**

## Overview

CLI subcommands used by the release workflow: `check <version>` and `notes <version>` (see `.github/workflows/release.yml`). `notes()` (scripts/changelog.mjs:~40-71) appends a Download section naming `Storyloom_<v>_Intel_x64.dmg` and `Storyloom_<v>_Apple-Silicon_arm64.dmg` (scripts/changelog.mjs) and, since `eb83d47`, a paragraph pointing existing users to **Account → Updates** and explaining the `.app.zip` / `latest.json` files are for the in-app updater (scripts/changelog.mjs).

## Connections

- **depends_on:** —
- **used_by:** [[entities/release-workflow]]
- **related:** [[concepts/release-pipeline]]

## History

- First wiki page for this file. Last touched by `eb83d47`.

## Sources

- `scripts/changelog.mjs`
