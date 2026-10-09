---
type: entity
title: "ipc-ai-scene-prompts"
entity_type: service
status: developing
created: 2026-10-08
updated: 2026-10-08
path: "main.cjs"
language: js
last_commit_hash: "0d1673a94e233fba0ee45ab31db8ed52bde8eb27"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/generateScenePrompts]]", "[[entities/preload-cjs]]"]
tags: [entity, service]
sources:
  - main.cjs
---

# ipc-ai-scene-prompts

`ai:scene-prompts` is registered by `registerHandlers` through the guarded `handle` wrapper. Preload method: `scenePrompts`. Delegates input objects to ai.generateScenePrompts; nonobjects become an empty object.

Evidence: `main.cjs` / `registerHandlers`, `preload.cjs` / `scenePrompts`.
