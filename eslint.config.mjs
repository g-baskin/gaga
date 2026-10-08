// ESLint config for Storyloom. Run with `npm run lint`.
// Three kinds of code live here:
//   - Node CommonJS (.cjs): the main process, preload, storage, AI clients, tests, self-test.
//   - Node ES modules (.mjs): build and release scripts.
//   - Renderer scripts (renderer/**/*.js): plain browser scripts loaded in order by index.html.
//     They share top-level names (h, api, registerScreen, ...) across files, so each file is told
//     about the names the *other* renderer files declare at top level.
import js from '@eslint/js';
import globals from 'globals';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

function rendererScripts(dir = 'renderer') {
  return readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return rendererScripts(rel);
    return entry.name.endsWith('.js') ? [rel] : [];
  });
}

// Top-level declarations start at column 0 in these files (wrapped IIFE files declare nothing shared).
const topLevel = /^(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm;
// IIFE files share names with `Object.assign(window, { a, b })` instead (fonts.js does this).
const onWindow = /Object\.assign\(window,\s*\{([^}]*)\}\)/g;
function sharedNames(file) {
  const text = readFileSync(path.join(root, file), 'utf8');
  const names = [...text.matchAll(topLevel)].map((m) => m[1]);
  for (const [, list] of text.matchAll(onWindow)) names.push(...list.split(',').map((n) => n.trim()).filter(Boolean));
  return new Set(names);
}
const declaredBy = new Map(rendererScripts().map((file) => [file, sharedNames(file)]));

const rendererConfigs = [...declaredBy.keys()].map((file) => {
  const shared = {};
  for (const [other, names] of declaredBy) {
    if (other === file) continue;
    for (const name of names) if (!declaredBy.get(file).has(name)) shared[name] = 'readonly';
  }
  return { files: [file], languageOptions: { globals: shared } };
});

export default [
  { ignores: ['node_modules/', 'releases/', 'verification/', 'renderer/fonts/fonts-list.js'] },
  js.configs.recommended,
  // Storage and export sanitizers strip control characters from text on purpose.
  { rules: { 'no-control-regex': 'off' } },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { sourceType: 'module', globals: { ...globals.node } },
  },
  {
    files: ['renderer/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.browser, STORYLOOM_BUNDLED_FONTS: 'readonly', STORYLOOM_TEMPLATES: 'readonly' },
    },
    // Top-level names are used by other renderer files, so only flag unused locals.
    rules: { 'no-unused-vars': ['error', { vars: 'local' }] },
  },
  ...rendererConfigs,
  {
    // Self-test code passes functions to webContents.executeJavaScript, where they run in the page.
    files: ['selftest/**/*.cjs'],
    languageOptions: { globals: { ...globals.browser } },
  },
];
