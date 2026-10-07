'use strict';
// In-app updates through the real screens, against a local stand-in for GitHub Releases:
// sidebar notice → Download update (with progress) → Restart to update, plus Account → Updates.
// The last step stops before replacing anything, because the self-test runs inside the development copy.
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { PLATFORMS } = require('../updater.cjs');
const { makeAppZip, startUpdateServer } = require('./mock-updates.cjs');

module.exports = async function updates(ctx) {
  const { js, pause } = ctx;
  const checks = {};
  const until = async (expr, ms = 15000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { if (await js(expr)) return true; await pause(50); }
    return false;
  };
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  const trusted = publicKey.export({ format: 'jwk' }).x;

  // 1. A real signed update: notice, download, verify, ready to install.
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'storyloom-selftest-update-'));
  const server = await startUpdateServer({ version: '9.9.9', zip: await makeAppZip({ dir: tmp, version: '9.9.9' }), privateKey });
  let staged = '';
  try {
    // Without a test server, the self-test never contacts GitHub.
    await ctx.navigate('home');
    checks.quietByDefault = (await js(`api.checkForUpdate(false).then((s) => s.phase)`)) === 'idle' && server.requests.length === 0;

    ctx.useTestServices({ STORYLOOM_TEST_UPDATES: server.url, STORYLOOM_TEST_UPDATE_KEY: trusted });
    await js('checkUpdateNow()');
    checks.sidebarNotice = await until(`/Version 9\\.9\\.9 is available/.test(document.getElementById('app-update')?.textContent || '')`);

    // Account → Updates shows the same state and does the download.
    await ctx.navigate('account');
    checks.accountShowsUpdate = await until(`/Version 9\\.9\\.9 is available/.test(document.getElementById('account-update-status')?.textContent || '')`);
    await ctx.click('#account-update-download');
    checks.downloaded = await until(`/Version 9\\.9\\.9 is ready/.test(document.getElementById('account-update-status')?.textContent || '')`, 60000);
    checks.sidebarReady = await until(`!!document.getElementById('app-update-install')`);
    checks.fetchedReleaseFile = server.requests.includes(`/download/v9.9.9/${PLATFORMS[process.arch].file('9.9.9')}`);
    await ctx.screenshot('updates');

    // "Restart to update" stops here in the self-test, after the update is verified and staged.
    const result = await js('api.installUpdate()');
    checks.installReady = result.phase === 'installing' && typeof result.staged === 'string' && result.staged.endsWith('Storyloom.app');
    staged = result.staged;
    checks.stagedAppExists = await fs.stat(staged).then((s) => s.isDirectory(), () => false);
  } finally {
    ctx.useTestServices({ STORYLOOM_TEST_UPDATES: undefined, STORYLOOM_TEST_UPDATE_KEY: undefined });
    server.close();
    await fs.rm(tmp, { recursive: true, force: true });
  }
  // A downloaded update that isn't installed doesn't stay behind in the temp folder.
  checks.unusedDownloadDeleted = Boolean(staged) && await fs.stat(staged).then(() => false, () => true);

  // 2. An update signed with another key is refused, with nothing offered to download.
  const tmp2 = await fs.mkdtemp(path.join(os.tmpdir(), 'storyloom-selftest-update-'));
  const impostor = crypto.generateKeyPairSync('ed25519');
  const server2 = await startUpdateServer({ version: '9.9.9', zip: await makeAppZip({ dir: tmp2, version: '9.9.9' }), privateKey: impostor.privateKey });
  try {
    ctx.useTestServices({ STORYLOOM_TEST_UPDATES: server2.url, STORYLOOM_TEST_UPDATE_KEY: trusted });
    await ctx.navigate('account');
    await ctx.click('#account-update-check');
    checks.tamperedRefused = await until(`/couldn’t be verified/.test(document.getElementById('account-update-status')?.textContent || '')`);
    checks.noDownloadOffered = await js(`!document.getElementById('account-update-download') && !document.getElementById('app-update-download')`);
  } finally {
    ctx.useTestServices({ STORYLOOM_TEST_UPDATES: undefined, STORYLOOM_TEST_UPDATE_KEY: undefined });
    server2.close();
    await fs.rm(tmp2, { recursive: true, force: true });
  }

  // 3. The automatic check can be switched off and on.
  await ctx.navigate('account');
  await ctx.waitFor('#account-check-updates');
  await ctx.click('#account-check-updates');
  checks.switchOffSaved = await until(`api.getSettings().then((s) => s.checkUpdates === false)`);
  await ctx.click('#account-check-updates');
  checks.switchOnSaved = await until(`api.getSettings().then((s) => s.checkUpdates === true)`);
  return checks;
};
