---
type: entity
title: "PLATFORMS (updater)"
entity_type: constant
status: developing
created: 2026-10-07
updated: 2026-10-07
path: "updater.cjs"
language: js
depends_on:
  - "[[entities/updater-cjs]]"
used_by:
  - "[[entities/createUpdater]]"
  - "[[entities/update-manifest-mjs]]"
last_commit_hash: "eb83d47"
tested_by: []
tags:
  - entity
  - constant
related:
  - "[[concepts/signed-update-channel]]"
  - "[[entities/dist-mjs]]"
sources:
  - updater.cjs:38
---

# PLATFORMS (updater)

**Mac chips known to the updater: manifest key, archive name, lipo arch.**

Defined at updater.cjs:38-41:

| `process.arch` | manifest key | archive | `lipo` |
|---|---|---|---|
| `x64` | `darwin-x64` | `Storyloom_<v>_Intel_x64.app.zip` | `x86_64` |
| `arm64` | `darwin-arm64` | `Storyloom_<v>_Apple-Silicon_arm64.app.zip` | `arm64` |

Must agree with `ARCHES` in [[entities/dist-mjs]] (dist.mjs:21), which names the zips. Other arches get "Automatic updates aren't available for this kind of Mac" (updater.cjs:110).

## Connections

- **depends_on:** [[entities/updater-cjs]]
- **used_by:** [[entities/createUpdater]], [[entities/update-manifest-mjs]]
- **related:** [[concepts/signed-update-channel]], [[entities/dist-mjs]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `updater.cjs:38`
