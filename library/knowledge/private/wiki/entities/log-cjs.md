---
type: entity
title: "log.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "log.cjs"
language: js
last_commit_hash: "798eda21d5a68570997be678147d5566173efa5b"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/main-cjs]]"]
tags: [entity, module]
sources:
  - log.cjs
---

# log.cjs

`createLog` is plain Node and returns `write`, `error`, `warn`, `dir` and `file`. `write` synchronously appends local entries, rotates storyloom.log to storyloom.old.log when the configured size threshold would be exceeded, caps each entry at 8,000 characters and swallows logging failures. Default `MAX_BYTES` is 1 MiB; this is the rotation threshold, not an exact UTF-8 disk quota.

`main.cjs` initializes this log in Electron’s app logs folder and registers `app:log-error` and `app:open-logs`. No upload implementation exists in this module.

## Sources

- `log.cjs` (symbols cited above; manually inspected, not AST-extracted).
