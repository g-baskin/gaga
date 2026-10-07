'use strict';
// In-app updater: check → download (with progress) → verify → stage → install and restart.
//
// Every release publishes latest.json plus one signed .app.zip per Mac chip. The signature is Ed25519 over
// the version, chip, file name, SHA-256, and size, so a download can't be swapped for another release
// (rollback) or another chip. The public keys that may sign updates are built into the app below; the
// private key only exists in the release workflow's secrets (and the maintainer's own backup).
//
// Order matters: the manifest signature is checked first, then the download's size and SHA-256, and only
// then is anything unpacked. The unpacked app must also have Storyloom's bundle ID, the expected version
// and chip, and a valid code signature before it can be installed.

const crypto = require('node:crypto');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFile, spawn } = require('node:child_process');
const { promisify } = require('node:util');

const run = promisify(execFile);
const REPO = 'g-baskin/gaga';
const FEED_URL = `https://github.com/${REPO}/releases/latest/download/latest.json`;
const DOWNLOAD_BASE = `https://github.com/${REPO}/releases/download/`;
const RELEASES_PAGE = `https://github.com/${REPO}/releases/`;
// Release downloads redirect from github.com to GitHub's asset storage. No other host is followed.
const GITHUB_HOSTS = new Set(['github.com', 'objects.githubusercontent.com', 'release-assets.githubusercontent.com']);
// Raw Ed25519 public keys (base64url) allowed to sign updates. To change keys: ship a release, signed
// with the current key, that adds the new key here; sign later releases with the new key.
const TRUSTED_KEYS = ['BkufNJzXMPsvZSd-nRhdZyVlWrLPCEIBasuc8m6U4S8'];
const BUNDLE_ID = 'local.storyloom.app';
const SIGNED_PREFIX = 'storyloom-update-v1';
const MAX_MANIFEST = 64 * 1024;
const MAX_ARCHIVE = 600 * 1024 * 1024;
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

// Each Mac chip: its key in latest.json, its download file name, and what `lipo -archs` reports.
const PLATFORMS = {
  x64: { key: 'darwin-x64', file: (v) => `Storyloom_${v}_Intel_x64.app.zip`, lipo: 'x86_64' },
  arm64: { key: 'darwin-arm64', file: (v) => `Storyloom_${v}_Apple-Silicon_arm64.app.zip`, lipo: 'arm64' },
};

class UpdateError extends Error {}

function isNewer(latest, current) {
  const a = SEMVER.exec(String(latest || ''));
  const b = SEMVER.exec(String(current || ''));
  if (!a || !b) return false;
  for (let i = 1; i <= 3; i++) if (Number(a[i]) !== Number(b[i])) return Number(a[i]) > Number(b[i]);
  return false;
}

// The exact bytes that are signed for one download. Shared with scripts/update-manifest.mjs.
function signedMessage({ version, platform, file, sha256, size }) {
  return Buffer.from([SIGNED_PREFIX, version, platform, file, sha256, String(size)].join('\n'), 'utf8');
}

function publicKey(raw) {
  return crypto.createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: raw }, format: 'jwk' });
}

function verifySignature(entry, keys) {
  let signature;
  try { signature = Buffer.from(entry.signature, 'base64'); } catch { return false; }
  if (signature.length !== 64) return false;
  const message = signedMessage(entry);
  return keys.some((raw) => {
    try { return crypto.verify(null, message, publicKey(raw), signature); } catch { return false; }
  });
}

