'use strict';
// Self-test runner. Drives the real interface with real mouse/keyboard events, one module per screen.
//   npm run self-test                      → every module in FULL_ORDER (missing modules fail)
//   npm run self-test -- --only=home       → just those modules (screenshots in verification/<run-id>/)
//   ... --load=screens/home.js             → inject a screen script (and matching .css) that index.html doesn't list yet
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const mockAi = require('./mock-ai.cjs');

const FULL_ORDER = ['designer', 'home', 'bookshelf', 'story-builder', 'manuscript', 'templates', 'studio', 'coloring', 'export-orders-account', 'ai-services'];
const EXPECTED_SCREENS = ['home', 'bookshelf', 'templates', 'coloring', 'orders', 'account', 'story-builder', 'manuscript', 'designer', 'studio', 'export'];
const APP_NAV = ['home', 'bookshelf', 'templates', 'coloring', 'orders', 'account'];
const BOOK_TABS = ['story-builder', 'manuscript', 'designer', 'studio', 'export'];
const LOADABLE = /^(screens|data)\/[a-z-]+\.js$/;
const MODULE = /^[a-z-]+$/;

const argValues = (argv, flag) => argv.filter((a) => a.startsWith(`${flag}=`)).flatMap((a) => a.slice(flag.length + 1).split(',')).filter(Boolean);

