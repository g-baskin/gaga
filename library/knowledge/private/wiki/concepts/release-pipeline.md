---
type: concept
title: "Release pipeline"
status: developing
created: 2026-10-07
updated: 2026-10-07
complexity: intermediate
domain: "storyloom"
tags:
  - concept
  - storyloom
  - release
related:
  - "[[concepts/signed-update-channel]]"
  - "[[entities/dist-mjs]]"
sources:
  - .github/workflows/release.yml
---

# Release pipeline

**Tag → CI build → sign → publish.**

Driven by `.github/workflows/release.yml` (last touched `eb83d47`), which runs on a pushed version tag:

1. **Check the tag, version, and changelog** (release.yml:44): tag must match `package.json`; notes come from [[entities/changelog-mjs]].
2. **Build the Mac disk images** (release.yml:60): [[entities/dist-mjs]] builds Intel and Apple Silicon apps via [[entities/package-mjs]], ad-hoc signs, checks the chip, and also makes the per-chip `.app.zip` update archives (`makeUpdateZip`, dist.mjs:71).
3. **Sign the in-app updates** (release.yml:64): [[entities/update-manifest-mjs]] writes a signed `latest.json`; the signing key comes from a CI secret.
4. **Publish the release** (release.yml:70): DMGs, `.app.zip` files and `latest.json` go to the GitHub release that [[entities/updater-cjs]] reads.

## Entities

- [[entities/dist-mjs]], [[entities/package-mjs]], [[entities/changelog-mjs]], [[entities/update-manifest-mjs]]
