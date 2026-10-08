'use strict';
// Security boundaries in main.cjs, exercised for real:
// - only the app's own main frame may call IPC (handle()),
// - app://local never serves files outside renderer/, and app://media only serves book assets (serve()),
// - the page itself has no network (onBeforeRequest): requests to http(s) are cancelled before they leave.
const fsp = require('node:fs/promises');
const path = require('node:path');
const { BrowserWindow, net } = require('electron');

module.exports = async function boundaries(ctx) {
  const { js, mockAi } = ctx;
  const checks = {};

  // 1. IPC: the app's window may call; a second window with the same preload and page may not.
  checks.ownWindowAllowed = Array.isArray(await js('api.listBooks()'));
  const other = new BrowserWindow({
    show: false,
    webPreferences: { preload: path.join(ctx.root, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  try {
    await other.loadURL('app://local/index.html');
    const answer = await other.webContents.executeJavaScript(
      `window.storyloom.listBooks().then(() => 'allowed', (error) => String(error && error.message))`,
    );
    checks.otherWindowRefused = answer !== 'allowed' && answer.includes('Untrusted caller');
  } finally {
    other.destroy();
  }

  // 2. app:// file serving stays inside renderer/ and the book folders. The page's CSP only lets it fetch
  //    app://media, so app://local is asked from the main process (net.fetch reaches the same serve()).
  const served = (url) => net.fetch(url).then((r) => r.status, () => 'failed');
  checks.rendererFileServed = (await served('app://local/core.js')) === 200;
  checks.encodedTraversalRefused = (await served('app://local/..%2Fmain.cjs')) === 403;
  checks.encodedDotsRefused = (await served('app://local/%2e%2e%2fpackage.json')) === 403;
  checks.backslashRefused = (await served('app://local/..%5Cmain.cjs')) === 403;
  const status = (url) => js(`fetch(${JSON.stringify(url)}).then((r) => r.status, () => 'blocked')`);
  checks.mediaTraversalRefused = (await status('app://media/self-test/..%2F..%2Fsettings.json')) === 404;
  checks.mediaOtherFolderRefused = (await status('app://media/..%2Fsettings.json/x.png')) === 404;

  // 3. No network from pages (the session's onBeforeRequest filter). The app page's CSP would also stop these,
  //    so they run from a data: page with no CSP: only the session filter stands between it and the network.
  //    A local server that is really listening must get nothing; a public https address fails the same way.
  const bare = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false } });
  try {
    await bare.loadURL('data:text/html,<title>no csp</title>');
    const inBare = (code) => bare.webContents.executeJavaScript(code);
    const before = mockAi.calls.length;
    // no-cors: a request that gets out resolves (opaque) instead of failing on CORS, so 'blocked' really means blocked.
    const tryFetch = (url) => inBare(`fetch(${JSON.stringify(url)}, { method: 'POST', body: '{}', mode: 'no-cors' }).then(() => 'reached', () => 'blocked')`);
    checks.localHttpBlocked = (await tryFetch(`${mockAi.url}/chat/completions`)) === 'blocked';
    checks.httpsBlocked = (await tryFetch('https://example.com/')) === 'blocked';
    checks.imageBlocked = await inBare(`new Promise((resolve) => {
      const img = new Image(); img.onload = () => resolve(false); img.onerror = () => resolve(true);
      img.src = ${JSON.stringify(`${mockAi.url}/pixel.png`)};
    })`);
    checks.serverNeverContacted = mockAi.calls.length === before;
  } finally {
    bare.destroy();
  }

  // 4. Disk errors cross IPC in plain words, without file paths (handle() + plainFsError in storage.cjs).
  const book = await ctx.store.create({ title: 'Locked' });
  const bookFolder = path.join(ctx.userData, 'books', book.id);
  await fsp.chmod(bookFolder, 0o500);
  try {
    const shown = await js(`api.saveBook(${JSON.stringify({ ...book, title: 'Changed' })}).then(() => 'saved', (e) => cleanError(e))`);
    checks.diskErrorPlain = shown.startsWith('Storyloom isn’t allowed to change that file or folder') && !shown.includes('/Users/');
  } finally {
    await fsp.chmod(bookFolder, 0o700);
  }
  checks.diskErrorNoTemp = (await fsp.readdir(bookFolder)).every((n) => !n.endsWith('.tmp'));
  await fsp.rm(bookFolder, { recursive: true, force: true });

  await ctx.screenshot();
  return checks;
};
