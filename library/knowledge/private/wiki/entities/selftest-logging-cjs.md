---
type: entity
title: "selftest/logging.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "selftest/logging.cjs"
language: js
last_commit_hash: "4dd7ad007e3bea5cf94ea07abb16f62691a99251"
depends_on: []
used_by: []
tested_by: []
related: []
tags: [entity, module]
sources:
  - selftest/logging.cjs
---

# selftest/logging.cjs

## Verified source surface (2026-10-08)

Scope documented in the source header of `selftest/logging.cjs`:

> Error log and crash recovery, for real: - an uncaught error and an unhandled promise rejection in the page land in the local log, - the page can't flood the log (capped per session), - if the page process crashes, it is logged and the window comes back (the real app asks first), - Account has an Open log folder button.

Named check assignments: `pageErrorLogged`, `pageRejectionLogged`, `logInsideLogsFolder`, `pageErrorsCapped`, `crashLogged`, `reloadedAfterCrash`, `inputDuringLoadIgnored`, `openLogsButton`, `openLogsWorks`. These are assertions in code, not evidence of execution.

Execution was not performed during this documentation refresh.