async function run({ app, win, store, argv, root, setOpenFile, useTestServices }) {
  const only = argValues(argv, '--only');
  const loads = argValues(argv, '--load');
  const full = only.length === 0;
  const modules = full ? FULL_ORDER : only;
  for (const name of modules) {
    if (!MODULE.test(name)) throw new Error(`Bad module name: ${name}`);
    if (!fsSync.existsSync(path.join(__dirname, `${name}.cjs`))) throw new Error(`Self-test module missing: selftest/${name}.cjs`);
  }
  for (const file of loads) if (!LOADABLE.test(file)) throw new Error(`--load only accepts screens/<name>.js or data/<name>.js, got ${file}`);

  const runId = full ? '' : `${modules.join('+')}-${process.pid}`;
  const shotDir = path.join(root, 'verification', runId);
  await fs.mkdir(shotDir, { recursive: true });

  const mock = await mockAi.start();
  const userData = app.getPath('userData');
  await fs.writeFile(path.join(userData, 'settings.json'), JSON.stringify({
    baseUrl: mock.url, model: 'mock-writer', imageModel: 'mock-painter', speechModel: 'mock-voice', voice: 'alloy', apiKeyEnc: '',
  }));

  const wc = win.webContents;
  const pageErrors = [];
  wc.on('console-message', (event) => {
    const { level, message } = event;
    if (level === 'error' || level === 3) pageErrors.push(message);
  });
  const js = (code) => wc.executeJavaScript(code);
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));

  // Inject screens that index.html doesn't list yet (same origin, so the CSP still applies).
  for (const file of loads) {
    const css = file.replace(/\.js$/, '.css');
    const hasCss = fsSync.existsSync(path.join(root, 'renderer', css));
    await js(`new Promise((resolve, reject) => {
      ${hasCss ? `const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = ${JSON.stringify(`app://local/${css}`)}; document.head.append(link);` : ''}
      const s = document.createElement('script'); s.src = ${JSON.stringify(`app://local/${file}`)};
      s.onload = () => resolve(true); s.onerror = () => reject(new Error('Could not load ${file}'));
      document.head.append(s);
    })`);
  }

  await js(`window.$must = (sel, all) => { const el = all ? document.querySelectorAll(sel)[all] : document.querySelector(sel); if (!el) throw new Error('Self-test could not find ' + sel); return el; };
    window.$waitFor = (sel, ms = 10000) => new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Timed out waiting for ' + sel)), ms);
      const tick = () => { const el = typeof sel === 'function' ? sel() : document.querySelector(sel); if (el) { clearTimeout(t); resolve(el); } else requestAnimationFrame(tick); };
      tick();
    });
    window.$settle = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50))));
    true`);

  const centerOf = async (selector, index = 0) => {
    const box = await js(`(() => { const el = document.querySelectorAll(${JSON.stringify(selector)})[${index}]; if (!el) return null;
      el.scrollIntoView({ block: 'center', inline: 'center' }); const r = el.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
    if (!box) throw new Error(`Self-test could not find ${selector}`);
    return box;
  };
  const ctx = {
    app, win, wc, store, userData, root, js, pause, centerOf,
    mockAi: mock,
    useTestServices,
    module: null,
    // The next "open file" dialog returns this path instead of asking (null = Cancel).
    setOpenFile,
    // Writes a fixture file into the temp data folder and returns its path.
    async fixture(name, data) {
      const file = path.join(userData, 'fixtures', path.basename(name));
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, data);
      return file;
    },
    // Real mouse drag between two points.
    async drag(from, to, steps = 10) {
      wc.sendInputEvent({ type: 'mouseMove', x: from.x, y: from.y });
      wc.sendInputEvent({ type: 'mouseDown', x: from.x, y: from.y, button: 'left', clickCount: 1 });
      await pause(30);
      for (let i = 1; i <= steps; i++) {
        const x = Math.round(from.x + ((to.x - from.x) * i) / steps);
        const y = Math.round(from.y + ((to.y - from.y) * i) / steps);
        wc.sendInputEvent({ type: 'mouseMove', x, y, button: 'left', modifiers: ['leftButtonDown'] });
        await pause(16);
      }
      wc.sendInputEvent({ type: 'mouseUp', x: to.x, y: to.y, button: 'left', clickCount: 1 });
      await pause(60);
    },
    // Real mouse click at the centre of the matching element.
    async click(selector, { index = 0, button = 'left', clickCount = 1 } = {}) {
      const { x, y } = await centerOf(selector, index);
      wc.sendInputEvent({ type: 'mouseMove', x, y });
      wc.sendInputEvent({ type: 'mouseDown', x, y, button, clickCount });
      wc.sendInputEvent({ type: 'mouseUp', x, y, button, clickCount });
      await pause(60);
    },
    // Types into the focused element like a keyboard would.
    async type(text) { wc.insertText(text); await pause(30); },
    async key(keyCode, modifiers = []) {
      wc.sendInputEvent({ type: 'keyDown', keyCode, modifiers });
      if (keyCode.length === 1) wc.sendInputEvent({ type: 'char', keyCode, modifiers });
      wc.sendInputEvent({ type: 'keyUp', keyCode, modifiers });
      await pause(30);
    },
    waitFor: (selector, ms = 10000) => js(`$waitFor(${JSON.stringify(selector)}, ${ms}).then(() => true)`),
    // Fails if the "isn't built yet" placeholder is showing.
    async assertNoMissing() {
      const missing = await js(`document.querySelector('[data-missing-screen]')?.dataset.missingScreen || null`);
      if (missing) throw new Error(`Screen "${missing}" is not built (fallback placeholder is showing)`);
    },
    async navigate(name, params = {}) {
      await js(`navigate(${JSON.stringify(name)}, ${JSON.stringify(params)}).then(() => $settle())`);
      await ctx.assertNoMissing();
    },
    async screenshot(name = ctx.module) {
      await js('$settle()');
      const file = path.join(shotDir, `${name}.png`);
      await fs.writeFile(file, (await wc.capturePage()).toPNG());
      return file;
    },
    // Accepts the in-app confirm dialog.
    async confirm(answer = 'ok') {
      await ctx.waitFor(`dialog[open] [data-confirm="${answer}"]`);
      await ctx.click(`dialog[open] [data-confirm="${answer}"]`);
    },
  };

  const checks = {};
  // The fallback detector must work in both directions before anything else is trusted.
  await js(`navigate('__selftest-unregistered__').then(() => $settle())`);
  const marker = await js(`document.querySelector('[data-missing-screen]')?.dataset.missingScreen || null`);
  let detectorWorks = marker === '__selftest-unregistered__';
  try { await ctx.assertNoMissing(); detectorWorks = false; } catch { /* expected */ }
  checks.runner = { missingScreenDetector: detectorWorks };
  if (!detectorWorks) throw new Error('Missing-screen detector did not fire for an unregistered screen');
  await js(`navigate(${JSON.stringify(APP_NAV[0])}).then(() => $settle())`);

  for (const name of modules) {
    ctx.module = name;
    const before = fsSync.existsSync(path.join(shotDir, `${name}.png`)) ? fsSync.statSync(path.join(shotDir, `${name}.png`)).mtimeMs : 0;
    // Every module starts from a clean app-level screen.
    await js(`navigate('bookshelf').then(() => $settle())`);
    let result;
    try {
      result = await require(path.join(__dirname, `${name}.cjs`))(ctx);
    } catch (error) {
      await ctx.screenshot(`${name}-failed`).catch(() => {});
      throw new Error(`[${name}] ${error.message}`);
    }
    if (!result || typeof result !== 'object' || Object.keys(result).length === 0) throw new Error(`[${name}] returned no checks`);
    const failed = Object.entries(result).filter(([, v]) => v === false).map(([k]) => k);
    if (failed.length) throw new Error(`[${name}] failed checks: ${failed.join(', ')} — ${JSON.stringify(result)}`);
    const shot = path.join(shotDir, `${name}.png`);
    if (!fsSync.existsSync(shot) || fsSync.statSync(shot).mtimeMs <= before) throw new Error(`[${name}] did not save verification/${runId ? `${runId}/` : ''}${name}.png`);
    checks[name] = result;
  }

  if (full) {
    // Every sidebar item and book tab must lead to a real screen.
    const registered = await js('window.__storyloom.screens()');
    const absent = EXPECTED_SCREENS.filter((n) => !registered.includes(n));
    if (absent.length) throw new Error(`Screens not registered: ${absent.join(', ')}`);
    await js(`navigate('bookshelf').then(() => $settle())`);
    for (const item of APP_NAV) {
      await ctx.click(`[data-nav="${item}"]`);
      await js(`$waitFor(() => window.__storyloom.current() === ${JSON.stringify(item)} && document.querySelector('#screen')).then(() => $settle())`);
      await ctx.assertNoMissing();
    }
    const book = await store.create({ title: 'Tab tour' });
    await js(`openBook(${JSON.stringify(book.id)}).then(() => $settle())`);
    for (const tab of BOOK_TABS) {
      await ctx.click(`[data-tab="${tab}"]`);
      await js(`$waitFor(() => window.__storyloom.current() === ${JSON.stringify(tab)} && document.querySelector('#screen')).then(() => $settle())`);
      await ctx.assertNoMissing();
      await js(`document.querySelector('dialog[open]')?.close()`);
    }
    checks.navigation = { screens: registered.length, appNav: APP_NAV.length, bookTabs: BOOK_TABS.length };
  }

  mock.close();
  const uncaught = pageErrors.filter((m) => !/Autofill|DevTools|Electron Security Warning/.test(m));
  if (uncaught.length) throw new Error(`Page logged errors: ${uncaught.slice(0, 5).join(' | ')}`);
  console.log('SELF_TEST_PASSED', JSON.stringify(checks));
}

module.exports = { run, FULL_ORDER, EXPECTED_SCREENS };
