// Builds Storyloom for Intel and Apple Silicon Macs and wraps each in a .dmg, ready for a GitHub release.
//
//   npm run dist                 → both: releases/dist/Storyloom_<version>_Intel_x64.dmg and _Apple-Silicon_arm64.dmg,
//                                  plus a matching .app.zip of each for the in-app updater
//   npm run dist -- --arch=arm64 → just one
//
// Uses only macOS's own tools (codesign, hdiutil, shasum), so it must run on a Mac.
// The apps are ad-hoc signed (no Apple Developer account): Apple Silicon Macs refuse to run code
// without at least that. They are not notarized, so macOS asks people to confirm the first launch.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { buildApp, readManifest, root } from './package.mjs';

const run = promisify(execFile);
// Electron's name for each chip, and how the file name marks it, so people can tell which Mac each download is for.
const ARCHES = { x64: 'Intel_x64', arm64: 'Apple-Silicon_arm64' };

function chosenArches() {
  const flag = process.argv.find((a) => a.startsWith('--arch='));
  if (!flag) return Object.keys(ARCHES);
  const arch = flag.slice('--arch='.length);
  if (!ARCHES[arch]) throw new Error(`--arch must be one of: ${Object.keys(ARCHES).join(', ')}`);
  return [arch];
}

async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

async function makeDmg({ app, arch, version, outDir }) {
  // Re-sign the whole bundle ad hoc: packaging renames and edits the app, which breaks Electron's own signature.
  await run('codesign', ['--force', '--deep', '--sign', '-', app]);
  await run('codesign', ['--verify', '--deep', '--strict', app]);
  const { stdout } = await run('lipo', ['-archs', path.join(app, 'Contents/MacOS/Storyloom')]);
  const want = arch === 'x64' ? 'x86_64' : 'arm64';
  if (stdout.trim() !== want) throw new Error(`Expected a ${want} app but got ${stdout.trim()}`);
  // The version the app shows comes from this field, so it must match package.json.
  const plist = path.join(app, 'Contents/Info.plist');
  const { stdout: shown } = await run('/usr/libexec/PlistBuddy', ['-c', 'Print :CFBundleShortVersionString', plist]);
  if (shown.trim() !== version) throw new Error(`The built app says version ${shown.trim()}, but package.json says ${version}`);

  // The disk image shows the app next to an Applications shortcut, so people can drag to install.
  const staging = await mkdtemp(path.join(os.tmpdir(), 'storyloom-dmg-'));
  try {
    await run('ditto', [app, path.join(staging, 'Storyloom.app')]);
    await symlink('/Applications', path.join(staging, 'Applications'));
    const dmg = path.join(outDir, `Storyloom_${version}_${ARCHES[arch]}.dmg`);
    await rm(dmg, { force: true });
    await run('hdiutil', ['create', '-volname', `Storyloom ${version}`, '-srcfolder', staging, '-fs', 'HFS+', '-format', 'UDZO', '-ov', dmg]);
    await run('hdiutil', ['verify', dmg]);
    return dmg;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

if (process.platform !== 'darwin') throw new Error('Mac disk images can only be built on a Mac');
const { version } = await readManifest();
const outDir = path.join(root, 'releases', 'dist');
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

// The in-app updater downloads a zipped Storyloom.app (ditto keeps the code signature intact).
async function makeUpdateZip({ app, arch, version, outDir }) {
  const zip = path.join(outDir, `Storyloom_${version}_${ARCHES[arch]}.app.zip`);
  await rm(zip, { force: true });
  await run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', app, zip]);
  return zip;
}

const sums = [];
for (const arch of chosenArches()) {
  const [app] = await buildApp({ arch, out: path.join(root, 'releases', 'build'), quiet: true });
  const appPath = path.join(app, 'Storyloom.app');
  const dmg = await makeDmg({ app: appPath, arch, version, outDir });
  const zip = await makeUpdateZip({ app: appPath, arch, version, outDir });
  for (const file of [dmg, zip]) {
    sums.push(`${await sha256(file)}  ${path.basename(file)}`);
    console.log(`Built ${path.relative(root, file)}`);
  }
}
await writeFile(path.join(outDir, 'SHA256SUMS.txt'), `${sums.join('\n')}\n`);
console.log(`Checksums: ${path.relative(root, path.join(outDir, 'SHA256SUMS.txt'))}`);
