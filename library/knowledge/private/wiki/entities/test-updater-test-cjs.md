---
type: entity
title: "test/updater.test.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "test/updater.test.cjs"
language: js
last_commit_hash: "448bd054acdf773edd48a1f563590442ad435947"
depends_on: ["[[entities/updater-cjs]]", "[[entities/selftest-mock-updates-cjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - test/updater.test.cjs
---

# test/updater.test.cjs

## Verified source surface (2026-10-08)

This is a test specification, not a recorded passing run. Literal test declarations in `test/updater.test.cjs` cover:

- isNewer compares versions number by number
- finds, downloads, and verifies a signed update
- says up to date when the published version isn’t newer, and handles a missing feed
- refuses an update signed with a different key
- refuses a manifest whose signed details were changed (size, hash, version swap)
- refuses a download that doesn’t match its signed checksum
- refuses an archive whose app has the wrong version or isn’t Storyloom
- never follows redirects to other hosts
- the signed message binds every detail of a download
- the installer waits for Storyloom to quit, then swaps in the new app
- if copying the new app fails, the installer puts the old app back
- if Storyloom doesn’t close in time, the installer replaces nothing and deletes the download
- the installer refuses unsafe arguments
- install location: refuses translocated or non-app paths

Named function declarations in `test/updater.test.cjs`: `keyPair`, `harness`. This lexical list includes private helpers; it is not an export list.

Local dependency evidence (literal import/require statements in `test/updater.test.cjs`):

- `../updater.cjs` → [[entities/updater-cjs]].
- `../selftest/mock-updates.cjs` → [[entities/selftest-mock-updates-cjs]].

Execution was not performed during this documentation refresh.
