'use strict';
const { app, BrowserWindow, Menu, dialog, ipcMain, protocol, safeStorage, session, shell } = require('electron');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createStore } = require('./storage.cjs');
const { buildEpub } = require('./epub.cjs');

const selfTest = process.argv.includes('--self-test');
app.setName('Storyloom');
if (selfTest) {
  app.setPath('userData', fsSync.mkdtempSync(path.join(os.tmpdir(), 'storyloom-self-test-')));
  // A fake microphone lets the self-test exercise recording; the permission handler still decides access.
  app.commandLine.appendSwitch('use-fake-device-for-media-stream');
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

// --- Optional AI services (any OpenAI-compatible service). The key never reaches the page. ---
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
const MODEL = /^[\w.:/@-]{1,200}$/;
const VOICE = /^[\w.-]{1,60}$/;
async function readSettings() {
  const str = (v) => (typeof v === 'string' ? v : '');
  try {
    const raw = JSON.parse(await fs.readFile(settingsFile(), 'utf8'));
    return {
      baseUrl: str(raw.baseUrl), model: str(raw.model), imageModel: str(raw.imageModel), speechModel: str(raw.speechModel),
      voice: str(raw.voice), apiKeyEnc: str(raw.apiKeyEnc),
    };
  } catch {
    return { baseUrl: '', model: '', imageModel: '', speechModel: '', voice: '', apiKeyEnc: '' };
  }
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
async function saveSettings(input = {}) {
  const current = await readSettings();
  const voice = typeof input.voice === 'string' ? input.voice.trim() : current.voice;
  if (voice && !VOICE.test(voice)) throw new Error('Voice names may only contain letters, numbers, and . - _');
  const keep = (key) => (key in input ? input[key] : current[key]);
  const next = {
    baseUrl: checkBaseUrl(typeof input.baseUrl === 'string' ? input.baseUrl.trim() : current.baseUrl),
    model: checkModel(keep('model'), 'Model'),
    imageModel: checkModel(keep('imageModel'), 'Picture model'),
    speechModel: checkModel(keep('speechModel'), 'Voice model'),
    voice,
    apiKeyEnc: current.apiKeyEnc,
  };
  if (input.clearKey) next.apiKeyEnc = '';
  const key = typeof input.apiKey === 'string' ? input.apiKey.trim() : '';
  if (key) {
    if (key.length > 1000) throw new Error('That API key is too long');
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure key storage is unavailable on this computer');
    next.apiKeyEnc = safeStorage.encryptString(key).toString('base64');
  }
  await fs.writeFile(settingsFile(), JSON.stringify(next), { mode: 0o600 });
  return publicSettings(next);
}
const publicSettings = (s) => ({
  baseUrl: s.baseUrl, model: s.model, imageModel: s.imageModel, speechModel: s.speechModel, voice: s.voice, hasKey: Boolean(s.apiKeyEnc),
});

// Calls the configured service. Only the user's own address, no redirects, bounded time and size.
async function aiRequest(endpoint, body, { needs, maxBytes = 2_000_000, binary = false, timeout = 120000 }) {
  const settings = await readSettings();
  const model = settings[needs];
  if (!settings.baseUrl || !model) {
    const what = { model: 'a writing model', imageModel: 'a picture model', speechModel: 'a voice model' }[needs];
    throw new Error(`Set up ${what} in Account → AI services first`);
  }
  const headers = { 'Content-Type': 'application/json' };
  if (settings.apiKeyEnc) headers.Authorization = `Bearer ${safeStorage.decryptString(Buffer.from(settings.apiKeyEnc, 'base64'))}`;
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

async function chatJson(system, user, maxTokens) {
  const { data } = await aiRequest('/chat/completions', {
    temperature: 0.8, ...(maxTokens ? { max_tokens: maxTokens } : {}),
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
  }, { needs: 'model' });
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('The AI service response was not understood');
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  try { return JSON.parse(content.slice(start, end + 1)); } catch { throw new Error('The AI service did not answer in the expected format — try again'); }
}

// Writes a whole story from the Story builder (or the quick idea box).
async function generateStory(input = {}) {
  const idea = clip(input.idea, 4000);
  if (!idea) throw new Error('Describe your story idea first');
  const level = LEVEL_TEXT[input.readingLevel] || (typeof input.readingLevel === 'string' ? `ages ${clip(input.readingLevel, 20)}` : LEVEL_TEXT['early-reader']);
  const count = Math.min(30, Math.max(3, Math.round(Number(input.pages) || LENGTH_PAGES[input.length] || 10)));
  const characters = (Array.isArray(input.characters) ? input.characters.slice(0, 12) : [])
    .map((c) => [clip(c?.name, 80), clip(c?.role, 80), clip(c?.description, 400)].filter(Boolean).join(' — ')).filter(Boolean);
  const details = [
    ['Title', clip(input.title, 200)], ['Genre', clip(input.genre, 60)],
    ['Writing style', (Array.isArray(input.writingStyle) ? input.writingStyle.slice(0, 8).map((w) => clip(w, 40)) : []).join(', ')],
    ['Setting', clip(input.location, 200)], ['Time period', clip(input.era, 200)], ['Also include', clip(input.extras, 2000)],
    ['Language', clip(input.language, 40) || 'English'], ['Reader level', level], ['Number of pages', String(count)],
    ['Characters', characters.join('; ')],
  ].filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
  const story = await chatJson(
    'You write original, warm picture-book stories for children. Reply with JSON only, no commentary, in this shape: {"title": string, "chapters": [{"title": string, "text": string}]}. Each chapter is one picture-book page of text suited to the reader level. Write in the requested language.',
    `Story idea: ${idea}\n${details}`,
  );
  const raw = Array.isArray(story.chapters) ? story.chapters
    : Array.isArray(story.pages) ? story.pages.map((text, i) => ({ title: `Page ${i + 1}`, text })) : [];
  const chapters = raw
    .map((c, i) => ({ title: clip(typeof c === 'string' ? `Page ${i + 1}` : c?.title, 200) || `Page ${i + 1}`, text: clip(typeof c === 'string' ? c : c?.text, 4000) }))
    .filter((c) => c.text).slice(0, count);
  if (chapters.length === 0) throw new Error('The AI service returned no pages — try again');
  return { title: clip(story.title, 200) || clip(input.title, 200) || 'My story', chapters, pages: chapters.map((c) => c.text) };
}

// Writes or rewrites one chapter in the Manuscript.
async function generateChapter(input = {}) {
  const wordLimit = Math.min(2000, Math.max(5, Math.round(Number(input.wordLimit) || 120)));
  const result = await chatJson(
    'You help write one chapter of an original children\'s picture book. Reply with JSON only: {"text": string}. Use plain text with blank lines between paragraphs. Stay within the word limit.',
    [
      `Book: ${clip(input.bookTitle, 200) || 'Untitled'}`,
      `Chapter: ${clip(input.chapterTitle, 200) || 'Untitled'}`,
      `Reader level: ${LEVEL_TEXT[input.readingLevel] || LEVEL_TEXT['early-reader']}`,
      `Language: ${clip(input.language, 40) || 'English'}`,
      `Word limit: ${wordLimit}`,
      input.context ? `Story so far:\n${clip(input.context, 6000)}` : '',
      input.current ? `Current chapter text to rewrite:\n${clip(input.current, 6000)}` : '',
      `Instruction: ${clip(input.instruction, 1000) || (input.current ? 'Rewrite this chapter so it reads more smoothly.' : 'Write this chapter.')}`,
    ].filter(Boolean).join('\n'),
  );
  const text = clip(result.text, 20000);
  if (!text) throw new Error('The AI service returned an empty chapter — try again');
  return { text };
}

// Generates a picture and stores it in the book. Returns the new asset name.
async function generateImage(input = {}) {
  const book = await store.read(input.bookId);
  const prompt = clip(input.prompt, 3000);
  if (!prompt) throw new Error('Describe the picture first');
  const style = clip(input.style, 200);
  const fullPrompt = input.lineArt
    ? `Black and white line art coloring page for children, clean bold outlines, no shading, white background: ${prompt}`
    : `Children's picture-book illustration${style ? ` in a ${style} style` : ''}: ${prompt}`;
  const { data } = await aiRequest('/images/generations', {
    prompt: fullPrompt, n: 1, size: '1024x1024', response_format: 'b64_json',
  }, { needs: 'imageModel', maxBytes: 40_000_000, timeout: 180000 });
  const b64 = data?.data?.[0]?.b64_json;
  if (typeof b64 !== 'string') throw new Error('The picture service did not return an image');
  return store.saveImageBytes(book.id, Buffer.from(b64, 'base64'));
}

// Reads text aloud with the configured voice model and stores the sound in the book.
async function generateSpeech(input = {}) {
  const book = await store.read(input.bookId);
  const text = clip(input.text, 4000);
  if (!text) throw new Error('This page has no words to read aloud');
  const saved = (await readSettings()).voice;
  const voice = typeof input.voice === 'string' && VOICE.test(input.voice) ? input.voice : saved || 'alloy';
  const { data } = await aiRequest('/audio/speech', { input: text, voice, response_format: 'mp3' },
    { needs: 'speechModel', maxBytes: 100_000_000, binary: true, timeout: 180000 });
  return store.saveAudioBytes(book.id, data);
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
  // Only images that really exist in this book's folder are packaged.
  const wanted = new Set();
  for (const { body } of bodies) for (const match of body.matchAll(/images\/([a-z0-9-]{1,64}\.(?:png|jpg|webp|gif))/g)) wanted.add(match[1]);
  for (const match of css.matchAll(/images\/([a-z0-9-]{1,64}\.(?:png|jpg|webp|gif))/g)) wanted.add(match[1]);
  const images = [];
  for (const name of wanted) images.push({ name, data: await fs.readFile(store.mediaPath(book.id, name)) });
  const coverFirst = typeof input.coverImage === 'string' ? images.findIndex((img) => img.name === input.coverImage) : -1;
  if (coverFirst > 0) images.unshift(...images.splice(coverFirst, 1));
  const width = Math.min(4000, Math.max(100, Math.round(Number(input.width) || 816)));
  const height = Math.min(4000, Math.max(100, Math.round(Number(input.height) || 816)));
  const epub = buildEpub({
    book: { id: book.id, title: book.title, author: book.author, isbn: book.isbn, language: ISO_LANG[book.language.toLowerCase()] || 'en', modified: new Date() },
    pages: bodies, css, width, height, images,
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
      await require('./selftest/index.cjs').run({ app, win, store, argv: process.argv, root: __dirname, setOpenFile: (file) => { selfTestOpenFile = file; } });
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
