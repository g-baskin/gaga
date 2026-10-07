// Builds Storyloom for Intel and Apple Silicon Macs and wraps each in a .dmg, ready for a GitHub release.
//
//   npm run dist                 → both: releases/dist/Storyloom_<version>_Intel_x64.dmg and _Apple-Silicon_arm64.dmg
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

const sums = [];
for (const arch of chosenArches()) {
  const [app] = await buildApp({ arch, out: path.join(root, 'releases', 'build'), quiet: true });
  const dmg = await makeDmg({ app: path.join(app, 'Storyloom.app'), arch, version, outDir });
  sums.push(`${await sha256(dmg)}  ${path.basename(dmg)}`);
  console.log(`Built ${path.relative(root, dmg)}`);
}
await writeFile(path.join(outDir, 'SHA256SUMS.txt'), `${sums.join('\n')}\n`);
console.log(`Checksums: ${path.relative(root, path.join(outDir, 'SHA256SUMS.txt'))}`);
