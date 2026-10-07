// Builds an unsigned Storyloom.app under releases/ (for this Mac by default).
// `buildApp` is also used by dist.mjs to build the Intel and Apple Silicon versions.
import { packager } from '@electron/packager';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = path.dirname(fileURLToPath(import.meta.url));
const keep = new Set(['', '/package.json', '/main.cjs', '/preload.cjs', '/storage.cjs', '/epub.cjs', '/updates.cjs']);

export async function readManifest() {
  return JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
}

export async function buildApp({ arch = process.arch, out = path.join(root, 'releases'), quiet = false } = {}) {
  const manifest = await readManifest();
  return packager({
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
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outputs = await buildApp();
  console.log(`Built: ${outputs.join('\n')}`);
}
