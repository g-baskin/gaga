---
ai_description: |
  Current AI routing, provider clients, model selection and authentication boundaries.
human_description: |
  Which service handles writing, pictures and voices, and where to change it.
---

# AI services

`main/ai-services.cjs` (`createAiServices`) is the routing layer; `main.cjs` registers its operations through trusted-caller IPC and `preload.cjs` exposes individual methods. The renderer has no internet access. Account configures providers in `renderer/screens/account.js`; shared availability/cost messages live in `renderer/app.js`.

## Jobs and providers

| Job | Routing/settings | Implementation |
|---|---|---|
| Whole story, chapter, coloring captions, illustration scene plan | `writer`: Claude Code, ChatGPT, OpenRouter or custom service | `writeText`, `generateStory`, `generateChapter`, `generateScenePrompts` |
| Pictures, including line art | `pictures`: OpenRouter, fal.ai or custom service | `generateImage` |
| Narration | `voices`: OpenRouter or custom service | `generateSpeech` |

Claude/ChatGPT sign-ins do not provide picture or voice access. A model override applies to its particular job/provider, not every request. `generateStory()` asks for bounded JSON chapters/pages; `chatJson()` extracts/parses the JSON object and `clip()` bounds text fields. Whole-book illustration asks the writing provider for scene prompts first, then the picture provider for each eligible page (`renderer/screens/illustrate.js`). It saves prompt and image per completed page so retrying need not erase previous work.

`generateImage()` reads at most four referenced book assets (each bounded to 10,000,000 bytes), supplies them to supported provider routes, saves returned bytes through storage, and returns only a filename. Custom image generation sends the textual prompt to `/images/generations`, not reference image bytes, so character appearance may vary. fal.ai can select an editing model and upload portraits; do not describe portraits as staying local when that feature is used. Speech also saves returned bytes as a book asset and returns a filename.

## Model choice

`ai/model-picker.cjs` contains pure selection functions. Budget tiers are `best`, `balanced` and `thrifty`; selection considers capabilities, prices, job/language and provider catalogue/ranking information, not a fixed promise of one model forever.

`ai/openrouter.cjs` reads live model/image/speech catalogues and task categories, caches them for six hours, and can retain stale catalogues if refresh fails. Writing requests carry model fallbacks. `ai/fal.cjs` has separate generation/editing catalogues and recommendation paths. `ai/chatgpt.cjs` lists models available to the signed-in account. `aiRecommendations()` is an explanation/preview of choices, not a guarantee that an upstream service remains available or affordable.

## Credentials and sign-in

- `main/settings.cjs` encrypts custom/OpenRouter/fal.ai keys with Electron `safeStorage`. `publicSettings` exposes availability booleans, never decrypted keys. `saveSettings()` serializes read-modify-write operations.
- `ai/chatgpt.cjs` implements browser OAuth with PKCE, state/nonce checks, loopback callback, ID-token verification and serialized refresh. `main/ai-services.cjs` persists the encrypted record in `chatgpt.json`; status sent to the renderer is a filtered view. Sign-in cancellation and sign-out are explicit operations; sign-out attempts revocation and removes local credentials.
- `ai/claude-code.cjs` locates an installed executable named `claude`, checks its status and runs prompt mode in a temporary empty directory with tools/settings/MCP/slash commands disabled and a minimal environment. Storyloom does not read Claude's credential files. A custom executable location must pass settings/runtime checks.
- Custom services use an HTTPS base URL (HTTP allowed for localhost), checked model/voice names, timeouts, bounded responses and rejected redirects. Keys are sent only to the configured service; choosing that service remains a user trust decision.

`STORYLOOM_TEST_*` routes and mock credentials are only enabled by `--self-test`; `useTestServices()` rejects use outside that mode and resets cached clients/update state. Tests must restore routes afterward.

## Verification boundary

`test/ai-services.test.cjs`, `test/model-picker.test.cjs` and `selftest/ai-services.cjs` exercise local fakes and routing. `test/live/openrouter.live.cjs` separately defines opt-in real-catalogue/chat/error checks; these can consume credit and require `OPENROUTER_TEST_API`. No live provider or sign-in was exercised during this documentation refresh. Test existence does not establish current upstream availability, account eligibility or billing behavior.

Related: [System overview](../architecture/system-overview.md) · [Security model](../security/security-model.md) · [AI user guide](../../public/guides/connecting-ai.md).
