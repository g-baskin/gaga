---
type: concept
title: "Reference-aware whole-book illustration"
status: developing
created: 2026-10-08
updated: 2026-10-08
complexity: intermediate
domain: storyloom
tags: [concept, storyloom]
related: ["[[entities/illustrate-screen]]", "[[entities/generateImage]]"]
sources: ["renderer/screens/illustrate.js", "main/ai-services.cjs", "ai/openrouter.cjs", "ai/fal.cjs", "storage.cjs"]
---

# Reference-aware whole-book illustration

`renderer/screens/illustrate.js` / targets selects picture-layout pages; castOf selects portrait references. openIllustrateDialog asks scenePrompts to describe pages with the writing service, then calls generateImage sequentially and finds each page by ID again before saving. redrawPage reuses imagePrompt when present.

`main/ai-services.cjs` / generateScenePrompts normalizes results and provides missing-scene fallbacks. readReferences loads only book assets, limits count/size and checks image bytes; generateImage routes through the separately selected picture service. `ai/openrouter.cjs` / image encodes supported references inline; `ai/fal.cjs` / image chooses an edit model when available and uploads reference images. Custom OpenAI-compatible image calls do not send portraits.

`storage.cjs` / sanitizePage preserves imagePrompt for redraw. This is a provider-data flow, not a promise that every model supports references or preserves perfect visual consistency.

See [[entities/illustrate-screen]], [[entities/generateScenePrompts]], [[entities/readReferences]], [[entities/generateImage]].
