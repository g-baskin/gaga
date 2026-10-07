---
type: entity
title: "createChatGpt"
entity_type: function
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "ai/chatgpt.cjs"
language: js
depends_on: []
used_by:
  - "[[entities/writeText]]"
  - "[[entities/main-cjs]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - function
related:
  - "[[concepts/secret-storage]]"
  - "[[concepts/ai-provider-routing]]"
sources:
  - ai/chatgpt.cjs:34
---

# createChatGpt

## Overview

Defined at `ai/chatgpt.cjs:34`.

## Signature

```js
function createChatGpt({ authBase = 'https://auth.openai.com', apiBase = 'https://api.openai.com/v1', callbackPort = 1455, loadRecord, saveRecord, openBrowser })
```

## Behavior

Returns `{ signIn, cancelSignIn, signOut, status, models, respond, markWelcomed }`. Sign-in runs a loopback HTTP listener on `callbackPort` (1455, or 0 in self-test), 5-minute timeout; tokens refreshed on demand; record persisted through injected `loadRecord`/`saveRecord` (encrypted `chatgpt.json`).

## Connections

- **depends_on:** —
- **used_by:** [[entities/writeText]], [[entities/main-cjs]]
- **related:** [[concepts/secret-storage]], [[concepts/ai-provider-routing]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `ai/chatgpt.cjs:34`