function createUpdater({
  currentVersion,
  arch = process.arch,
  feedUrl = FEED_URL,
  downloadBase = DOWNLOAD_BASE,
  trustedKeys = TRUSTED_KEYS,
  allowHost = (host) => GITHUB_HOSTS.has(host),
  tmpDir = os.tmpdir(),
}) {
  const platform = PLATFORMS[arch];

  // Fetches over https, following redirects only to allowed hosts (plain http only for a loopback test server).
  async function open(url, { timeout = 30000 } = {}) {
    let next = url;
    for (let hop = 0; hop < 5; hop++) {
      const parsed = new URL(next);
      const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname);
      const secure = parsed.protocol === 'https:' || (parsed.protocol === 'http:' && loopback);
      if (!secure || !allowHost(parsed.hostname)) throw new UpdateError('The update came from an unexpected address');
      let response;
      try {
        response = await fetch(parsed, { redirect: 'manual', signal: AbortSignal.timeout(timeout), headers: { 'User-Agent': `Storyloom/${currentVersion}` } });
      } catch (error) {
        throw new UpdateError(error.name === 'TimeoutError' ? 'GitHub took too long to answer' : 'Could not reach GitHub to check for updates');
      }
      if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
        next = new URL(response.headers.get('location'), parsed).toString();
        continue;
      }
      return response;
    }
    throw new UpdateError('Too many redirects while checking for updates');
  }

  // Reads and checks latest.json. Returns { status: 'no-feed' | 'up-to-date' | 'available', ... }.
  async function check() {
    if (!platform) throw new UpdateError('Automatic updates aren’t available for this kind of Mac');
    const response = await open(feedUrl, { timeout: 15000 });
    if (response.status === 404) return { status: 'no-feed' };
    if (!response.ok) throw new UpdateError(`GitHub returned an error (HTTP ${response.status})`);
    if (Number(response.headers.get('content-length') || 0) > MAX_MANIFEST) throw new UpdateError('The update information was too large');
    const text = await response.text();
    if (text.length > MAX_MANIFEST) throw new UpdateError('The update information was too large');
    let manifest;
    try { manifest = JSON.parse(text); } catch { throw new UpdateError('The update information couldn’t be read'); }

    const version = typeof manifest?.version === 'string' ? manifest.version : '';
    if (!SEMVER.test(version)) throw new UpdateError('The update information couldn’t be read');
    if (!isNewer(version, currentVersion)) return { status: 'up-to-date', version };

    const raw = manifest.platforms?.[platform.key];
    const file = platform.file(version);
    const entry = {
      version, platform: platform.key, file,
      sha256: typeof raw?.sha256 === 'string' ? raw.sha256 : '',
      size: Number.isSafeInteger(raw?.size) ? raw.size : 0,
      signature: typeof raw?.signature === 'string' ? raw.signature : '',
    };
    // The download address is rebuilt from the version, never taken from the manifest.
    const url = `${downloadBase}v${version}/${file}`;
    if (!raw || raw.file !== file || !/^[0-9a-f]{64}$/.test(entry.sha256) || entry.size <= 0 || entry.size > MAX_ARCHIVE) {
      throw new UpdateError('This update isn’t available for your Mac yet');
    }
    if (!verifySignature(entry, trustedKeys)) {
      throw new UpdateError('This update couldn’t be verified, so Storyloom won’t install it');
    }
    return { status: 'available', version, entry, url, notesUrl: `${RELEASES_PAGE}tag/v${version}` };
  }

  // Downloads, verifies, and unpacks an update from check(). Returns { appPath, workdir, version }.
  async function download(update, { onProgress } = {}) {
    const { entry, url } = update;
    const workdir = await fsp.mkdtemp(path.join(tmpDir, 'storyloom-update-'));
    try {
      const response = await open(url, { timeout: 30 * 60 * 1000 });
      if (!response.ok || !response.body) throw new UpdateError(`Could not download the update (HTTP ${response.status})`);
      const zip = path.join(workdir, 'update.zip');
      const hash = crypto.createHash('sha256');
      let received = 0;
      let lastPercent = -1;
      const out = fs.createWriteStream(zip, { flags: 'wx', mode: 0o600 });
      try {
        for await (const chunk of response.body) {
          received += chunk.length;
          if (received > entry.size) throw new UpdateError('The update download was larger than expected');
          hash.update(chunk);
          if (!out.write(chunk)) await new Promise((resolve) => out.once('drain', resolve));
          const percent = Math.floor((received / entry.size) * 100);
          if (percent !== lastPercent) { lastPercent = percent; onProgress?.(percent); }
        }
      } finally {
        await new Promise((resolve) => out.end(resolve));
      }
      if (received !== entry.size || hash.digest('hex') !== entry.sha256) {
        throw new UpdateError('The update download was damaged. Try again.');
      }

      // Only now, with a verified archive, unpack it and check what's inside.
      const unpacked = path.join(workdir, 'unpacked');
      await run('/usr/bin/ditto', ['-x', '-k', zip, unpacked]);
      await fsp.rm(zip, { force: true });
      const appPath = await verifyApp(unpacked, workdir, entry.version);
      return { appPath, workdir, version: entry.version };
    } catch (error) {
      await fsp.rm(workdir, { recursive: true, force: true });
      throw error instanceof UpdateError ? error : new UpdateError(`The update couldn’t be prepared (${error.code || error.message})`);
    }
  }

  async function verifyApp(unpacked, workdir, version) {
    const names = await fsp.readdir(unpacked);
    const appPath = path.join(unpacked, 'Storyloom.app');
    if (names.length !== 1 || names[0] !== 'Storyloom.app') throw new UpdateError('The update has unexpected contents');
    const stat = await fsp.lstat(appPath);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new UpdateError('The update has unexpected contents');
    const real = await fsp.realpath(appPath);
    if (!real.startsWith(`${await fsp.realpath(workdir)}${path.sep}`)) throw new UpdateError('The update has unexpected contents');
    const plist = path.join(appPath, 'Contents', 'Info.plist');
    const read = async (keyName) => (await run('/usr/libexec/PlistBuddy', ['-c', `Print :${keyName}`, plist])).stdout.trim();
    if ((await read('CFBundleIdentifier')) !== BUNDLE_ID) throw new UpdateError('The update isn’t a Storyloom app');
    if ((await read('CFBundleShortVersionString')) !== version) throw new UpdateError('The update has the wrong version number');
    if ((await read('CFBundleExecutable')) !== 'Storyloom') throw new UpdateError('The update isn’t a Storyloom app');
    const { stdout: archs } = await run('/usr/bin/lipo', ['-archs', path.join(appPath, 'Contents', 'MacOS', 'Storyloom')]);
    if (archs.trim() !== platform.lipo) throw new UpdateError('The update is for a different kind of Mac');
    try {
      await run('/usr/bin/codesign', ['--verify', '--deep', '--strict', appPath]);
    } catch {
      throw new UpdateError('The update’s code signature isn’t valid');
    }
    return appPath;
  }

  return { check, download, verifyApp };
}

