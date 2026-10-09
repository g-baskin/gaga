---
type: entity
title: "settings.json (AI service settings file)"
entity_type: config-key
status: developing
created: 2026-10-06
updated: 2026-10-08
path: "main/settings.cjs"
language: json
depends_on:
  - "[[entities/main-settings-cjs]]"
used_by:
  - "[[entities/readSettings]]"
  - "[[entities/saveSettings]]"
  - "[[entities/publicSettings]]"
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
tested_by: []
tags:
  - entity
  - config
related:
  - "[[concepts/secret-storage]]"
sources:
  - main/ai-services.cjs
  - main/settings.cjs
---

# settings.json (AI service settings file)

Stored at `<userData>/settings.json` (main/settings.cjs), written 0600 via temp+rename. Keys:

- [[entities/settings-baseUrl]]
- [[entities/settings-model]]
- [[entities/settings-imageModel]]
- [[entities/settings-speechModel]]
- [[entities/settings-voice]]
- [[entities/settings-apiKeyEnc]]
- [[entities/settings-writer]]
- [[entities/settings-pictures]]
- [[entities/settings-voices]]
- [[entities/settings-tier]]
- [[entities/settings-openrouterKeyEnc]]
- [[entities/settings-orTextModel]]
- [[entities/settings-orImageModel]]
- [[entities/settings-orSpeechModel]]
- [[entities/settings-chatgptModel]]
- [[entities/settings-claudeModel]]
- [[entities/settings-claudePath]]

Related file: `<userData>/chatgpt.json` — the whole ChatGPT sign-in record encrypted with safeStorage (`main/ai-services.cjs` (`getChatGpt`)).

## Changes since 2add52d

New fields: [[entities/settings-falKeyEnc]], `falImageModel`, [[entities/settings-checkUpdates]] (main/settings.cjs). `pictures` may now be `fal` ([[entities/settings-pictures]]).

## Connections

- **depends_on:** [[entities/main-settings-cjs]]
- **used_by:** [[entities/readSettings]], [[entities/saveSettings]], [[entities/publicSettings]]
- **related:** [[concepts/secret-storage]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 (the first Storyloom commit). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main/settings.cjs`

## Source ownership

Implementation moved to `main/settings.cjs` (factory-scoped symbols); IPC registration remains in `main.cjs` / `registerHandlers`. This is a source-location correction, not an inferred behavior change.

## Ownership evidence

Settings ownership: `main/settings.cjs` (`createSettings`, `readSettings`), `main/settings.cjs` (`writePrivate`, `saveSettings`); ChatGPT record storage is wired separately in `main/ai-services.cjs` (`getChatGpt`).
