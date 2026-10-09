---
type: entity
title: "selftest/updates.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "selftest/updates.cjs"
language: js
last_commit_hash: "7d459e2d1140ffc4d9f2ab44379827342ea99b24"
depends_on: ["[[entities/updater-cjs]]", "[[entities/selftest-mock-updates-cjs]]"]
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - selftest/updates.cjs
---

# selftest/updates.cjs

## Verified source surface (2026-10-08)

Scope documented in the source header of `selftest/updates.cjs`:

> In-app updates through the real screens, against a local stand-in for GitHub Releases: sidebar notice → Download update (with progress) → Restart to update, plus Account → Updates. The last step stops before replacing anything, because the self-test runs inside the development copy.

Named check assignments: `quietByDefault`, `sidebarNotice`, `accountShowsUpdate`, `downloaded`, `sidebarReady`, `fetchedReleaseFile`, `installReady`, `stagedAppExists`, `unusedDownloadDeleted`, `tamperedRefused`, `noDownloadOffered`, `switchOffSaved`, `switchOnSaved`. These are assertions in code, not evidence of execution.

Local dependency evidence (literal import/require statements in `selftest/updates.cjs`):

- `../updater.cjs` → [[entities/updater-cjs]].
- `./mock-updates.cjs` → [[entities/selftest-mock-updates-cjs]].

Execution was not performed during this documentation refresh.
