---
type: concept
title: "Secret storage"
status: developing
created: 2026-10-06
updated: 2026-10-06
complexity: intermediate
domain: "storyloom"
tags:
  - concept
  - storyloom
related:
  - "[[entities/saveSettings]]"
  - "[[entities/publicSettings]]"
  - "[[entities/createChatGpt]]"
sources: []
---

# Secret storage

API keys and the ChatGPT record are encrypted with Electron `safeStorage` (macOS keychain), stored base64, written 0600, decrypted only in main; the page sees only `hasKey`/`hasOpenrouterKey` ([[entities/publicSettings]]).

## Entities

- [[entities/saveSettings]]
- [[entities/publicSettings]]
- [[entities/createChatGpt]]
