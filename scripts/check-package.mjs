// Checks a built Storyloom.app has every file it loads, so a module missing from package.mjs's `keep` list fails
// here instead of crashing the packaged app (npm start would still work, because it reads the source folder).
//   node scripts/check-package.mjs releases/Storyloom-darwin-arm64/Storyloom.app
// Follows every local require() from main.cjs and preload.cjs (the self-test is never shipped, so it's skipped),
// and every script and stylesheet that renderer/index.html loads.
import { listPackage, extractFile } from '@electron/asar';
import path from 'node:path';
import { DEV_ONLY } from '../package.mjs';

const appPath = process.argv[2];
if (!appPath) {
  console.error('Usage: node scripts/check-package.mjs <path to Storyloom.app>');
  process.exit(2);
}
const asar = path.join(appPath, 'Contents', 'Resources', 'app.asar');
const files = new Set(listPackage(asar, { isPack: false }));
const read = (file) => extractFile(asar, file.replace(/^\//, '')).toString('utf8');
const missing = [];

const seen = new Set();
const queue = ['/main.cjs', '/preload.cjs'];
while (queue.length) {
  const file = queue.shift();
  if (seen.has(file)) continue;
  seen.add(file);
  if (!files.has(file)) { missing.push(file); continue; }
  for (const [, rel] of read(file).matchAll(/require\('(\.{1,2}\/[^']+)'\)/g)) {
    const target = path.posix.join(path.posix.dirname(file), rel);
    if (!target.startsWith('/selftest/')) queue.push(target);
  }
}

const html = files.has('/renderer/index.html') ? read('/renderer/index.html') : '';
if (!html) missing.push('/renderer/index.html');
for (const [, ref] of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^":]+)"/g)) {
  const target = path.posix.join('/renderer', ref);
  if (!files.has(target)) missing.push(target);
}

const shippedDevFiles = [...DEV_ONLY].filter((file) => files.has(file));
if (shippedDevFiles.length) {
  console.error(`The built app contains development-only files:\n  ${shippedDevFiles.join('\n  ')}`);
  process.exit(1);
}
if (missing.length) {
  console.error(`The built app is missing files it loads:\n  ${missing.join('\n  ')}\nAdd them to \`keep\` in package.mjs.`);
  process.exit(1);
}
console.log(`The built app has all ${seen.size} main-process modules and every file index.html loads, and no development-only files.`);
