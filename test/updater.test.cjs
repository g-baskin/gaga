'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createUpdater, PLATFORMS, isNewer, signedMessage } = require('../updater.cjs');
const { makeAppZip, startUpdateServer } = require('../selftest/mock-updates.cjs');

const arch = process.arch;
const platform = PLATFORMS[arch];

function keyPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  return { privateKey, raw: publicKey.export({ format: 'jwk' }).x };
}

async function harness(t, { version = '9.9.9', appVersion = version, bundleId, sign = true, key = keyPair(), tamper } = {}) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'storyloom-updater-test-'));
  t.after(() => fs.rm(tmp, { recursive: true, force: true }));
  const zip = await makeAppZip({ dir: tmp, version: appVersion, bundleId });
  const server = await startUpdateServer({ version, zip, privateKey: sign ? key.privateKey : keyPair().privateKey, tamper });
  t.after(() => server.close());
  const updater = createUpdater({
    currentVersion: '0.4.0',
    feedUrl: `${server.url}/latest.json`,
    downloadBase: `${server.url}/download/`,
    allowHost: (host) => host === '127.0.0.1',
    trustedKeys: [key.raw],
    tmpDir: tmp,
  });
  return { updater, server, tmp };
}

test('isNewer compares versions number by number', () => {
  assert.equal(isNewer('0.10.0', '0.9.9'), true);
  assert.equal(isNewer('1.0.0', '0.99.99'), true);
  assert.equal(isNewer('0.4.0', '0.4.0'), false);
  assert.equal(isNewer('0.3.9', '0.4.0'), false);
  assert.equal(isNewer('0.5.0-beta', '0.4.0'), false);
});

test('finds, downloads, and verifies a signed update', async (t) => {
  const { updater, tmp } = await harness(t);
  const update = await updater.check();
  assert.equal(update.status, 'available');
  assert.equal(update.version, '9.9.9');
  assert.ok(update.url.endsWith(`/download/v9.9.9/${platform.file('9.9.9')}`));

  const progress = [];
  const ready = await updater.download(update, { onProgress: (p) => progress.push(p) });
  assert.equal(progress.at(-1), 100);
  assert.ok(ready.appPath.startsWith(tmp));
  const plist = await fs.readFile(path.join(ready.appPath, 'Contents/Info.plist'), 'utf8');
  assert.match(plist, /<string>9\.9\.9<\/string>/);
});

test('says up to date when the published version isn’t newer, and handles a missing feed', async (t) => {
  const same = await harness(t, { version: '0.4.0' });
  assert.equal((await same.updater.check()).status, 'up-to-date');
  same.server.options.missing = true;
  assert.equal((await same.updater.check()).status, 'no-feed');
});

test('refuses an update signed with a different key', async (t) => {
  const { updater } = await harness(t, { sign: false });
  await assert.rejects(updater.check(), /couldn’t be verified/);
});

test('refuses a manifest whose signed details were changed (size, hash, version swap)', async (t) => {
  for (const tamper of [
    (m, key) => { m.platforms[key].size += 1; },
    (m, key) => { m.platforms[key].sha256 = 'a'.repeat(64); },
    (m) => { m.version = '9.9.10'; }, // a signature for 9.9.9 must not install as another version
  ]) {
    const { updater } = await harness(t, { tamper });
    await assert.rejects(updater.check(), /couldn’t be verified|isn’t available/);
  }
});

test('refuses a download that doesn’t match its signed checksum', async (t) => {
  const { updater, server } = await harness(t);
  const update = await updater.check();
  server.options.corruptDownload = true;
  await assert.rejects(updater.download(update), /download was damaged/);
});

test('refuses an archive whose app has the wrong version or isn’t Storyloom', async (t) => {
  const wrongVersion = await harness(t, { appVersion: '1.0.0' });
  await assert.rejects(wrongVersion.updater.download(await wrongVersion.updater.check()), /wrong version number/);
  const wrongApp = await harness(t, { bundleId: 'com.example.other' });
  await assert.rejects(wrongApp.updater.download(await wrongApp.updater.check()), /isn’t a Storyloom app/);
});

test('never follows redirects to other hosts', async (t) => {
  const { updater, server } = await harness(t);
  server.options.redirectFeedTo = 'https://example.com/latest.json';
  await assert.rejects(updater.check(), /unexpected address/);
});

