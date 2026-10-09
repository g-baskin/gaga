---
type: entity
title: "STORYLOOM_TEST_UPDATES"
entity_type: env-var
status: developing
created: 2026-10-07
updated: 2026-10-08
path: "main.cjs"
language: js
depends_on:
  - "[[entities/useTestServices]]"
used_by:
  - "[[entities/createUpdater]]"
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
key: "STORYLOOM_TEST_UPDATES"
tags:
  - entity
  - env-var
related:
  - "[[concepts/self-test-harness]]"
sources:
  - main/updates.cjs
  - main.cjs
---

# STORYLOOM_TEST_UPDATES

**Self-test-only service address (not a real environment variable).**

Key in `testUrls`, set only through [[entities/useTestServices]], which throws outside `--self-test` (`main.cjs` (`useTestServices`)); read through `testUrl()`/`testUrls`. Base URL of the local fake update server (selftest/mock-updates.cjs). When set, `getUpdater()` points `feedUrl` at `<url>/latest.json` and `downloadBase` at `<url>/download/`, and allows only host `127.0.0.1` (`main/updates.cjs`). When unset in self-test, `checkForUpdate` returns idle without any network call (`main/updates.cjs`).

Setting test services calls both resets (`main.cjs` (`useTestServices`)); the update reset clears the client, pending/ready update and state (`main/updates.cjs` (`reset`)).

## Connections

- **depends_on:** [[entities/useTestServices]]
- **used_by:** [[entities/createUpdater]]
- **related:** [[concepts/self-test-harness]]

## History

- Last touched by commit `eb83d47` (AutomationGod). Added in range `2add52d..a7b6898`.

## Sources

- `main.cjs`

## Ownership evidence

The guarded map/setter remains in `main.cjs` (`testUrls`, `testUrl`, `useTestServices`). Consumers: `main/updates.cjs` (`getUpdater`, `checkForUpdate`).
