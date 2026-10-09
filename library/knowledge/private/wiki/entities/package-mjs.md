---
type: entity
title: "package-mjs"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "package.mjs"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/scripts-check-package-mjs]]", "[[entities/dist-mjs]]"]
tags: [entity, module]
sources:
  - package.mjs
---

# package-mjs

`buildApp` packages macOS only, with bundle ID `local.storyloom.app`, version from `readManifest`, and asar enabled. The exact top-level allow-list is `keep`: package.json, main.cjs, preload.cjs, storage.cjs, epub.cjs, updater.cjs, log.cjs and LICENSE. It additionally admits renderer/, ai/ and main/ recursively; `DEV_ONLY` excludes renderer/preview-boot.js even inside renderer.

`RUNTIME_NOTICES` are copied into the app, checked by `checkRuntimeNotices`, and `lockFuses` applies `FUSES` after packaging. Node execution, NODE_OPTIONS and inspector arguments are disabled; cookie encryption, asar integrity validation and loading only from asar are enabled. `dist.mjs` calls `buildApp` for each chip; [[entities/scripts-check-package-mjs]] checks runtime-file reachability separately.

Source: `package.mjs` / `keep`, `DEV_ONLY`, `FUSES`, `buildApp`.
