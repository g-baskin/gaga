---
type: entity
title: "main/settings.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "main/settings.cjs"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/main-cjs]]", "[[entities/storage-cjs]]", "[[entities/model-picker-cjs]]"]
tags: [entity, module]
sources:
  - main/settings.cjs
---

# main/settings.cjs

`createSettings` owns settings reads, validation and secret handling. `saveSettings` serializes read-modify-write operations through `settingsQueue`; `writePrivate` uses a random temporary name and rename. `readSettings` uses `readJsonFile` with the damaged-file callback.

`checkBaseUrl` permits HTTPS or loopback HTTP, rejects embedded credentials and strips query/hash. `publicSettings` returns presence booleans instead of encrypted key fields. Writer choices are custom/OpenRouter/ChatGPT/Claude; pictures are custom/OpenRouter/fal; voices are custom/OpenRouter (`WRITERS`, `PICTURES`, `VOICES`).

## Sources

- `main/settings.cjs` (symbols cited above; manually inspected, not AST-extracted).
