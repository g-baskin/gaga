---
type: entity
title: "selftest/boundaries.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "selftest/boundaries.cjs"
language: js
last_commit_hash: "7d459e2d1140ffc4d9f2ab44379827342ea99b24"
depends_on: []
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - selftest/boundaries.cjs
---

# selftest/boundaries.cjs

## Verified source surface (2026-10-08)

Scope documented in the source header of `selftest/boundaries.cjs`:

> Security boundaries in main.cjs, exercised for real: - only the app's own main frame may call IPC (handle()), - app://local never serves files outside renderer/, and app://media only serves book assets (serve()), - the page itself has no network (onBeforeRequest): requests to http(s) are cancelled before they leave.

Named check assignments: `ownWindowAllowed`, `otherWindowRefused`, `rendererFileServed`, `encodedTraversalRefused`, `encodedDotsRefused`, `backslashRefused`, `mediaTraversalRefused`, `mediaOtherFolderRefused`, `localHttpBlocked`, `httpsBlocked`, `imageBlocked`, `serverNeverContacted`, `diskErrorPlain`, `diskErrorNoTemp`. These are assertions in code, not evidence of execution.

Execution was not performed during this documentation refresh.
