'use strict';
// Error log and crash recovery, for real:
// - an uncaught error and an unhandled promise rejection in the page land in the local log,
// - the page can't flood the log (capped per session),
// - if the page process crashes, it is logged and the window comes back (the real app asks first),
// - Account has an Open log folder button.
const fsp = require('node:fs/promises');
const path = require('node:path');

module.exports = async function logging(ctx) {
  const { js, pause, userData, win } = ctx;
  const checks = {};
  const logFile = path.join(userData, 'logs', 'storyloom.log');
  const readLog = () => fsp.readFile(logFile, 'utf8').catch(() => '');
  const until = async (test, ms = 5000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { if (test(await readLog())) return true; await pause(50); }
    return false;
  };

  // 1. Uncaught errors and rejections from the page (dispatched as the browser would report them).
  await js(`window.dispatchEvent(new ErrorEvent('error', { error: new Error('selftest-log-probe uncaught'), message: 'selftest-log-probe uncaught' })); true`);
  await js(`(() => { const e = new Event('unhandledrejection'); e.reason = new Error('selftest-log-probe rejection'); window.dispatchEvent(e); return true; })()`);
  checks.pageErrorLogged = await until((text) => text.includes('Page: Error: selftest-log-probe uncaught'));
  checks.pageRejectionLogged = await until((text) => text.includes('Page: Error: selftest-log-probe rejection'));
  checks.logInsideLogsFolder = path.dirname(logFile) === path.join(userData, 'logs');

  // 2. The page can't fill the disk: at most 200 page errors are written per session.
  const accepted = await js(`(async () => { let n = 0; for (let i = 0; i < 250; i++) if (await api.logError({ message: 'selftest-log-probe flood ' + i })) n++; return n; })()`);
  checks.pageErrorsCapped = accepted <= 200 && !(await readLog()).includes('selftest-log-probe flood 249');

  // 3. A crashed page is logged and the window reloads to a working app.
  await ctx.navigate('home');
  const reloaded = new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 15000);
    win.webContents.once('did-finish-load', () => { clearTimeout(timer); resolve(true); });
  });
  win.webContents.forcefullyCrashRenderer();
  checks.crashLogged = await until((text) => /Window stopped working \((crashed|killed)/.test(text), 10000);
  checks.reloadedAfterCrash = (await reloaded)
    && (await js(`new Promise((r) => { const t = () => (typeof navigate === 'function' && document.querySelector('#screen') ? r(true) : setTimeout(t, 50)); t(); })`));
  await ctx.installHelpers();

  // 3b. Menu commands and key presses that arrive while the page is still loading its scripts must not reach
  // handlers before the app is ready (they used to throw "state is not defined"). Reload and send both non-stop.
  const errorsBefore = ctx.pageErrors.length;
  let loading = true;
  const loaded = new Promise((resolve) => {
    const timer = setTimeout(resolve, 15000);
    win.webContents.once('did-finish-load', () => { clearTimeout(timer); resolve(); });
  });
  win.webContents.reload();
  const pester = (async () => {
    while (loading) {
      win.webContents.send('menu:action', 'undo');
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
      await new Promise((r) => setImmediate(r));
    }
  })();
  await loaded;
  await js(`new Promise((r) => { const t = () => (typeof navigate === 'function' && document.querySelector('#screen') ? r(true) : setTimeout(t, 20)); t(); })`);
  loading = false;
  await pester;
  await pause(200);
  const loadErrors = ctx.pageErrors.slice(errorsBefore).filter((m) => !/selftest-log-probe/.test(m));
  checks.inputDuringLoadIgnored = loadErrors.length === 0;
  if (loadErrors.length) {
    console.error('Input during load reached the page too early:', loadErrors.slice(0, 2).join(' | '));
    ctx.pageErrors.splice(errorsBefore); // reported by this check, not the run-wide one
  }
  await ctx.installHelpers();

  // 4. Account → Open log folder.
  await ctx.navigate('account');
  checks.openLogsButton = await js(`!!document.getElementById('account-open-logs')`);
  checks.openLogsWorks = (await js('api.openLogs()')) === true;
  await js(`document.getElementById('account-open-logs').scrollIntoView({ block: 'center' }); true`);
  await ctx.screenshot('logging');
  return checks;
};
