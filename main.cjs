'use strict';
const { app, BrowserWindow, Menu, dialog, ipcMain, protocol, safeStorage, session, shell } = require('electron');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createStore, plainFsError } = require('./storage.cjs');
const { createLog } = require('./log.cjs');
const { createSettings } = require('./main/settings.cjs');
const { createUpdates } = require('./main/updates.cjs');
const { createAiServices } = require('./main/ai-services.cjs');
const { createExports } = require('./main/export.cjs');


const selfTest = process.argv.includes('--self-test');
app.setName('Storyloom');
if (selfTest) {
  app.setPath('userData', fsSync.mkdtempSync(path.join(os.tmpdir(), 'storyloom-self-test-')));
  // A fake microphone lets the self-test exercise recording; the permission handler still decides access.
  app.commandLine.appendSwitch('use-fake-device-for-media-stream');
  // Encrypt test secrets with a throwaway key instead of the real macOS keychain.
  app.commandLine.appendSwitch('use-mock-keychain');
}
// Errors go to a log on this Mac only (~/Library/Logs/Storyloom; the self-test's goes in its temp folder). Never sent anywhere.
app.setAppLogsPath(selfTest ? path.join(app.getPath('userData'), 'logs') : undefined);
const log = createLog(app.getPath('logs'));
process.on('uncaughtException', (error) => {
  log.error('Unexpected error in Storyloom', error);
  console.error(error);
  if (!selfTest) dialog.showErrorBox('Storyloom ran into a problem', `${error?.message || error}\n\nThe details were saved in Storyloom’s log (Account → Open log folder).`);
});
process.on('unhandledRejection', (reason) => { log.error('Unhandled promise rejection', reason); console.error(reason); });

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
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.webm': 'audio/webm',
};
let win;
let store;
let allowClose = false;

// --- IPC: only the app's own top-level page may call these. ---
function handle(channel, fn) {
  ipcMain.handle(channel, (event, ...args) => {
    const frame = event.senderFrame;
    if (!win || event.sender !== win.webContents || frame !== win.webContents.mainFrame || !frame.url.startsWith('app://local/')) {
      throw new Error('Untrusted caller');
    }
    // Disk errors reach the page in plain words (no file paths); the original stays attached as the cause.
    return Promise.resolve().then(() => fn(event, ...args)).catch((error) => { throw plainFsError(error); });
  });
}

// A saved file that can't be understood is set aside by readJsonFile (never overwritten). Say so, and where it went.
const SAVED_FILE_NAMES = {
  'settings.json': 'your AI and app settings', 'profile.json': 'your profile',
  'shelves.json': 'your shelves', 'characters.json': 'your character library',
};
function reportDamaged({ file, backup }) {
  log.warn(`Damaged saved file set aside: ${file}`, `Kept as ${backup}`);
  const what = SAVED_FILE_NAMES[path.basename(file)] || path.basename(file);
  const options = {
    type: 'warning',
    message: `Storyloom couldn’t read ${what}`,
    detail: `The saved file was damaged, so Storyloom started ${what} fresh. The damaged copy was kept as “${path.basename(backup)}” in ${path.dirname(backup)}.`,
  };
  (win ? dialog.showMessageBox(win, options) : dialog.showMessageBox(options)).catch((error) => console.error(error));
}
// A book folder whose book.json can't be read: left exactly as it is, and the user is told where it is.
function reportUnreadableBook({ id, folder }) {
  log.warn(`Book ${id} couldn’t be read, so it isn’t in the library`, folder);
  const options = {
    type: 'warning',
    message: 'One of your books couldn’t be opened',
    detail: `Its saved file is damaged or can’t be read, so it isn’t shown in your library. Nothing was deleted: the book is still in the folder “${id}” in ${path.dirname(folder)}.`,
  };
  if (selfTest) { console.warn(`${options.message}: ${folder}`); return; }
  (win ? dialog.showMessageBox(win, options) : dialog.showMessageBox(options)).catch((error) => console.error(error));
}

