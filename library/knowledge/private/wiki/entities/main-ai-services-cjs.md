---
type: entity
title: "main/ai-services.cjs"
entity_type: module
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "main/ai-services.cjs"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/main-cjs]]", "[[entities/main-settings-cjs]]", "[[entities/openrouter-cjs]]", "[[entities/fal-cjs]]", "[[entities/chatgpt-cjs]]", "[[entities/claude-code-cjs]]", "[[entities/model-picker-cjs]]"]
tags: [entity, module]
sources:
  - main/ai-services.cjs
---

# main/ai-services.cjs

`createAiServices` owns provider clients, cached model/status reads, story/chapter/scene generation and media generation. `writeText` routes writing independently of `generateImage` and `generateSpeech`. `getChatGpt` stores the entire sign-in record encrypted through `safeStorage` and `writePrivate`; only self-test uses fake service addresses.

`generateScenePrompts` uses the writer to plan at most 60 pages, matches returned scenes by index and supplies fallback prompts. `readReferences` reads at most four distinct book images under 10,000,000 bytes each. `generateImage` sends references/aspect to OpenRouter or fal, suppresses references for line art, and saves the returned bytes; custom image generation remains a base64 image call without reference inputs.

## Sources

- `main/ai-services.cjs` (symbols cited above; manually inspected, not AST-extracted).