// Where the running app lives, and whether Storyloom can replace it there.
async function installTarget(execPath) {
  const target = path.resolve(execPath, '..', '..', '..');
  if (!target.endsWith('.app') || !path.isAbsolute(target)) {
    return { ok: false, reason: 'Automatic updates only work in the installed app' };
  }
  if (target.includes('/AppTranslocation/')) {
    return { ok: false, target, reason: 'Move Storyloom to your Applications folder, then open it from there to update automatically' };
  }
  try {
    await fsp.access(path.dirname(target), fs.constants.W_OK);
    await fsp.access(target, fs.constants.W_OK);
  } catch {
    return { ok: false, target, reason: 'Storyloom can’t replace itself where it is now. Move it to your Applications folder, then try again' };
  }
  return { ok: true, target };
}

// Runs after Storyloom quits: waits for it to exit, swaps in the new app (keeping the old one until the
// copy succeeds, and putting it back if the copy fails), cleans up, then reopens Storyloom.
// All values arrive as separate arguments ($1..$6); none is pasted into the script text.
// If Storyloom doesn't close in time ($6 tenths of a second), nothing is replaced and the download is deleted.
const INSTALL_SCRIPT = `
pid="$1"; target="$2"; staged="$3"; workdir="$4"; relaunch="$5"; wait="$6"
i=0
while kill -0 "$pid" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -gt "$wait" ]; then /bin/rm -rf "$workdir"; exit 1; fi
  /bin/sleep 0.1
done
backup="\${target%.app}.update-backup.app"
/bin/rm -rf "$backup"
/bin/mv "$target" "$backup" || exit 1
if /usr/bin/ditto "$staged" "$target"; then
  /bin/rm -rf "$backup"
  status=0
else
  /bin/rm -rf "$target"
  /bin/mv "$backup" "$target"
  status=1
fi
/bin/rm -rf "$workdir"
if [ "$relaunch" = 1 ]; then /usr/bin/open "$target"; fi
exit "$status"
`;

// How long the installer waits for Storyloom to close, in tenths of a second (2 minutes).
const INSTALL_WAIT_TENTHS = 1200;

function installArgs({ pid, target, staged, relaunch = true, waitTenths = INSTALL_WAIT_TENTHS }) {
  if (!Number.isSafeInteger(pid) || pid <= 1) throw new UpdateError('Couldn’t start the installer');
  if (!Number.isSafeInteger(waitTenths) || waitTenths < 1 || waitTenths > 6000) throw new UpdateError('Couldn’t start the installer');
  for (const value of [target, staged.appPath, staged.workdir]) {
    if (typeof value !== 'string' || !path.isAbsolute(value) || value.includes('\n')) throw new UpdateError('Couldn’t start the installer');
  }
  if (!target.endsWith('.app') || !staged.appPath.endsWith('.app')) throw new UpdateError('Couldn’t start the installer');
  return ['-c', INSTALL_SCRIPT, 'storyloom-update', String(pid), target, staged.appPath, staged.workdir, relaunch ? '1' : '0', String(waitTenths)];
}

// Starts the installer in the background. The caller then quits Storyloom.
function startInstall(options) {
  const child = spawn('/bin/bash', installArgs(options), { detached: true, stdio: 'ignore' });
  child.unref();
}

module.exports = {
  createUpdater, installTarget, installArgs, startInstall, signedMessage, verifySignature, isNewer,
  UpdateError, PLATFORMS, TRUSTED_KEYS, BUNDLE_ID, RELEASES_PAGE, INSTALL_WAIT_TENTHS,
};
