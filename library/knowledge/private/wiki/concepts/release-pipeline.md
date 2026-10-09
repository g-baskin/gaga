---
type: concept
title: "Release pipeline"
status: developing
created: 2026-10-07
updated: 2026-10-08
complexity: intermediate
domain: storyloom
tags: [concept, storyloom]
related: ["[[entities/package-mjs]]", "[[entities/release-workflow]]", "[[entities/update-manifest-mjs]]"]
sources: ["package.json", "scripts/changelog.mjs", "package.mjs", "dist.mjs", "scripts/update-manifest.mjs", ".github/workflows/release.yml"]
---

# Release pipeline

`package.json` holds the version; `scripts/changelog.mjs` / release command moves Unreleased entries into a dated release and updates the package/lockfile. The documented command is npm run release -- X.Y.Z; tagging and pushing are separate operations.

`package.mjs` / buildApp admits only its keep set and runtime subdirectories, excludes preview-boot.js, copies runtime notices and locks Electron fuses. `dist.mjs` builds requested chips, ad-hoc signs apps, creates DMGs and app ZIPs, and writes checksums. This does not confer Apple notarization.

`.github/workflows/release.yml` / jobs.release validates a vX.Y.Z tag, checks origin/main ancestry, runs lint/unit tests, builds both chips, signs latest.json through scripts/update-manifest.mjs and publishes assets. The signing script self-verifies with updater.cjs / TRUSTED_KEYS before writing the manifest. `scripts/sha256.mjs` streams archive hashing.

Main/PR checks live in [[entities/lint-workflow]] and [[entities/secret-scan-workflow]]. Workflow source cannot establish the currently enforced remote ruleset or whether a release is published. No tag, publication, download or packaged-app test was performed here.

See [[entities/package-mjs]], [[entities/dist-mjs]], [[entities/update-manifest-mjs]], [[entities/release-workflow]].
