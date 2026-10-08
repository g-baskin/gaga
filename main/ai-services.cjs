'use strict';
// --- Optional AI services. Keys and sign-ins stay in this process; the page only sees what is connected. ---
// Writing: your own OpenAI-compatible service, OpenRouter, your ChatGPT plan, or your Claude Code subscription.
// Pictures: OpenRouter, fal.ai, or your own service. Voices: OpenRouter or your own service.
const fs = require('node:fs/promises');
const path = require('node:path');
const { sniffImage } = require('../storage.cjs');
const modelPicker = require('../ai/model-picker.cjs');
const { createOpenRouter } = require('../ai/openrouter.cjs');
const { createChatGpt } = require('../ai/chatgpt.cjs');
const { createClaudeCode } = require('../ai/claude-code.cjs');
const { createFal } = require('../ai/fal.cjs');

function createAiServices({ app, safeStorage, shell, selfTest, testUrls, testUrl, settings, getStore }) {
  const { readSettings, decryptSecret, checkBaseUrl, writePrivate, VOICE } = settings;
  let openRouter = null;
  let fal = null;
  let chatGpt = null;
  let claudeCode = null;
  let claudeStatusCache = null;
  function getOpenRouter() {
    openRouter ||= createOpenRouter({
      baseUrl: testUrl('STORYLOOM_TEST_OPENROUTER'),
      getKey: async () => decryptSecret((await readSettings()).openrouterKeyEnc),
    });
    return openRouter;
  }
  function getFal() {
    fal ||= createFal({
      runBase: testUrl('STORYLOOM_TEST_FAL_RUN'),
      apiBase: testUrl('STORYLOOM_TEST_FAL_API'),
      restBase: testUrl('STORYLOOM_TEST_FAL_REST'),
      getKey: async () => decryptSecret((await readSettings()).falKeyEnc),
      // The self-test's fake fal serves pictures from 127.0.0.1; real installs accept only fal's own hosts.
      ...(selfTest && testUrls.STORYLOOM_TEST_FAL_RUN ? { mediaHostOk: (host) => host === '127.0.0.1' } : {}),
    });
    return fal;
  }
  const chatGptFile = () => path.join(app.getPath('userData'), 'chatgpt.json');
  function getChatGpt() {
    chatGpt ||= createChatGpt({
      authBase: testUrl('STORYLOOM_TEST_CHATGPT_AUTH'),
      apiBase: testUrl('STORYLOOM_TEST_CHATGPT_API'),
      callbackPort: selfTest ? 0 : 1455,
      // The whole sign-in record is encrypted with the Mac keychain and readable only by this user.
      async loadRecord() {
        try {
          const sealed = await fs.readFile(chatGptFile(), 'utf8');
          return JSON.parse(safeStorage.decryptString(Buffer.from(sealed, 'base64')));
        } catch { return null; }
      },
      async saveRecord(record) {
        if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure storage is unavailable on this computer');
        await writePrivate(chatGptFile(), safeStorage.encryptString(JSON.stringify(record)).toString('base64'));
      },
      async openBrowser(url) {
        const auth = testUrl('STORYLOOM_TEST_CHATGPT_AUTH') || 'https://auth.openai.com';
        if (!url.startsWith(`${auth}/`)) throw new Error('Refusing to open an unexpected sign-in address');
        // The self-test's fake sign-in server answers with a redirect straight back to the callback.
        if (selfTest) { await fetch(url); return; }
        await shell.openExternal(url);
      },
    });
    return chatGpt;
  }
  function getClaudeCode() {
    claudeCode ||= createClaudeCode({ getPath: async () => (await readSettings()).claudePath });
    return claudeCode;
  }
  async function claudeStatus(force) {
    if (force || !claudeStatusCache || Date.now() - claudeStatusCache.at > 60000) {
      claudeStatusCache = { at: Date.now(), value: await getClaudeCode().status() };
    }
    return claudeStatusCache.value;
  }
  let chatGptModels = null; // { at, list }
  async function chatGptModelList(force) {
    if (force || !chatGptModels || Date.now() - chatGptModels.at > 6 * 60 * 60 * 1000) {
      chatGptModels = { at: Date.now(), list: await getChatGpt().models() };
    }
    return chatGptModels.list;
  }

  // Calls your own OpenAI-compatible service. Only the address you set, no redirects, bounded time and size.
  async function aiRequest(endpoint, body, { needs, maxBytes = 2_000_000, binary = false, timeout = 120000 }) {
    const settings = await readSettings();
    const model = settings[needs];
    if (!settings.baseUrl || !model) {
      const what = { model: 'a writing model', imageModel: 'a picture model', speechModel: 'a voice model' }[needs];
      throw new Error(`Set up ${what} in Account → AI services first`);
    }
    const headers = { 'Content-Type': 'application/json' };
    if (settings.apiKeyEnc) headers.Authorization = `Bearer ${decryptSecret(settings.apiKeyEnc)}`;
    let response;
    try {
      response = await fetch(`${checkBaseUrl(settings.baseUrl)}${endpoint}`, {
        method: 'POST', headers, redirect: 'error', signal: AbortSignal.timeout(timeout), body: JSON.stringify({ model, ...body }),
      });
    } catch (error) {
      throw new Error(error.name === 'TimeoutError' ? 'The AI service took too long to answer' : 'Could not reach the AI service', { cause: error });
    }
    if (!response.ok) throw new Error(`The AI service returned an error (HTTP ${response.status})`);
    const declared = Number(response.headers.get('content-length'));
    if (declared > maxBytes) throw new Error('The AI service response was too large');
    const data = Buffer.from(await response.arrayBuffer());
    if (data.length > maxBytes) throw new Error('The AI service response was too large');
    if (binary) return { data, settings };
    try { return { data: JSON.parse(data.toString('utf8')), settings }; } catch { throw new Error('The AI service response was not understood'); }
  }

  const clip = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
  const LEVEL_TEXT = {
    'first-words': 'ages 2-4: one very short sentence per page, simple words, lots of repetition',
    'early-reader': 'ages 4-6: one to three short sentences per page',
    'growing-reader': 'ages 6-8: a short paragraph per page with some new words',
    'confident-reader': 'ages 8-10: up to two paragraphs per page, richer vocabulary',
  };
  const LENGTH_PAGES = { tiny: 8, short: 12, medium: 18, long: 24 };

  // Sends one writing job to the chosen service and returns { content, model }.
  async function writeText({ system, user, maxTokens, task, language }) {
    const settings = await readSettings();
    if (settings.writer === 'openrouter') {
      return getOpenRouter().chat({ system, user, maxTokens, task, tier: settings.tier, language, model: settings.orTextModel });
    }
    if (settings.writer === 'chatgpt') {
      const model = settings.chatgptModel || modelPicker.pickChatGptModel({ models: await chatGptModelList(), task, tier: settings.tier });
      if (!model) throw new Error('Your ChatGPT account has no models available for other apps right now');
      return { content: await getChatGpt().respond({ instructions: system, user, model }), model };
    }
    if (settings.writer === 'claude') {
      return getClaudeCode().ask({ system, user, model: settings.claudeModel || modelPicker.pickClaudeModel({ task, tier: settings.tier }) });
    }
    const { data } = await aiRequest('/chat/completions', {
      temperature: 0.8, ...(maxTokens ? { max_tokens: maxTokens } : {}),
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }, { needs: 'model' });
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('The AI service response was not understood');
    return { content, model: typeof data.model === 'string' ? data.model : settings.model };
  }

  async function chatJson(system, user, { maxTokens, task, language } = {}) {
    const { content, model } = await writeText({ system, user, maxTokens, task, language });
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    try { return { json: JSON.parse(content.slice(start, end + 1)), model }; } catch { throw new Error('The AI service did not answer in the expected format — try again'); }
  }

  // Writes a whole story from the Story builder (or the quick idea box, or a coloring-book idea).
  async function generateStory(input = {}) {
    const idea = clip(input.idea, 4000);
    if (!idea) throw new Error('Describe your story idea first');
    const level = LEVEL_TEXT[input.readingLevel] || (typeof input.readingLevel === 'string' ? `ages ${clip(input.readingLevel, 20)}` : LEVEL_TEXT['early-reader']);
    const count = Math.min(30, Math.max(3, Math.round(Number(input.pages) || LENGTH_PAGES[input.length] || 10)));
    const language = clip(input.language, 40) || 'English';
    const characters = (Array.isArray(input.characters) ? input.characters.slice(0, 12) : [])
      .map((c) => [clip(c?.name, 80), clip(c?.role, 80), clip(c?.description, 400)].filter(Boolean).join(' — ')).filter(Boolean);
    const details = [
      ['Title', clip(input.title, 200)], ['Genre', clip(input.genre, 60)],
      ['Writing style', (Array.isArray(input.writingStyle) ? input.writingStyle.slice(0, 8).map((w) => clip(w, 40)) : []).join(', ')],
      ['Setting', clip(input.location, 200)], ['Time period', clip(input.era, 200)], ['Also include', clip(input.extras, 2000)],
      ['Language', language], ['Reader level', level], ['Number of pages', String(count)],
      ['Characters', characters.join('; ')],
    ].filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
    const { json: story, model } = await chatJson(
      'You write original, warm picture-book stories for children. Reply with JSON only, no commentary, in this shape: {"title": string, "chapters": [{"title": string, "text": string}]}. Each chapter is one picture-book page of text suited to the reader level. Write in the requested language.',
      `Story idea: ${idea}\n${details}`,
      { task: input.purpose === 'coloring' ? 'captions' : 'story', language },
    );
    const raw = Array.isArray(story.chapters) ? story.chapters
      : Array.isArray(story.pages) ? story.pages.map((text, i) => ({ title: `Page ${i + 1}`, text })) : [];
    const chapters = raw
      .map((c, i) => ({ title: clip(typeof c === 'string' ? `Page ${i + 1}` : c?.title, 200) || `Page ${i + 1}`, text: clip(typeof c === 'string' ? c : c?.text, 4000) }))
      .filter((c) => c.text).slice(0, count);
    if (chapters.length === 0) throw new Error('The AI service returned no pages — try again');
    return { title: clip(story.title, 200) || clip(input.title, 200) || 'My story', chapters, pages: chapters.map((c) => c.text), model };
  }

  // Writes or rewrites one chapter in the Manuscript.
  // One short picture description per page, for illustrating a whole book. Uses the writing service.
  // input: { bookTitle, style, characters: [{ name, description }], pages: [{ index, text }] }
  // → { scenes: [{ index, prompt }] } with one entry per page sent, in the same order.
  async function generateScenePrompts(input = {}) {
    const pages = (Array.isArray(input.pages) ? input.pages : []).slice(0, 60)
      .map((p) => ({ index: Math.max(0, Math.round(Number(p?.index) || 0)), text: clip(p?.text, 1200) }));
    if (!pages.length) throw new Error('There are no pages to illustrate');
    const cast = (Array.isArray(input.characters) ? input.characters : []).slice(0, 8)
      .map((c) => `${clip(c?.name, 60) || 'Unnamed'}: ${clip(c?.description, 300) || 'no description'}`).filter(Boolean);
    const { json } = await chatJson(
      'You plan the illustrations for an original children\'s picture book. For each page, write one picture description (1-2 sentences): '
        + 'who is in it, what they are doing, where, and the mood. Name characters exactly as listed. Describe only what can be drawn; no words or letters in the picture. '
        + 'Keep the same setting details from page to page. Reply with JSON only: {"scenes": [{"index": number, "prompt": string}]}, one item per page, in order.',
      [
        `Book: ${clip(input.bookTitle, 200) || 'Untitled'}`,
        input.style ? `Art style: ${clip(input.style, 100)}` : '',
        cast.length ? `Characters:\n${cast.join('\n')}` : '',
        `Pages:\n${pages.map((p) => `[${p.index}] ${p.text || '(no words: the title page)'}`).join('\n')}`,
      ].filter(Boolean).join('\n'),
      { task: 'captions', maxTokens: 4000 },
    );
    const byIndex = new Map((Array.isArray(json?.scenes) ? json.scenes : [])
      .filter((s) => Number.isInteger(s?.index) && typeof s?.prompt === 'string' && s.prompt.trim())
      .map((s) => [s.index, clip(s.prompt.trim(), 600)]));
    // A page the AI skipped falls back to its own words, so every page still gets a picture.
    return { scenes: pages.map((p) => ({ index: p.index, prompt: byIndex.get(p.index) || clip(p.text, 600) || clip(input.bookTitle, 200) || 'A friendly picture-book scene' })) };
  }

  async function generateChapter(input = {}) {
    const wordLimit = Math.min(2000, Math.max(5, Math.round(Number(input.wordLimit) || 120)));
    const language = clip(input.language, 40) || 'English';
    const { json: result, model } = await chatJson(
      'You help write one chapter of an original children\'s picture book. Reply with JSON only: {"text": string}. Use plain text with blank lines between paragraphs. Stay within the word limit.',
      [
        `Book: ${clip(input.bookTitle, 200) || 'Untitled'}`,
        `Chapter: ${clip(input.chapterTitle, 200) || 'Untitled'}`,
        `Reader level: ${LEVEL_TEXT[input.readingLevel] || LEVEL_TEXT['early-reader']}`,
        `Language: ${language}`,
        `Word limit: ${wordLimit}`,
        input.context ? `Story so far:\n${clip(input.context, 6000)}` : '',
        input.current ? `Current chapter text to rewrite:\n${clip(input.current, 6000)}` : '',
        `Instruction: ${clip(input.instruction, 1000) || (input.current ? 'Rewrite this chapter so it reads more smoothly.' : 'Write this chapter.')}`,
      ].filter(Boolean).join('\n'),
      { task: 'chapter', language },
    );
    const text = clip(result.text, 20000);
    if (!text) throw new Error('The AI service returned an empty chapter — try again');
    return { text, model };
  }

  // Reference pictures (character portraits) from the book's own folder, to keep characters looking the same.
  // Only names of pictures in this book are accepted; at most 4, each a real image under 10 MB.
  const IMAGE_MIME = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
  async function readReferences(bookId, names) {
    if (!Array.isArray(names)) return [];
    const out = [];
    for (const name of [...new Set(names.filter((n) => typeof n === 'string'))].slice(0, 4)) {
      let data;
      try {
        const file = getStore().mediaPath(bookId, name); // throws for anything that isn't a plain picture name
        if ((await fs.stat(file)).size > 10_000_000) continue;
        data = await fs.readFile(file);
      } catch {
        continue; // a missing or unusable picture just isn't sent
      }
      const kind = sniffImage(data.subarray(0, 16));
      if (kind) out.push({ data, type: IMAGE_MIME[kind] });
    }
    return out;
  }
  const ASPECTS = new Set(['1:1', '3:4', '4:3']);

  // Generates a picture and stores it in the book. Returns the new asset name.
  // Optional: references (names of pictures in this book, e.g. character portraits) and aspect ('1:1', '3:4', '4:3').
  async function generateImage(input = {}) {
    const book = await getStore().read(input.bookId);
    const prompt = clip(input.prompt, 3000);
    if (!prompt) throw new Error('Describe the picture first');
    const style = clip(input.style, 200);
    const lineArt = Boolean(input.lineArt);
    const aspect = ASPECTS.has(input.aspect) ? input.aspect : '1:1';
    const references = lineArt ? [] : await readReferences(book.id, input.references);
    const fullPrompt = lineArt
      ? `Black and white line art coloring page for children, clean bold outlines, no shading, white background: ${prompt}`
      : `Children's picture-book illustration${style ? ` in a ${style} style` : ''}${references.length
        ? '. Keep each character looking exactly like their reference picture (same face, colors, and clothes)' : ''}: ${prompt}`;
    const settings = await readSettings();
    if (settings.pictures === 'openrouter') {
      const { bytes } = await getOpenRouter().image({ prompt: fullPrompt, tier: settings.tier, lineArt, model: settings.orImageModel, references, aspect });
      return getStore().saveImageBytes(book.id, bytes);
    }
    if (settings.pictures === 'fal') {
      const { bytes } = await getFal().image({ prompt: fullPrompt, tier: settings.tier, lineArt, model: settings.falImageModel, references, aspect });
      return getStore().saveImageBytes(book.id, bytes);
    }
    // Your own service: the standard picture call has no reference pictures, so characters may vary.
    const { data } = await aiRequest('/images/generations', {
      prompt: fullPrompt, n: 1, size: '1024x1024', response_format: 'b64_json',
    }, { needs: 'imageModel', maxBytes: 40_000_000, timeout: 180000 });
    const b64 = data?.data?.[0]?.b64_json;
    if (typeof b64 !== 'string') throw new Error('The picture service did not return an image');
    return getStore().saveImageBytes(book.id, Buffer.from(b64, 'base64'));
  }

  // Reads text aloud with the chosen voice service and stores the sound in the book.
  async function generateSpeech(input = {}) {
    const book = await getStore().read(input.bookId);
    const text = clip(input.text, 4000);
    if (!text) throw new Error('This page has no words to read aloud');
    const settings = await readSettings();
    const voice = typeof input.voice === 'string' && VOICE.test(input.voice) ? input.voice : settings.voice || 'alloy';
    if (settings.voices === 'openrouter') {
      const { bytes } = await getOpenRouter().speech({ text, tier: settings.tier, voice, model: settings.orSpeechModel });
      return getStore().saveAudioBytes(book.id, bytes);
    }
    const { data } = await aiRequest('/audio/speech', { input: text, voice, response_format: 'mp3' },
      { needs: 'speechModel', maxBytes: 100_000_000, binary: true, timeout: 180000 });
    return getStore().saveAudioBytes(book.id, data);
  }

  // Which model each job would use right now, and why (shown on the Account screen).
  async function aiRecommendations() {
    const s = await readSettings();
    const rows = [];
    const tierName = { best: 'Best quality', balanced: 'Balanced', thrifty: 'Lowest cost' }[s.tier];
    let openRouterRows = null;
    const fromOpenRouter = async () => (openRouterRows ||= await getOpenRouter().recommendations({ tier: s.tier, language: 'English' }));
    const pinned = (job, model) => ({ job, model, fallbacks: [], reason: 'You chose this model.' });
    if (s.writer === 'openrouter') {
      if (s.orTextModel) rows.push(pinned('Writing', s.orTextModel));
      else rows.push(...(await fromOpenRouter()).filter((r) => ['Whole stories', 'Chapters', 'Coloring captions'].includes(r.job)));
    } else if (s.writer === 'claude') {
      for (const [job, task] of [['Whole stories', 'story'], ['Chapters', 'chapter'], ['Coloring captions', 'captions']]) {
        const model = s.claudeModel || modelPicker.pickClaudeModel({ task, tier: s.tier });
        rows.push({ job, model: `Claude ${model}`, fallbacks: [], reason: s.claudeModel ? 'You chose this model.' : `Claude Code’s ${model} model suits this job at the ${tierName} setting.` });
      }
    } else if (s.writer === 'chatgpt') {
      const list = await chatGptModelList().catch(() => []);
      for (const [job, task] of [['Whole stories', 'story'], ['Chapters', 'chapter'], ['Coloring captions', 'captions']]) {
        const slug = s.chatgptModel || modelPicker.pickChatGptModel({ models: list, task, tier: s.tier });
        const name = list.find((m) => m.slug === slug)?.display_name || slug;
        if (slug) rows.push({ job, model: name, fallbacks: [], reason: s.chatgptModel ? 'You chose this model.' : 'From the models your ChatGPT plan offers, in OpenAI’s recommended order.' });
      }
    } else if (s.model) rows.push(pinned('Writing', s.model));
    if (s.pictures === 'openrouter') {
      if (s.orImageModel) rows.push(pinned('Pictures', s.orImageModel));
      else rows.push(...(await fromOpenRouter()).filter((r) => ['Pictures', 'Coloring pages'].includes(r.job)));
    } else if (s.pictures === 'fal') {
      if (s.falImageModel) rows.push(pinned('Pictures', s.falImageModel));
      else rows.push(...(await getFal().recommendations({ tier: s.tier }).catch(() => [])));
    } else if (s.imageModel) rows.push(pinned('Pictures', s.imageModel));
    if (s.voices === 'openrouter') {
      if (s.orSpeechModel) rows.push(pinned('Narration', s.orSpeechModel));
      else rows.push(...(await fromOpenRouter()).filter((r) => r.job === 'Narration'));
    } else if (s.speechModel) rows.push(pinned('Narration', s.speechModel));
    return rows;
  }

  // Self-test only (useTestServices): forget every client and cache, so the next call uses the test addresses.
  function reset() {
    openRouter = null; chatGpt = null; claudeCode = null; claudeStatusCache = null; chatGptModels = null; fal = null;
  }

  return {
    generateStory, generateChapter, generateScenePrompts, generateImage, generateSpeech, aiRecommendations,
    getChatGpt, chatGptModelList, claudeStatus,
    forgetChatGptModels: () => { chatGptModels = null; },
    forgetClaudeStatus: () => { claudeStatusCache = null; },
    reset,
  };
}

module.exports = { createAiServices };
