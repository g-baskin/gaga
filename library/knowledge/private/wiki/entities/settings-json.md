---
type: entity
title: "settings.json (AI service settings file)"
entity_type: config-key
status: developing
created: 2026-10-06
updated: 2026-10-06
path: "main.cjs"
language: json
depends_on:
  - "[[entities/main-cjs]]"
used_by:
  - "[[entities/readSettings]]"
  - "[[entities/saveSettings]]"
  - "[[entities/publicSettings]]"
last_commit_hash: "a5dac04"
tested_by: []
tags:
  - entity
  - config
related:
  - "[[concepts/secret-storage]]"
sources:
  - main.cjs:59
---

# settings.json (AI service settings file)

Stored at `<userData>/settings.json` (main.cjs:59), written 0600 via temp+rename. Keys:

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

Related file: `<userData>/chatgpt.json` — the whole ChatGPT sign-in record encrypted with safeStorage (main.cjs:174).

## Connections

- **depends_on:** [[entities/main-cjs]]
- **used_by:** [[entities/readSettings]], [[entities/saveSettings]], [[entities/publicSettings]]
- **related:** [[concepts/secret-storage]]

## History

- **Created / last touched:** commit `a5dac04` by AutomationGod on 2026-10-06 ("Storyloom: offline picture-book maker with Scrively feature parity"). Scanned from the working tree, which had uncommitted changes at scan time.

## Sources

- `main.cjs:59`
