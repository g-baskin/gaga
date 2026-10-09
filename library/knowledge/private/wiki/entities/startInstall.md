---
type: entity
title: "startInstall / installArgs"
entity_type: function
status: developing
created: 2026-10-07
updated: 2026-10-08
path: "updater.cjs"
language: js
depends_on:
  - "[[entities/updater-cjs]]"
  - "[[entities/installTarget]]"
used_by:
  - "[[entities/main-updates-cjs]]"
last_commit_hash: "7d459e2d1140ffc4d9f2ab44379827342ea99b24"
tested_by:
  - test/updater.test.cjs
tags:
  - entity
  - function
related:
  - "[[concepts/signed-update-channel]]"
sources:
  - updater.cjs
  - main/updates.cjs
---

# startInstall / installArgs

**Starts the detached bash helper that swaps in the new app after Storyloom quits, with rollback.**

## Signature

```js
function installArgs({ pid, target, staged, relaunch = true }) // → argv for /bin/bash
function startInstall(options) // spawn('/bin/bash', installArgs(options), { detached: true, stdio: 'ignore' }).unref()
```

`installArgs` validates pid (safe integer > 1), absolute newline-free paths, `.app` suffixes, and the wait (`waitTenths`, integer 1-6000, default `INSTALL_WAIT_TENTHS` = 1200), then passes every value as a positional argument (`$1..$6`) to the fixed `INSTALL_SCRIPT` (updater.cjs); nothing is pasted into script text.

**INSTALL_SCRIPT:** waits up to `$6` × 0.1 s (120 s by default) for the pid to exit; if it is still running, deletes the workdir and exits 1 without touching the installed app; otherwise moves the current app to `<name>.update-backup.app`; `ditto`s the staged app into place; on success deletes the backup, on failure deletes the partial copy and moves the backup back; removes the workdir; relaunches with `open` when `relaunch=1`.

`installUpdate` (main/updates.cjs) calls this, then quits through the normal close path after 200 ms so open books save first. If the app is still running 10 s after the installer stopped waiting, it discards the download and reports "Storyloom didn't close" instead of staying on "Installing…". In `--self-test` it stops before the swap and returns the staged path.

## Connections

- **depends_on:** [[entities/updater-cjs]], [[entities/installTarget]]
- **used_by:** [[entities/main-updates-cjs]]
- **related:** [[concepts/signed-update-channel]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `updater.cjs`
- `main/updates.cjs`

## Ownership evidence

Current caller: `main/updates.cjs` (`installUpdate`). The IPC registrations remain at `main.cjs` (`registerHandlers`).
