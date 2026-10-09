---
type: entity
title: "test/changelog.test.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "test/changelog.test.cjs"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - test/changelog.test.cjs
---

# test/changelog.test.cjs

## Verified source surface (2026-10-08)

This is a test specification, not a recorded passing run. Literal test declarations in `test/changelog.test.cjs` cover:

- release moves Unreleased into a dated version section and updates the links
- release refuses bad, older, repeated, or empty releases
- first release from a changelog with no versions yet
- the real CHANGELOG.md is well formed: an Unreleased section, and notes for every released version
- the changelog command checks, prints notes, and releases a version

Execution was not performed during this documentation refresh.
