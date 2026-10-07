---
type: entity
title: ".github/workflows/release.yml"
entity_type: ci-workflow
status: developing
created: 2026-10-07
updated: 2026-10-07
path: ".github/workflows/release.yml"
language: yaml
depends_on:
  - "[[entities/dist-mjs]]"
  - "[[entities/update-manifest-mjs]]"
  - "[[entities/changelog-mjs]]"
used_by: []
last_commit_hash: "eb83d47"
tested_by: []
status_note: "YAML workflow; documented by hand, not ts-morph"
tags:
  - entity
  - ci-workflow
related:
  - "[[concepts/release-pipeline]]"
sources:
  - .github/workflows/release.yml
---

# .github/workflows/release.yml

**GitHub Actions release: tag v1.2.3 → test → build → sign → publish.**

## Overview

Triggered by a `v*` tag push. Steps per the header comment and body (.github/workflows/release.yml:3-13): tag must be `vX.Y.Z` on `main` and match package.json; [[entities/changelog-mjs]] `check`; unit tests; `npm run dist` ([[entities/dist-mjs]]); **Sign the in-app updates** runs [[entities/update-manifest-mjs]] — the only step given the `STORYLOOM_UPDATE_SIGNING_KEY` secret; `gh release create` uploads both .dmgs, both .app.zips, `latest.json`, and `SHA256SUMS.txt` with display labels.

`7a2e83f` dropped the second `git fetch` of main (relies on `fetch-depth: 0`).

## Connections

- **depends_on:** [[entities/dist-mjs]], [[entities/update-manifest-mjs]], [[entities/changelog-mjs]]
- **used_by:** —
- **related:** [[concepts/release-pipeline]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `.github/workflows/release.yml`
