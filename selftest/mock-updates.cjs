'use strict';
// A stand-in for GitHub Releases that serves a signed latest.json and a real zipped .app, for the updater's
// unit tests and the UI self-test. The fake app reuses Electron's small launcher binary, so it has the right
// chip for whichever Mac (or CI runner) runs the tests, and it gets a real ad-hoc code signature.
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { PLATFORMS, signedMessage } = require('../updater.cjs');

const run = promisify(execFile);
const LAUNCHER = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'Electron.app', 'Contents', 'MacOS', 'Electron');

async function makeAppZip({ dir, version, bundleId = 'local.storyloom.app' }) {
  const app = path.join(dir, 'build', 'Storyloom.app');
  await fs.mkdir(path.join(app, 'Contents', 'MacOS'), { recursive: true });
  await fs.copyFile(LAUNCHER, path.join(app, 'Contents', 'MacOS', 'Storyloom'));
  await fs.writeFile(path.join(app, 'Contents', 'Info.plist'), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleExecutable</key><string>Storyloom</string>
  <key>CFBundleIdentifier</key><string>${bundleId}</string>
  <key>CFBundleName</key><string>Storyloom</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>${version}</string>
  <key>CFBundleVersion</key><string>${version}</string>
</dict></plist>
`);
  await run('codesign', ['--force', '--sign', '-', app]);
  const zip = path.join(dir, 'Storyloom.app.zip');
  await run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', app, zip]);
  return zip;
}

// Serves /latest.json and /download/v<version>/<file>. `options` can be changed while running to
// simulate failures. `tamper(manifest, platformKey)` edits the manifest after signing.
async function startUpdateServer({ version, zip, privateKey, tamper, arch = process.arch }) {
  const platform = PLATFORMS[arch];
  const file = platform.file(version);
  const bytes = await fs.readFile(zip);
  const entry = { version, platform: platform.key, file, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), size: bytes.length };
  const manifest = {
    version,
    platforms: { [platform.key]: { file, sha256: entry.sha256, size: entry.size, signature: crypto.sign(null, signedMessage(entry), privateKey).toString('base64') } },
  };
  tamper?.(manifest, platform.key);
  const options = { missing: false, corruptDownload: false, redirectFeedTo: '' };
  const requests = [];
  const server = http.createServer((req, res) => {
    requests.push(req.url);
    if (req.url === '/latest.json') {
      if (options.redirectFeedTo) { res.writeHead(302, { Location: options.redirectFeedTo }); return res.end(); }
      if (options.missing) { res.writeHead(404); return res.end('Not Found'); }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(manifest));
    }
    if (req.url === `/download/v${version}/${file}`) {
      // Like GitHub, send the file from a second address.
      res.writeHead(302, { Location: '/assets/update.zip' });
      return res.end();
    }
    if (req.url === '/assets/update.zip') {
      const body = options.corruptDownload ? Buffer.from(bytes).fill(7, 0, 64) : bytes;
      res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Length': body.length });
      return res.end(body);
    }
    res.writeHead(404);
    return res.end();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, options, requests, close: () => server.close() };
}

module.exports = { makeAppZip, startUpdateServer };
