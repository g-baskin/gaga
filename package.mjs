// Builds an unsigned Storyloom.app for this Mac under releases/.
import { packager } from '@electron/packager';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const keep = new Set(['', '/package.json', '/main.cjs', '/preload.cjs', '/storage.cjs', '/epub.cjs']);

const outputs = await packager({
  dir: root,
  out: path.join(root, 'releases'),
  name: 'Storyloom',
  appBundleId: 'local.storyloom.app',
  appVersion: manifest.version,
  electronVersion: manifest.devDependencies.electron,
  platform: process.platform,
  arch: process.arch,
  asar: true,
  prune: false,
  overwrite: true,
  // Ship only the app itself: no tests, build tools, or verification output.
  ignore: (file) => !(keep.has(file) || file === '/renderer' || file.startsWith('/renderer/')),
});
console.log(`Built: ${outputs.join('\n')}`);
