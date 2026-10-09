---
ai_description: |
  User setup and privacy boundaries for optional writing, picture and voice services.
human_description: |
  Connect AI in Account and understand which provider gets each request.
---

# Connect optional AI

Open **Account → AI services**. Writing, pictures and voices have separate service choices. You do not need any of them to edit books, import pictures, record narration or export.

| For | Choices | What you supply |
|---|---|---|
| Writing and illustration scene planning | Claude Code, ChatGPT, OpenRouter, custom OpenAI-compatible service | Installed/signed-in Claude CLI, ChatGPT browser sign-in, or service settings/key |
| Pictures and coloring line art | OpenRouter, fal.ai, custom service | That picture provider's settings/key and credit |
| Generated narration | OpenRouter, custom service | That voice provider's settings/key and credit |

## Choose a writing service

- **Claude Code:** install Claude Code on this Mac and sign in through its own CLI first. Storyloom locates the `claude` program, or you can select its location in Account. It runs writing prompts without tools; it does not read your Claude credential files.
- **ChatGPT:** use **Sign in with ChatGPT**, finish the browser flow and return to Storyloom. Account eligibility and usage limits are controlled by OpenAI. Signing in here is not a promise of unlimited use or picture access.
- **OpenRouter:** supply your OpenRouter key and choose a budget. Automatic selection uses live provider catalogues; recommendations can change. A specific model can be selected where offered.
- **Custom service:** configure its HTTPS base URL and the model names it supports. HTTP is permitted only for local services. OpenAI compatibility varies: a working text endpoint does not prove images or speech work.

## Configure pictures and voices separately

A Claude or ChatGPT writing plan does not fund pictures or voices in Storyloom. Select the picture/voice provider and connect it independently. Read the provider/cost notice before drawing; a generation request can consume that provider's credit. Budget choices are selection preferences, not a spending cap.

Character-guided illustrations can send portraits to OpenRouter or fal.ai; fal.ai uploads them for the editing request. Custom picture generation sends the prompt without the portrait images, so character appearance may vary. You can always import your own pictures instead.

## Privacy and troubleshooting

Prompts, relevant story text and any requested reference portraits go to the selected service under its policies. Keys and ChatGPT sign-in records are encrypted on this Mac; the app's pages see connection status, not decrypted credentials. There is no Storyloom cloud account or book sync. Update checks independently contact GitHub and can be turned off in Account → Updates.

If writing works but pictures/voices fail, check that job's provider rather than reconnecting only the writer. For authentication, quota, unavailable-model or connection errors, follow the message and review that provider's account/credit. Real service availability and sign-in eligibility can change; local simulated tests do not establish that your account will work.

Related: [Make a book](making-a-book.md) · [FAQ](../faqs/storyloom-faq.md).

Implementation references: `renderer/screens/account.js`; `renderer/app.js` (`aiWriterNote`, `aiPictureNote`); `main/settings.cjs` (`publicSettings`, `saveSettings`); `main/ai-services.cjs` (`writeText`, `generateImage`, `generateSpeech`); `ai/claude-code.cjs`, `ai/chatgpt.cjs`, `ai/openrouter.cjs`, `ai/fal.cjs`, `ai/model-picker.cjs`.
