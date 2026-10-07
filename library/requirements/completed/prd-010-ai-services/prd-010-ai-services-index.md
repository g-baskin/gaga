# PRD-010: AI Services *(Retroactive)*

> **Status:** Shipped
> **Priority:** - *(retroactive - work is done)*
> **Written:** October 2026
> **Retroactive:** Yes - this PRD was written after implementation.

> **Testing caveat:** every AI path was tested only against local fake services (`selftest/mock-ai.cjs`, `selftest/mock-services.cjs`, a stand-in `claude` program), never against real accounts.

---

## What was built

AI is optional. Without a service, each AI feature explains what it needs and everything else works. All network calls and secrets live in the **main process**; the page only sees what is connected (`publicSettings`, main.cjs:147).

### Services

| Service | Writing | Pictures | Voices | Module |
|---|---|---|---|---|
| Claude plan (Claude Code) | ✅ | — | — | `ai/claude-code.cjs` |
| ChatGPT plan | ✅ | — | — | `ai/chatgpt.cjs` |
| OpenRouter | ✅ | ✅ | ✅ | `ai/openrouter.cjs` |
| fal.ai | — | ✅ | — | `ai/fal.cjs` |
| Your own OpenAI-compatible service | ✅ | ✅ | ✅ | `aiRequest` in `main.cjs` |

Settings (`settings.json`, main.cjs:60-145): `writer` ∈ custom/openrouter/chatgpt/claude; `pictures` ∈ custom/openrouter/fal; `voices` ∈ custom/openrouter; `falKeyEnc`, `falImageModel`; `tier` ∈ best/balanced/thrifty; optional pinned model per job; keys encrypted with `safeStorage`.

- **Claude Code:** finds the user's installed, signed-in `claude` (PATH, common install dirs, nvm, or a set absolute path). Runs `claude -p --output-format json --no-session-persistence --tools "" --setting-sources "" --strict-mcp-config --disable-slash-commands --system-prompt …` in an empty folder with a minimal environment (no API keys from the shell). Storyloom never reads Claude's login. Status cached 60 s.
- **ChatGPT plan:** OpenAI's "Sign in with ChatGPT" self-serve flow for open-source local apps (preview): dynamic client registration, PKCE + state + nonce, loopback callback on 127.0.0.1:1455, ID token verified against OpenAI's JWKS, `chatgpt.tokens.use.direct` scope, Responses API with `store:false`, refresh rotation, revoke on sign-out. Sign-in record encrypted with the keychain in `chatgpt.json`. Model list cached 6 h; friendly text for plan errors.
- **OpenRouter:** user key; chat (with backup models), image, speech, live catalogues.
- **fal.ai (pictures only):** user key (`Authorization: Key …`). Live model list from `api.fal.ai/v1/models` (text-to-image, active), choice by `pickFalModel`; each model's OpenAPI input schema decides which of `image_size: square_hd` / `aspect_ratio: 1:1`, `output_format: png`, `num_images: 1`, `sync_mode: true` are sent to `fal.run/<model>`. Pictures come back inline (data URL) or are downloaded over https from fal's own hosts only. Friendly text for missing/wrong key, empty balance, busy, and rejected requests. Lists cached 6 h.
- **Why not ChatGPT for pictures:** ChatGPT draws pictures in OpenAI's own apps, but OpenAI's "Sign in with ChatGPT" for other apps doesn't support image generation yet (preview limitations, developers.openai.com/siwc), so the ChatGPT plan only writes here.
- **Custom service:** `baseUrl` must be https (http only for localhost), no credentials in the URL; requests use `redirect:'error'`, timeouts, size caps.

### Automatic model choice (`ai/model-picker.cjs`, pure functions)
- Writing (OpenRouter): OpenRouter's live creative-writing usage ranking, re-ranked by benchmark scores when a key is saved; price cap per million output tokens best $40 / balanced $6 / thrifty $1.2; skips routers, expiring, low-context, free and non-text models; translation ranking favoured for non-English; two fallbacks. `captions` drops one budget step.
- Pictures / coloring / voices: per-budget families matched against live lists; line-art models for coloring; vector-only skipped; a voice the model supports is chosen.
- Claude: Opus/Sonnet/Haiku by job and budget. ChatGPT: account's own list in OpenAI's order.
- Account screen shows the per-job choice and reason (`ai:recommendations`).

### Jobs (main.cjs)
`ai:generate` (whole story / coloring captions, JSON chapters), `ai:chapter`, `ai:image` (saved to the book), `ai:speech` (saved to the book).

## Acceptance criteria (as verified)
- [x] `test/ai-services.test.cjs` (8), `test/model-picker.test.cjs` (8), `selftest/ai-services.cjs` — against fakes only.

## Open questions
- ChatGPT plan use in third-party apps is an OpenAI preview and writing-only. Claude plans are meant for personal use.

## Related
- [Security model](../../../knowledge/private/security/security-model.md)
