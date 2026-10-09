---
type: entity
title: "scripts/sha256.mjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "scripts/sha256.mjs"
language: js
last_commit_hash: "7d459e2d1140ffc4d9f2ab44379827342ea99b24"
depends_on: []
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - scripts/sha256.mjs
---

# scripts/sha256.mjs

## Verified source surface (2026-10-08)

Source-header scope (`scripts/sha256.mjs`):

> SHA-256 of a file as lowercase hex, read as a stream so large release archives aren't loaded into memory. Shared by the release scripts (dist.mjs for SHA256SUMS, update-manifest.mjs for latest.json). Build-only: it isn't part of the packaged app.


Named function declarations in `scripts/sha256.mjs`: `sha256`. This lexical list includes private helpers; it is not an export list.
