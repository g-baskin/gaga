// Builds an unsigned Storyloom.app under releases/ (for this Mac by default).
// `buildApp` is also used by dist.mjs to build the Intel and Apple Silicon versions.
import { packager } from '@electron/packager';
import { access, copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = path.dirname(fileURLToPath(import.meta.url));
const keep = new Set(['', '/package.json', '/main.cjs', '/preload.cjs', '/storage.cjs', '/epub.cjs', '/updater.cjs', '/LICENSE']);

// Electron's MIT licence and Chromium's third-party notices must travel with every copy of the app. The packager
// writes them next to Storyloom.app, but only the .app goes into the disk image and the update zip, so copy them in.
export const RUNTIME_NOTICES = [
  ['LICENSE', 'LICENSE.electron.txt'],
  ['LICENSES.chromium.html', 'LICENSES.chromium.html'],
];

export async function checkRuntimeNotices(appPath) {
  for (const [, name] of RUNTIME_NOTICES) await access(path.join(appPath, 'Contents', 'Resources', name));
}

export async function readManifest() {
  return JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
}

export async function buildApp({ arch = process.arch, out = path.join(root, 'releases'), quiet = false } = {}) {
  const manifest = await readManifest();
  const outputs = await packager({
    dir: root,
    out,
    name: 'Storyloom',
    appBundleId: 'local.storyloom.app',
    appVersion: manifest.version,
    electronVersion: manifest.devDependencies.electron,
    platform: 'darwin',
    arch,
    asar: true,
    prune: false,
    overwrite: true,
    quiet,
    // Ship only the app itself: no tests, build tools, or verification output.
    ignore: (file) => !(keep.has(file) || ['/renderer', '/ai'].some((dir) => file === dir || file.startsWith(`${dir}/`))),
  });
  for (const output of outputs) {
    const resources = path.join(output, 'Storyloom.app', 'Contents', 'Resources');
    for (const [from, to] of RUNTIME_NOTICES) await copyFile(path.join(output, from), path.join(resources, to));
    await checkRuntimeNotices(path.join(output, 'Storyloom.app'));
  }
  return outputs;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outputs = await buildApp();
  console.log(`Built: ${outputs.join('\n')}`);
}
