---
type: entity
title: "installTarget"
entity_type: function
status: developing
created: 2026-10-07
updated: 2026-10-07
path: "updater.cjs"
language: js
depends_on:
  - "[[entities/updater-cjs]]"
used_by:
  - "[[entities/main-cjs]]"
last_commit_hash: "eb83d47"
tested_by:
  - test/updater.test.cjs
tags:
  - entity
  - function
related:
  - "[[concepts/signed-update-channel]]"
  - "[[entities/startInstall]]"
sources:
  - updater.cjs
  - main.cjs
---

# installTarget

**Finds the running .app and says whether Storyloom may replace it.**

## Signature

```js
async function installTarget(execPath) // → { ok: true, target } | { ok: false, target?, reason }
```

Defined in updater.cjs. Target is three levels above `execPath`; refuses non-`.app` paths ("only work in the installed app"), App Translocation paths (asks the user to move it to Applications), and folders without write access. Called by `installUpdate` (main.cjs); a refusal becomes update phase `failed` with the reason.

## Connections

- **depends_on:** [[entities/updater-cjs]]
- **used_by:** [[entities/main-cjs]]
- **related:** [[concepts/signed-update-channel]], [[entities/startInstall]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `updater.cjs`
- `main.cjs`