test('the signed message binds every detail of a download', () => {
  const base = { version: '1.2.3', platform: 'darwin-x64', file: 'a.zip', sha256: 'b'.repeat(64), size: 10 };
  const messages = new Set([
    base, { ...base, version: '1.2.4' }, { ...base, platform: 'darwin-arm64' },
    { ...base, file: 'c.zip' }, { ...base, sha256: 'c'.repeat(64) }, { ...base, size: 11 },
  ].map((m) => signedMessage(m).toString('hex')));
  assert.equal(messages.size, 6);
});

test('the installer waits for Storyloom to quit, then swaps in the new app', async (t) => {
  const { installArgs } = require('../updater.cjs');
  const { spawn } = require('node:child_process');
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'storyloom-install-test-'));
  t.after(() => fs.rm(tmp, { recursive: true, force: true }));
  const target = path.join(tmp, 'Applications', 'Storyloom.app');
  const staged = path.join(tmp, 'work', 'unpacked', 'Storyloom.app');
  for (const [dir, label] of [[target, 'old'], [staged, 'new']]) {
    await fs.mkdir(path.join(dir, 'Contents'), { recursive: true });
    await fs.writeFile(path.join(dir, 'Contents', 'which.txt'), label);
  }
  // A stand-in for the running app: the installer must wait for it to exit.
  const app = spawn('/bin/sleep', ['1']);
  const started = Date.now();
  const installer = spawn('/bin/bash', installArgs({ pid: app.pid, target, staged: { appPath: staged, workdir: path.join(tmp, 'work') }, relaunch: false }));
  const code = await new Promise((resolve) => installer.on('close', resolve));
  assert.equal(code, 0);
  assert.ok(Date.now() - started >= 800, 'waited for the app to quit');
  assert.equal(await fs.readFile(path.join(target, 'Contents', 'which.txt'), 'utf8'), 'new');
  await assert.rejects(fs.access(path.join(tmp, 'work')), 'temporary files removed');
  await assert.rejects(fs.access(path.join(tmp, 'Applications', 'Storyloom.update-backup.app')), 'backup removed');
});

test('if copying the new app fails, the installer puts the old app back', async (t) => {
  const { installArgs } = require('../updater.cjs');
  const { spawn } = require('node:child_process');
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'storyloom-install-test-'));
  t.after(() => fs.rm(tmp, { recursive: true, force: true }));
  const target = path.join(tmp, 'Applications', 'Storyloom.app');
  await fs.mkdir(path.join(target, 'Contents'), { recursive: true });
  await fs.writeFile(path.join(target, 'Contents', 'which.txt'), 'old');
  const missing = path.join(tmp, 'work', 'unpacked', 'Storyloom.app'); // nothing to copy: ditto fails
  const installer = spawn('/bin/bash', installArgs({ pid: 999999, target, staged: { appPath: missing, workdir: path.join(tmp, 'work') }, relaunch: false }));
  const code = await new Promise((resolve) => installer.on('close', resolve));
  assert.equal(code, 1);
  assert.equal(await fs.readFile(path.join(target, 'Contents', 'which.txt'), 'utf8'), 'old');
});

test('the installer refuses unsafe arguments', () => {
  const { installArgs } = require('../updater.cjs');
  const staged = { appPath: '/tmp/x/Storyloom.app', workdir: '/tmp/x' };
  assert.throws(() => installArgs({ pid: 1, target: '/Applications/Storyloom.app', staged }), /installer/);
  assert.throws(() => installArgs({ pid: 500, target: 'relative/Storyloom.app', staged }), /installer/);
  assert.throws(() => installArgs({ pid: 500, target: '/Applications/Other', staged }), /installer/);
  assert.throws(() => installArgs({ pid: 500, target: '/Applications/Story\nloom.app', staged }), /installer/);
});

test('install location: refuses translocated or non-app paths', async () => {
  const { installTarget } = require('../updater.cjs');
  assert.equal((await installTarget('/usr/local/bin/node')).ok, false);
  const translocated = await installTarget('/private/var/folders/x/AppTranslocation/ABC/d/Storyloom.app/Contents/MacOS/Storyloom');
  assert.equal(translocated.ok, false);
  assert.match(translocated.reason, /Applications folder/);
});
