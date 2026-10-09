---
type: entity
title: "release-workflow"
entity_type: ci-workflow
status: developing
created: 2026-10-07
updated: 2026-10-08
path: ".github/workflows/release.yml"
language: yaml
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/lint-workflow]]", "[[entities/update-manifest-mjs]]", "[[entities/dist-mjs]]"]
tags: [entity, ci-workflow]
sources:
  - .github/workflows/release.yml
---

# release-workflow

The `release` job responds to `v*` tags on macos-14. `Check the tag, version, and changelog` requires a strict semantic version and verifies the tag commit is an ancestor of origin/main, then runs the changelog check. It installs from lockfile without npm cache, runs lint and unit tests, builds both chips, signs manifests in a dedicated environment-scoped step, and publishes verified-tag release assets.

Only the signing step receives the signing-key secret. `gh release create` attaches DMGs, app update ZIPs, latest.json and SHA256SUMS. It does not run the GUI self-test itself: that is a main/PR job in [[entities/lint-workflow]]. No release publication was performed or verified in this scan. Source: `.github/workflows/release.yml` / `jobs.release`.
