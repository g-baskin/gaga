'use strict';
const { app, BrowserWindow, Menu, dialog, ipcMain, protocol, safeStorage, session, shell } = require('electron');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createStore } = require('./storage.cjs');
const { buildEpub, collectImages } = require('./epub.cjs');
const modelPicker = require('./ai/model-picker.cjs');
const { createOpenRouter } = require('./ai/openrouter.cjs');
const { createChatGpt } = require('./ai/chatgpt.cjs');
const { createClaudeCode } = require('./ai/claude-code.cjs');
const { createFal } = require('./ai/fal.cjs');
const { createUpdater, UpdateError, installTarget, startInstall } = require('./updater.cjs');

const selfTest = process.argv.includes('--self-test');
app.setName('Storyloom');
if (selfTest) {
  app.setPath('userData', fsSync.mkdtempSync(path.join(os.tmpdir(), 'storyloom-self-test-')));
  // A fake microphone lets the self-test exercise recording; the permission handler still decides access.
  app.commandLine.appendSwitch('use-fake-device-for-media-stream');
  // Encrypt test secrets with a throwaway key instead of the real macOS keychain.
  app.commandLine.appendSwitch('use-mock-keychain');
}
// Removes the self-test's temporary data folder (only ever a mkdtemp folder) unless --keep-data is passed.
function cleanSelfTestData() {
  const dir = app.getPath('userData');
  if (!selfTest || process.argv.includes('--keep-data') || !path.basename(dir).startsWith('storyloom-self-test-')) return;
  try { fsSync.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

const RENDERER = path.join(__dirname, 'renderer');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.webm': 'audio/webm',
};
let win;
let store;
let allowClose = false;
let lastExport = null;

// --- IPC: only the app's own top-level page may call these. ---
function handle(channel, fn) {
  ipcMain.handle(channel, (event, ...args) => {
    const frame = event.senderFrame;
    if (!win || event.sender !== win.webContents || frame !== win.webContents.mainFrame || !frame.url.startsWith('app://local/')) {
      throw new Error('Untrusted caller');
    }
    return fn(event, ...args);
  });
}

// --- Optional AI services. Keys and sign-ins stay in this process; the page only sees what is connected. ---
// Writing: your own OpenAI-compatible service, OpenRouter, your ChatGPT plan, or your Claude Code subscription.
// Pictures and voices: your own service or OpenRouter (ChatGPT and Claude plans don't cover them).
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
const MODEL = /^[\w.:/@-]{1,200}$/;
const VOICE = /^[\w.:-]{1,80}$/;
const WRITERS = ['custom', 'openrouter', 'chatgpt', 'claude'];
// Pictures: OpenRouter, fal.ai, or your own service. Voices: OpenRouter or your own service.
const PICTURES = ['custom', 'openrouter', 'fal'];
const VOICES = ['custom', 'openrouter'];
async function readSettings() {
  const str = (v) => (typeof v === 'string' ? v : '');
  const one = (v, list, fallback) => (list.includes(v) ? v : fallback);
  let raw = {};
  try { raw = JSON.parse(await fs.readFile(settingsFile(), 'utf8')) || {}; } catch { /* first run */ }
  return {
    baseUrl: str(raw.baseUrl), model: str(raw.model), imageModel: str(raw.imageModel), speechModel: str(raw.speechModel),
    voice: str(raw.voice), apiKeyEnc: str(raw.apiKeyEnc),
    writer: one(raw.writer, WRITERS, 'custom'), pictures: one(raw.pictures, PICTURES, 'custom'), voices: one(raw.voices, VOICES, 'custom'),
    tier: one(raw.tier, modelPicker.TIERS, 'balanced'),
    openrouterKeyEnc: str(raw.openrouterKeyEnc), orTextModel: str(raw.orTextModel), orImageModel: str(raw.orImageModel), orSpeechModel: str(raw.orSpeechModel),
    falKeyEnc: str(raw.falKeyEnc), falImageModel: str(raw.falImageModel),
    chatgptModel: str(raw.chatgptModel), claudeModel: str(raw.claudeModel), claudePath: str(raw.claudePath),
    checkUpdates: raw.checkUpdates !== false, // on unless turned off
  };
}
function checkBaseUrl(value) {
  if (!value) return '';
  let url;
  try { url = new URL(value); } catch { throw new Error('Enter a full address, like https://api.openai.com/v1'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!(url.protocol === 'https:' || (url.protocol === 'http:' && local))) {
    throw new Error('Use https — plain http is only allowed for a service running on this computer');
  }
  if (url.username || url.password) throw new Error('Put credentials in the API key field, not the address');
  url.hash = '';
  url.search = '';
  return url.toString().replace(/\/+$/, '');
}
function checkModel(value, label) {
  const model = typeof value === 'string' ? value.trim() : '';
  if (model && !MODEL.test(model)) throw new Error(`${label} names may only contain letters, numbers, and . : / @ - _`);
  return model;
}
function encryptSecret(value, label) {
  const secret = typeof value === 'string' ? value.trim() : '';
  if (secret.length > 1000) throw new Error(`That ${label} is too long`);
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure key storage is unavailable on this computer');
  return safeStorage.encryptString(secret).toString('base64');
}
const decryptSecret = (enc) => (enc ? safeStorage.decryptString(Buffer.from(enc, 'base64')) : '');
async function writePrivate(file, text) {
  const temp = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(temp, text, { mode: 0o600 });
    await fs.rename(temp, file);
  } catch (error) {
    await fs.rm(temp, { force: true });
    throw error;
  }
}
// Each save reads the current settings, changes them, and writes them back, so saves must not overlap.
let settingsQueue = Promise.resolve();
function saveSettings(input = {}) {
  const next = settingsQueue.then(() => saveSettingsNow(input));
  settingsQueue = next.catch(() => {});
  return next;
}
async function saveSettingsNow(input = {}) {
  const current = await readSettings();
  const keep = (key) => (key in input ? input[key] : current[key]);
  const voice = typeof keep('voice') === 'string' ? keep('voice').trim() : '';
  if (voice && !VOICE.test(voice)) throw new Error('Voice names may only contain letters, numbers, and . : - _');
  const choose = (key, list, label) => {
    const value = keep(key);
    if (!list.includes(value)) throw new Error(`Choose a service for ${label}`);
    return value;
  };
  const claudePath = typeof keep('claudePath') === 'string' ? keep('claudePath').trim() : '';
  if (claudePath && (!path.isAbsolute(claudePath) || claudePath.length > 1000)) throw new Error('The Claude Code location must be a full path, like /usr/local/bin/claude');
  const next = {
    baseUrl: checkBaseUrl(typeof input.baseUrl === 'string' ? input.baseUrl.trim() : current.baseUrl),
    model: checkModel(keep('model'), 'Model'),
    imageModel: checkModel(keep('imageModel'), 'Picture model'),
    speechModel: checkModel(keep('speechModel'), 'Voice model'),
    voice,
    apiKeyEnc: current.apiKeyEnc,
    writer: choose('writer', WRITERS, 'writing'),
    pictures: choose('pictures', PICTURES, 'pictures'),
    voices: choose('voices', VOICES, 'voices'),
    tier: choose('tier', modelPicker.TIERS, 'the budget'),
    openrouterKeyEnc: current.openrouterKeyEnc,
    orTextModel: checkModel(keep('orTextModel'), 'Model'),
    orImageModel: checkModel(keep('orImageModel'), 'Picture model'),
    falKeyEnc: current.falKeyEnc,
    falImageModel: checkModel(keep('falImageModel'), 'Picture model'),
    orSpeechModel: checkModel(keep('orSpeechModel'), 'Voice model'),
    chatgptModel: checkModel(keep('chatgptModel'), 'Model'),
    claudeModel: checkModel(keep('claudeModel'), 'Model'),
    claudePath,
    checkUpdates: 'checkUpdates' in input ? input.checkUpdates === true : current.checkUpdates,
  };
  if (input.clearKey) next.apiKeyEnc = '';
  if (typeof input.apiKey === 'string' && input.apiKey.trim()) next.apiKeyEnc = encryptSecret(input.apiKey, 'API key');
  if (input.clearOpenrouterKey) next.openrouterKeyEnc = '';
  if (typeof input.openrouterKey === 'string' && input.openrouterKey.trim()) next.openrouterKeyEnc = encryptSecret(input.openrouterKey, 'OpenRouter key');
  if (input.clearFalKey) next.falKeyEnc = '';
  if (typeof input.falKey === 'string' && input.falKey.trim()) next.falKeyEnc = encryptSecret(input.falKey, 'fal.ai key');
  await writePrivate(settingsFile(), JSON.stringify(next));
  if (next.claudePath !== current.claudePath) claudeStatusCache = null;
  return publicSettings(next);
}
const publicSettings = (s) => ({
  baseUrl: s.baseUrl, model: s.model, imageModel: s.imageModel, speechModel: s.speechModel, voice: s.voice, hasKey: Boolean(s.apiKeyEnc),
  writer: s.writer, pictures: s.pictures, voices: s.voices, tier: s.tier, hasOpenrouterKey: Boolean(s.openrouterKeyEnc),
  orTextModel: s.orTextModel, orImageModel: s.orImageModel, orSpeechModel: s.orSpeechModel,
  hasFalKey: Boolean(s.falKeyEnc), falImageModel: s.falImageModel,
  chatgptModel: s.chatgptModel, claudeModel: s.claudeModel, claudePath: s.claudePath,
  checkUpdates: s.checkUpdates,
});

// Test-only service addresses, set by the self-test runner. They exist only in --self-test, so a real
// install always talks to the real services.
const testUrls = {};
const testUrl = (name) => (selfTest ? testUrls[name] : undefined);
function useTestServices(urls) {
  if (!selfTest) throw new Error('Test services are only available in the self-test');
  Object.assign(testUrls, urls);
  openRouter = null; chatGpt = null; claudeCode = null; claudeStatusCache = null; chatGptModels = null; fal = null;
  updater = null; pendingUpdate = null;
  discardReadyUpdate();
  setUpdateState({ phase: 'idle' }); // also tells the screen, so its buttons match
}
let openRouter = null;
let fal = null;

// In-app updates (see updater.cjs). One state, shared with the screen through 'app:update-state' messages:
// idle | checking | up-to-date | available | downloading | ready | installing | failed.
// The self-test never contacts GitHub: it uses a local fake, or nothing.
let updater = null;
let pendingUpdate = null; // the verified result of the last check, needed to download it
let readyUpdate = null; // { appPath, workdir, version } once downloaded and verified
let updateState = { phase: 'idle' };
function setUpdateState(next) {
  updateState = { ...next, current: app.getVersion() };
  win?.webContents.send('app:update-state', updateState);
  return updateState;
}
const friendly = (error, fallback) => (error instanceof UpdateError ? error.message : fallback);
// Deletes a downloaded update that won't be installed (its folder is always one we created in the temp folder).
function discardReadyUpdate() {
  const dir = readyUpdate?.workdir;
  readyUpdate = null;
  if (dir && path.basename(dir).startsWith('storyloom-update-')) {
    try { fsSync.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
  }
}
function getUpdater() {
  updater ||= createUpdater({
    currentVersion: app.getVersion(),
    ...(selfTest && testUrls.STORYLOOM_TEST_UPDATES ? {
      feedUrl: `${testUrls.STORYLOOM_TEST_UPDATES}/latest.json`,
      downloadBase: `${testUrls.STORYLOOM_TEST_UPDATES}/download/`,
      allowHost: (host) => host === '127.0.0.1',
      ...(testUrls.STORYLOOM_TEST_UPDATE_KEY ? { trustedKeys: [testUrls.STORYLOOM_TEST_UPDATE_KEY] } : {}),
    } : {}),
  });
  return updater;
}
async function checkForUpdate({ manual = false } = {}) {
  if (['checking', 'downloading', 'installing'].includes(updateState.phase)) return updateState;
  if (updateState.phase === 'ready') return updateState;
  if (!manual && !(await readSettings()).checkUpdates) return setUpdateState({ phase: 'idle', disabled: true });
  if (selfTest && !testUrls.STORYLOOM_TEST_UPDATES) return setUpdateState({ phase: 'idle' });
  setUpdateState({ phase: 'checking' });
  try {
    const result = await getUpdater().check();
    if (result.status !== 'available') {
      pendingUpdate = null;
      return setUpdateState({ phase: 'up-to-date', checkedAt: Date.now() });
    }
    pendingUpdate = result;
    return setUpdateState({ phase: 'available', version: result.version, notesUrl: result.notesUrl });
  } catch (error) {
    pendingUpdate = null;
    // A background check that fails says nothing; a check the user asked for explains why.
    return setUpdateState(manual ? { phase: 'failed', message: friendly(error, 'Could not check for updates') } : { phase: 'idle' });
  }
}
async function downloadUpdate() {
  if (updateState.phase !== 'available' || !pendingUpdate) throw new Error('There is no update to download');
  const update = pendingUpdate;
  setUpdateState({ phase: 'downloading', version: update.version, percent: 0 });
  try {
    readyUpdate = await getUpdater().download(update, {
      onProgress: (percent) => setUpdateState({ phase: 'downloading', version: update.version, percent }),
    });
    return setUpdateState({ phase: 'ready', version: update.version });
  } catch (error) {
    return setUpdateState({ phase: 'failed', message: friendly(error, 'The update couldn’t be downloaded'), version: update.version });
  }
}
async function installUpdate() {
  if (updateState.phase !== 'ready' || !readyUpdate) throw new Error('No update is ready to install');
  const ready = readyUpdate;
  // The self-test can't replace the running Electron, so it checks everything up to the swap and stops there.
  if (selfTest) {
    setUpdateState({ phase: 'installing', version: ready.version });
    return { ...updateState, staged: ready.appPath };
  }
  const where = await installTarget(process.execPath);
  if (!where.ok) return setUpdateState({ phase: 'failed', message: where.reason, version: ready.version });
  setUpdateState({ phase: 'installing', version: ready.version });
  try {
    startInstall({ pid: process.pid, target: where.target, staged: ready });
  } catch (error) {
    return setUpdateState({ phase: 'failed', message: friendly(error, 'The update couldn’t be installed'), version: ready.version });
  }
  // Quit through the normal close path, so open books save first. The helper swaps the app and reopens it.
  setTimeout(() => app.quit(), 200);
  return updateState;
}
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
    throw new Error(error.name === 'TimeoutError' ? 'The AI service took too long to answer' : 'Could not reach the AI service');
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

// Generates a picture and stores it in the book. Returns the new asset name.
async function generateImage(input = {}) {
  const book = await store.read(input.bookId);
  const prompt = clip(input.prompt, 3000);
  if (!prompt) throw new Error('Describe the picture first');
  const style = clip(input.style, 200);
  const lineArt = Boolean(input.lineArt);
  const fullPrompt = lineArt
    ? `Black and white line art coloring page for children, clean bold outlines, no shading, white background: ${prompt}`
    : `Children's picture-book illustration${style ? ` in a ${style} style` : ''}: ${prompt}`;
  const settings = await readSettings();
  if (settings.pictures === 'openrouter') {
    const { bytes } = await getOpenRouter().image({ prompt: fullPrompt, tier: settings.tier, lineArt, model: settings.orImageModel });
    return store.saveImageBytes(book.id, bytes);
  }
  if (settings.pictures === 'fal') {
    const { bytes } = await getFal().image({ prompt: fullPrompt, tier: settings.tier, lineArt, model: settings.falImageModel });
    return store.saveImageBytes(book.id, bytes);
  }
  const { data } = await aiRequest('/images/generations', {
    prompt: fullPrompt, n: 1, size: '1024x1024', response_format: 'b64_json',
  }, { needs: 'imageModel', maxBytes: 40_000_000, timeout: 180000 });
  const b64 = data?.data?.[0]?.b64_json;
  if (typeof b64 !== 'string') throw new Error('The picture service did not return an image');
  return store.saveImageBytes(book.id, Buffer.from(b64, 'base64'));
}

// Reads text aloud with the chosen voice service and stores the sound in the book.
async function generateSpeech(input = {}) {
  const book = await store.read(input.bookId);
  const text = clip(input.text, 4000);
  if (!text) throw new Error('This page has no words to read aloud');
  const settings = await readSettings();
  const voice = typeof input.voice === 'string' && VOICE.test(input.voice) ? input.voice : settings.voice || 'alloy';
  if (settings.voices === 'openrouter') {
    const { bytes } = await getOpenRouter().speech({ text, tier: settings.tier, voice, model: settings.orSpeechModel });
    return store.saveAudioBytes(book.id, bytes);
  }
  const { data } = await aiRequest('/audio/speech', { input: text, voice, response_format: 'mp3' },
    { needs: 'speechModel', maxBytes: 100_000_000, binary: true, timeout: 180000 });
  return store.saveAudioBytes(book.id, data);
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

// --- Export helpers ---
const safeTitle = (value) => (typeof value === 'string' ? value : '').replace(/[\\/:*?"<>|\x00-\x1f]/g, '').trim().slice(0, 100) || 'Story';
// Asks where to save (or uses a fixed file during the self-test). Returns null if cancelled.
async function chooseSaveFile(title, ext, label) {
  if (selfTest) return path.join(app.getPath('userData'), `self-test.${ext}`);
  const result = await dialog.showSaveDialog(win, {
    defaultPath: path.join(app.getPath('documents'), `${safeTitle(title)}.${ext}`), filters: [{ name: label, extensions: [ext] }],
  });
  return result.canceled || !result.filePath ? null : result.filePath;
}
// Self-test only: the next file an "open" dialog would return (null acts like Cancel).
let selfTestOpenFile = null;
async function chooseOpenFile(name, extensions) {
  if (selfTest) { const file = selfTestOpenFile; selfTestOpenFile = null; return file; }
  const result = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name, extensions }] });
  return result.canceled || !result.filePaths[0] ? null : result.filePaths[0];
}
function toBuffer(bytes, max, label) {
  if (!(bytes instanceof Uint8Array) && !(bytes instanceof ArrayBuffer)) throw new Error(`${label} data is missing`);
  const buffer = Buffer.from(bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes);
  if (buffer.length > max) throw new Error(`${label} is too large`);
  return buffer;
}
const ISO_LANG = { english: 'en', spanish: 'es', french: 'fr', german: 'de', italian: 'it', portuguese: 'pt', dutch: 'nl', polish: 'pl', swedish: 'sv', japanese: 'ja', chinese: 'zh', korean: 'ko', arabic: 'ar', hindi: 'hi' };

async function exportEpub(input = {}) {
  const book = await store.read(input.bookId);
  const pages = Array.isArray(input.pages) ? input.pages.slice(0, 500) : [];
  if (pages.length === 0) throw new Error('The book has no pages');
  const bodies = pages.map((p, i) => {
    const body = typeof p?.body === 'string' ? p.body : '';
    if (body.length > 2_000_000) throw new Error(`Page ${i + 1} is too large`);
    if (/<script|\son\w+=|javascript:/i.test(body)) throw new Error('Pages may not contain scripts');
    return { body, label: clip(p?.label, 100) || `Page ${i + 1}` };
  });
  const css = typeof input.css === 'string' ? input.css.slice(0, 2_000_000) : '';
  if (/@import|url\(\s*['"]?(?!images\/)/i.test(css)) throw new Error('The stylesheet may only reference book images');
  // Only images that really exist in this book's folder are packaged; references to missing ones are dropped.
  const packed = await collectImages({ pages: bodies, css, read: (name) => fs.readFile(store.mediaPath(book.id, name)) });
  const { images } = packed;
  const coverFirst = typeof input.coverImage === 'string' ? images.findIndex((img) => img.name === input.coverImage) : -1;
  if (coverFirst > 0) images.unshift(...images.splice(coverFirst, 1));
  const width = Math.min(4000, Math.max(100, Math.round(Number(input.width) || 816)));
  const height = Math.min(4000, Math.max(100, Math.round(Number(input.height) || 816)));
  const epub = buildEpub({
    book: { id: book.id, title: book.title, author: book.author, isbn: book.isbn, language: ISO_LANG[book.language.toLowerCase()] || 'en', modified: new Date() },
    pages: packed.pages, css: packed.css, width, height, images,
  });
  const file = await chooseSaveFile(book.title, 'epub', 'EPUB book');
  if (!file) return null;
  await fs.writeFile(file, epub);
  lastExport = file;
  return path.basename(file);
}

// --- Window and handlers ---
function registerHandlers() {
  handle('books:list', () => store.list());
  handle('books:create', (_e, input) => store.create(input && typeof input === 'object' ? input : {}));
  handle('books:read', (_e, id) => store.read(id));
  handle('books:save', (_e, book) => store.save(book));
  handle('books:rename', (_e, id, title) => store.rename(id, title));
  handle('books:duplicate', (_e, id, overrides) => {
    const allowed = {};
    if (overrides && typeof overrides === 'object') {
      if (typeof overrides.title === 'string') allowed.title = overrides.title;
      if (overrides.kind === 'coloring' || overrides.kind === 'story') allowed.kind = overrides.kind;
    }
    return store.duplicate(id, allowed);
  });
  handle('books:delete', async (_e, id) => {
    const book = await store.read(id);
    if (!selfTest) {
      const { response } = await dialog.showMessageBox(win, {
        type: 'warning', buttons: ['Move to Trash', 'Cancel'], defaultId: 1, cancelId: 1,
        message: `Move “${book.title}” to the Trash?`, detail: 'You can restore it from the Trash in Finder.',
      });
      if (response !== 0) return false;
    }
    await store.remove(id, (dir) => (selfTest ? fs.rm(dir, { recursive: true }) : shell.trashItem(dir)));
    return true;
  });
  handle('books:list-images', (_e, id) => store.listImages(id));
  handle('books:import-image', async (_e, id) => {
    await store.read(id);
    const file = await chooseOpenFile('Images', ['png', 'jpg', 'jpeg', 'webp', 'gif']);
    return file ? store.importImage(id, file) : null;
  });
  handle('books:save-image', (_e, id, bytes) => store.saveImageBytes(id, toBuffer(bytes, 25 * 1024 * 1024, 'The picture')));
  handle('books:list-audio', (_e, id) => store.listAudio(id));
  handle('books:import-audio', async (_e, id) => {
    await store.read(id);
    const file = await chooseOpenFile('Sounds', ['wav', 'mp3', 'm4a', 'aac', 'ogg', 'oga', 'webm']);
    return file ? store.importAudio(id, file) : null;
  });
  handle('books:save-recording', (_e, id, bytes) => store.saveAudioBytes(id, toBuffer(bytes, 100 * 1024 * 1024, 'The recording')));
  handle('import:story-text', async () => {
    const file = await chooseOpenFile('Story text', ['txt', 'md', 'markdown']);
    if (!file) return null;
    return { name: path.basename(file).replace(/\.[^.]+$/, '').slice(0, 200), text: await store.readStoryText(file) };
  });
  handle('shelves:list', () => store.listShelves());
  handle('shelves:save', (_e, shelves) => store.saveShelves(shelves));
  handle('characters:list', () => store.listCharacters());
  handle('characters:save', (_e, character, bookId) => store.saveCharacter(character, bookId));
  handle('characters:delete', (_e, id) => store.deleteCharacter(id));
  handle('characters:insert', (_e, bookId, characterId) => store.insertCharacter(bookId, characterId));
  handle('profile:get', () => store.getProfile());
  handle('profile:save', (_e, input) => store.saveProfile(input));
  handle('books:export-pdf', async (event, input = {}) => {
    const mode = input.mode === 'print' ? 'print' : 'digital';
    const file = await chooseSaveFile(input.title, 'pdf', 'PDF');
    if (!file) return null;
    const pdf = await event.sender.printToPDF({ printBackground: true, preferCSSPageSize: true, margins: { marginType: 'none' } });
    const target = selfTest && mode === 'print' ? file.replace(/\.pdf$/, '-print.pdf') : file;
    await fs.writeFile(target, pdf);
    lastExport = target;
    return path.basename(target);
  });
  handle('books:export-epub', (_e, input) => exportEpub(input && typeof input === 'object' ? input : {}));
  handle('books:export-wav', async (_e, input = {}) => {
    const wav = toBuffer(input.bytes, 1024 * 1024 * 1024, 'The audio');
    if (wav.subarray(0, 4).toString('latin1') !== 'RIFF' || wav.subarray(8, 12).toString('latin1') !== 'WAVE') throw new Error('The audio is not a WAV file');
    const file = await chooseSaveFile(input.title, 'wav', 'WAV audio');
    if (!file) return null;
    await fs.writeFile(file, wav);
    lastExport = file;
    return path.basename(file);
  });
  handle('books:reveal-export', () => { if (lastExport) shell.showItemInFolder(lastExport); });
  handle('app:open-data-folder', () => (selfTest ? true : shell.openPath(app.getPath('userData')).then((err) => !err)));
  handle('app:info', () => ({ version: app.getVersion(), dataFolder: app.getPath('userData'), platform: process.platform }));
  handle('app:update-state', () => updateState);
  handle('app:check-update', (_e, manual) => checkForUpdate({ manual: manual === true }));
  handle('app:download-update', () => downloadUpdate());
  handle('app:install-update', () => installUpdate());
  handle('app:open-update-notes', () => {
    if (!updateState.notesUrl) throw new Error('No release notes to open');
    if (!selfTest) shell.openExternal(updateState.notesUrl);
    return updateState.notesUrl;
  });
  handle('settings:get', async () => publicSettings(await readSettings()));
  // Invalid settings are an expected user mistake, so return the message instead of throwing
  // (a thrown handler error is logged by Electron as if the app had failed).
  handle('settings:save', async (_e, input) => {
    try {
      return { settings: await saveSettings(input && typeof input === 'object' ? input : {}) };
    } catch (error) {
      return { error: String(error?.message || error) };
    }
  });
  handle('ai:generate', (_e, input) => generateStory(input && typeof input === 'object' ? input : {}));
  handle('ai:chapter', (_e, input) => generateChapter(input && typeof input === 'object' ? input : {}));
  handle('ai:image', (_e, input) => generateImage(input && typeof input === 'object' ? input : {}));
  handle('ai:speech', (_e, input) => generateSpeech(input && typeof input === 'object' ? input : {}));
  // Expected failures (not signed in, declined, offline) come back as { error } rather than a logged exception.
  const soft = (fn) => async (...args) => {
    try { return { ok: await fn(...args) }; } catch (error) { return { error: String(error?.message || error) }; }
  };
  handle('ai:recommendations', soft(() => aiRecommendations()));
  handle('ai:chatgpt-status', soft(() => getChatGpt().status()));
  handle('ai:chatgpt-sign-in', soft(async () => { const result = await getChatGpt().signIn(); chatGptModels = null; return result; }));
  handle('ai:chatgpt-cancel', () => { getChatGpt().cancelSignIn(); return true; });
  handle('ai:chatgpt-welcomed', soft(() => getChatGpt().markWelcomed()));
  handle('ai:chatgpt-sign-out', soft(async () => { chatGptModels = null; return getChatGpt().signOut(); }));
  handle('ai:chatgpt-models', soft(() => chatGptModelList(true)));
  handle('ai:claude-status', soft((_e, force) => claudeStatus(force === true)));
  handle('ai:open-link', (_e, name) => {
    const links = {
      'chatgpt-usage': 'https://chatgpt.com/settings/usage',
      'openrouter-keys': 'https://openrouter.ai/settings/keys',
      'fal-keys': 'https://fal.ai/dashboard/keys',
      source: 'https://github.com/g-baskin/gaga',
      'claude-code': 'https://claude.com/product/claude-code',
    };
    if (!links[name]) throw new Error('Unknown link');
    if (!selfTest) shell.openExternal(links[name]);
    return true;
  });
  handle('app:close-ready', () => { allowClose = true; setImmediate(() => win?.close()); });
}

// Undo/redo go to the page, which decides between text-field undo and designer undo.
function buildMenu() {
  const send = (action) => () => win?.webContents.send('menu:action', action);
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    { role: 'fileMenu' },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: send('undo') },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', click: send('redo') },
        { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' }, { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
  ]));
}

async function serve(request) {
  const url = new URL(request.url);
  const headers = { 'X-Content-Type-Options': 'nosniff' };
  try {
    if (request.method !== 'GET') return new Response(null, { status: 405 });
    if (url.host === 'local') {
      const name = decodeURIComponent(url.pathname) === '/' ? '/index.html' : decodeURIComponent(url.pathname);
      const file = path.resolve(RENDERER, `.${name}`);
      const relative = path.relative(RENDERER, file);
      if (relative.startsWith('..') || path.isAbsolute(relative)) return new Response(null, { status: 403 });
      return new Response(await fs.readFile(file), { headers: { ...headers, 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' } });
    }
    if (url.host === 'media') {
      const parts = url.pathname.split('/');
      if (parts.length !== 3) return new Response(null, { status: 404 });
      const file = store.mediaPath(parts[1], decodeURIComponent(parts[2]));
      // The page reads pixels/samples (line art, audio mixing), so allow our own origin to read media.
      Object.assign(headers, { 'Content-Type': MIME[path.extname(file)], 'Access-Control-Allow-Origin': 'app://local', 'Accept-Ranges': 'bytes' });
      const data = await fs.readFile(file);
      const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '');
      if (range && (range[1] || range[2])) {
        let start = range[1] ? Number(range[1]) : Math.max(0, data.length - Number(range[2]));
        let end = range[1] && range[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1;
        if (start >= data.length || start > end) {
          return new Response(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${data.length}` } });
        }
        start = Math.max(0, start);
        end = Math.max(start, end);
        return new Response(data.subarray(start, end + 1), {
          status: 206, headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${data.length}`, 'Content-Length': String(end - start + 1) },
        });
      }
      return new Response(data, { headers: { ...headers, 'Content-Length': String(data.length) } });
    }
  } catch { /* fall through */ }
  return new Response(null, { status: 404 });
}

app.whenReady().then(async () => {
  store = createStore(app.getPath('userData'));
  const ses = session.defaultSession;
  // Only the microphone, only audio, only for the app's own page (Studio narration). Everything else is denied.
  const isOwnPage = (wc, url) => Boolean(win) && wc === win.webContents && typeof url === 'string' && url.startsWith('app://local/');
  ses.setPermissionRequestHandler((wc, permission, callback, details) => {
    const types = details?.mediaTypes || [];
    callback(permission === 'media' && types.length > 0 && types.every((t) => t === 'audio') && isOwnPage(wc, details.requestingUrl));
  });
  ses.setPermissionCheckHandler((wc, permission, origin, details) =>
    permission === 'media' && details?.mediaType === 'audio' && origin === 'app://local' && isOwnPage(wc, details?.requestingUrl || 'app://local/'));
  // The page itself never talks to the internet; only the main process does, for the optional generator.
  ses.webRequest.onBeforeRequest((details, callback) => {
    const scheme = details.url.slice(0, details.url.indexOf(':') + 1);
    callback({ cancel: !['app:', 'data:', 'blob:', 'devtools:'].includes(scheme) });
  });
  protocol.handle('app', serve);
  registerHandlers();
  buildMenu();

  win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1100, minHeight: 700, title: 'Storyloom',
    backgroundColor: '#faf6ef',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true, sandbox: true, nodeIntegration: false, webviewTag: false,
    },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event) => event.preventDefault());
  win.on('close', (event) => {
    if (allowClose) return;
    event.preventDefault();
    win.webContents.send('app:before-close');
    setTimeout(() => { allowClose = true; win?.close(); }, 3000); // Never trap the user if saving hangs.
  });
  win.on('closed', () => { win = null; });
  await win.loadURL('app://local/index.html');
  if (selfTest) {
    try {
      await require('./selftest/index.cjs').run({ app, win, store, argv: process.argv, root: __dirname, setOpenFile: (file) => { selfTestOpenFile = file; }, useTestServices });
      cleanSelfTestData();
      app.exit(0);
    } catch (error) {
      console.error('SELF_TEST_FAILED', error.message);
      cleanSelfTestData();
      app.exit(1);
    }
  }
}).catch((error) => { console.error(error); app.exit(1); });

app.on('window-all-closed', () => app.quit());
// A downloaded update that wasn't installed is deleted on quit (the installer cleans up its own).
app.on('will-quit', () => { if (updateState.phase !== 'installing') discardReadyUpdate(); });