// --- The main process's areas, each in main/. They reach the window and the book store through getters,
// because both are created later (store when the app is ready, the window after that). ---
const getWindow = () => win;
const getStore = () => store;
// Test-only service addresses, set by the self-test runner. They exist only in --self-test, so a real
// install always talks to the real services.
const testUrls = {};
const testUrl = (name) => (selfTest ? testUrls[name] : undefined);
let ai = null;
const settings = createSettings({ app, safeStorage, reportDamaged, onClaudePathChanged: () => ai?.forgetClaudeStatus() });
const { readSettings, saveSettings, publicSettings } = settings;
const updates = createUpdates({ app, selfTest, testUrls, readSettings, getWindow });
ai = createAiServices({ app, safeStorage, shell, selfTest, testUrls, testUrl, settings, getStore });
const exporter = createExports({ app, dialog, selfTest, getWindow, getStore, rendererDir: RENDERER });
const { chooseOpenFile, toBuffer } = exporter;
function useTestServices(urls) {
  if (!selfTest) throw new Error('Test services are only available in the self-test');
  Object.assign(testUrls, urls);
  ai.reset();
  updates.reset();
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
  handle('books:export-pdf', (event, input = {}) => exporter.exportPdf(event, input));
  handle('books:export-epub', (_e, input) => exporter.exportEpub(input && typeof input === 'object' ? input : {}));
  handle('books:export-wav', (_e, input = {}) => exporter.exportWav(input));
  handle('books:reveal-export', () => exporter.revealExport());
  // Errors from the page (it can't write files itself). Capped, so a loop of errors can't fill the disk.
  let pageErrors = 0;
  handle('app:log-error', (_e, entry) => {
    if (++pageErrors > 200) return false;
    const message = typeof entry?.message === 'string' ? entry.message.slice(0, 2000) : 'Unknown error';
    const stack = typeof entry?.stack === 'string' ? entry.stack.slice(0, 6000) : '';
    log.write('error', `Page: ${message}`, stack);
    return true;
  });
  handle('app:open-logs', () => {
    if (selfTest) return true;
    fsSync.mkdirSync(log.dir, { recursive: true });
    return shell.openPath(log.dir).then((err) => !err);
  });
  handle('app:open-data-folder', () => (selfTest ? true : shell.openPath(app.getPath('userData')).then((err) => !err)));
  handle('app:info', () => ({ version: app.getVersion(), dataFolder: app.getPath('userData'), platform: process.platform }));
  handle('app:update-state', () => updates.state());
  handle('app:check-update', (_e, manual) => updates.checkForUpdate({ manual: manual === true }));
  handle('app:download-update', () => updates.downloadUpdate());
  handle('app:install-update', () => updates.installUpdate());
  handle('app:open-update-notes', () => {
    const { notesUrl } = updates.state();
    if (!notesUrl) throw new Error('No release notes to open');
    if (!selfTest) shell.openExternal(notesUrl);
    return notesUrl;
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
  handle('ai:generate', (_e, input) => ai.generateStory(input && typeof input === 'object' ? input : {}));
  handle('ai:chapter', (_e, input) => ai.generateChapter(input && typeof input === 'object' ? input : {}));
  handle('ai:scene-prompts', (_e, input) => ai.generateScenePrompts(input && typeof input === 'object' ? input : {}));
  handle('ai:image', (_e, input) => ai.generateImage(input && typeof input === 'object' ? input : {}));
  handle('ai:speech', (_e, input) => ai.generateSpeech(input && typeof input === 'object' ? input : {}));
  // Expected failures (not signed in, declined, no connection) come back as { error } rather than a logged exception.
  const soft = (fn) => async (...args) => {
    try { return { ok: await fn(...args) }; } catch (error) { return { error: String(error?.message || error) }; }
  };
  handle('ai:recommendations', soft(() => ai.aiRecommendations()));
  handle('ai:chatgpt-status', soft(() => ai.getChatGpt().status()));
  handle('ai:chatgpt-sign-in', soft(async () => { const result = await ai.getChatGpt().signIn(); ai.forgetChatGptModels(); return result; }));
  handle('ai:chatgpt-cancel', () => { ai.getChatGpt().cancelSignIn(); return true; });
  handle('ai:chatgpt-welcomed', soft(() => ai.getChatGpt().markWelcomed()));
  handle('ai:chatgpt-sign-out', soft(async () => { ai.forgetChatGptModels(); return ai.getChatGpt().signOut(); }));
  handle('ai:chatgpt-models', soft(() => ai.chatGptModelList(true)));
  handle('ai:claude-status', soft((_e, force) => ai.claudeStatus(force === true)));
  handle('ai:open-link', (_e, name) => {
    const links = {
      'chatgpt-usage': 'https://chatgpt.com/settings/usage',
      'openrouter-keys': 'https://openrouter.ai/settings/keys',
      'fal-keys': 'https://fal.ai/dashboard/keys',
      source: 'https://github.com/g-baskin/gaga',
      privacy: 'https://github.com/g-baskin/gaga#privacy',
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
  store = createStore(app.getPath('userData'), { onDamaged: reportDamaged, onUnreadableBook: reportUnreadableBook });
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
  // If the page crashes or freezes, log it and offer to reload instead of leaving a blank or stuck window.
  // (Books are saved as you go; a reload reopens the library.)
  let reloadAfterHang = false;
  win.webContents.on('render-process-gone', (_event, details) => {
    log.write('error', `Window stopped working (${details.reason}, exit code ${details.exitCode})`);
    if (details.reason === 'clean-exit' || !win) return;
    if (selfTest || reloadAfterHang) { reloadAfterHang = false; win.webContents.reload(); return; }
    dialog.showMessageBox(win, {
      type: 'error', buttons: ['Reload', 'Quit'], defaultId: 0, cancelId: 0,
      message: 'Storyloom’s window stopped working',
      detail: 'Your books are saved as you work. Reload to carry on; anything changed in the last moment may need redoing. The details were saved in Storyloom’s log.',
    }).then(({ response }) => {
      if (response === 1) { allowClose = true; app.quit(); } else win?.webContents.reload();
    }).catch((error) => log.error('Crash dialog', error));
  });
  win.on('unresponsive', () => {
    log.warn('Window stopped responding');
    if (selfTest || !win) return;
    dialog.showMessageBox(win, {
      type: 'warning', buttons: ['Wait', 'Reload'], defaultId: 0, cancelId: 0,
      message: 'Storyloom isn’t responding',
      detail: 'It may be busy with a big picture or book. Wait a little, or reload the window (your books are saved as you work).',
    }).then(({ response }) => {
      // A frozen page can't reload itself, so end it; render-process-gone then reloads without asking again.
      if (response === 1 && win) { reloadAfterHang = true; win.webContents.forcefullyCrashRenderer(); }
    }).catch((error) => log.error('Not responding dialog', error));
  });
  await win.loadURL('app://local/index.html');
  if (selfTest) {
    // The self-test drives the app with simulated input (webContents.sendInputEvent). Ignore the real mouse,
    // so someone moving their pointer over the test window can't disturb a drag or click.
    win.setIgnoreMouseEvents(true);
    // If the test window is covered or minimized, Chromium would pause animation frames and slow timers,
    // and every $waitFor (which polls each frame) would time out. Keep the page running at full speed.
    win.webContents.setBackgroundThrottling(false);
    try {
      await require('./selftest/index.cjs').run({ app, win, store, argv: process.argv, root: __dirname, setOpenFile: exporter.setSelfTestOpenFile, useTestServices });
      cleanSelfTestData();
      app.exit(0);
    } catch (error) {
      console.error('SELF_TEST_FAILED', error.message);
      cleanSelfTestData();
      app.exit(1);
    }
  }
}).catch((error) => { log.error('Storyloom could not start', error); console.error(error); app.exit(1); });

app.on('window-all-closed', () => app.quit());
// A downloaded update that wasn't installed is deleted on quit (the installer cleans up its own).
app.on('will-quit', () => { if (updates.state().phase !== 'installing') updates.discardReadyUpdate(); });