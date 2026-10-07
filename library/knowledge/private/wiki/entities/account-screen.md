---
type: entity
title: "renderer/screens/account.js"
entity_type: module
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "renderer/screens/account.js"
language: js
depends_on:
  - "[[entities/app-js]]"
  - "[[entities/core-js]]"
  - "[[entities/preload-cjs]]"
used_by: []
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - module
  - screen
related:
  - "[[concepts/screen-registry]]"
sources:
  - renderer/screens/account.js
---

# renderer/screens/account.js

**Account: local profile, AI service settings, data folder, about.**

## Overview

Registered via `registerScreen('account', …)` at renderer/screens/account.js:255. Header comment: renderer/screens/account.js:3.

## IPC used

- `api.aiRecommendations` → [[entities/ipc-ai-recommendations]]
- `api.appInfo` → [[entities/ipc-app-info]]
- `api.chatGptCancel` → [[entities/ipc-ai-chatgpt-cancel]]
- `api.chatGptModels` → [[entities/ipc-ai-chatgpt-models]]
- `api.chatGptSignIn` → [[entities/ipc-ai-chatgpt-sign-in]]
- `api.chatGptSignOut` → [[entities/ipc-ai-chatgpt-sign-out]]
- `api.chatGptStatus` → [[entities/ipc-ai-chatgpt-status]]
- `api.chatGptWelcomed` → [[entities/ipc-ai-chatgpt-welcomed]]
- `api.claudeStatus` → [[entities/ipc-ai-claude-status]]
- `api.getProfile` → [[entities/ipc-profile-get]]
- `api.getSettings` → [[entities/ipc-settings-get]]
- `api.openDataFolder` → [[entities/ipc-app-open-data-folder]]
- `api.openLink` → [[entities/ipc-ai-open-link]]
- `api.saveProfile` → [[entities/ipc-profile-save]]

## Connections

- **depends_on:** [[entities/app-js]], [[entities/core-js]], [[entities/preload-cjs]]
- **used_by:** —
- **related:** [[concepts/screen-registry]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `renderer/screens/account.js`
