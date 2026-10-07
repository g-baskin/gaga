'use strict';
// Checks the bundled fonts and every page theme without Electron: font files match fonts.json, every theme
// uses real fonts and survives a save, and e-books embed the fonts they use.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const { sanitizePage } = require('../storage.cjs');
const { buildEpub, unzip } = require('../epub.cjs');

const root = path.join(__dirname, '..');
const fontsDir = path.join(root, 'renderer', 'fonts');
const manifest = JSON.parse(fs.readFileSync(path.join(fontsDir, 'fonts.json'), 'utf8'));
const MAC_FONTS = ['serif', 'sans', 'rounded', 'hand'];
const fontKeys = new Set([...MAC_FONTS, ...manifest.fonts.map((f) => f.key)]);

// Loads renderer/data/templates.js the way the app does, with the few globals it reads.
function loadTemplates() {
  const window = {};
  let n = 0;
  const context = vm.createContext({ window, crypto: { randomUUID: () => `id-${++n}-abcdefgh` }, PAGE_PT: { square: [612, 612], portrait: [612, 792], landscape: [792, 612] } });
  vm.runInContext(fs.readFileSync(path.join(root, 'renderer', 'data', 'templates.js'), 'utf8'), context);
  return window.STORYLOOM_TEMPLATES;
}

test('every bundled font file matches fonts.json and has an allowed license', () => {
  assert.ok(manifest.fonts.length >= 16, 'at least 16 bundled fonts');
  for (const font of manifest.fonts) {
    assert.match(font.key, /^[a-z0-9-]{1,32}$/);
    assert.ok(['OFL-1.1', 'Apache-2.0'].includes(font.license), `${font.key} license ${font.license}`);
    assert.equal(font.cssFamily, `Storyloom ${font.family}`);
    assert.ok(font.files.some((f) => f.weight === 400 && f.style === 'normal' && f.subset === 'latin'), `${font.key} has a regular latin file`);
    for (const f of font.files) {
      const data = fs.readFileSync(path.join(fontsDir, f.file));
      assert.equal(createHash('sha256').update(data).digest('hex'), f.sha256, f.file);
      assert.equal(data.subarray(0, 4).toString('latin1'), 'wOF2', `${f.file} is a woff2 file`);
    }
    assert.ok(fs.readFileSync(path.join(fontsDir, font.licenseFile), 'utf8').length > 200, `${font.key} license text`);
  }
});

test('a saved page keeps a bundled font and its title font, and refuses unknown fonts', () => {
  const page = sanitizePage({ layout: 'cover', font: 'andika', titleFont: 'luckiest' });
  assert.equal(page.font, 'andika');
  assert.equal(page.titleFont, 'luckiest');
  const bad = sanitizePage({ layout: 'cover', font: 'Comic Sans', titleFont: '../../etc' });
  assert.equal(bad.font, 'serif');
  assert.equal(bad.titleFont, '');
});

test('every theme has unique ids, real fonts, a category, and pages that survive a save', () => {
  const { themes, starters, categories } = loadTemplates();
  assert.ok(themes.length >= 24, `at least 24 themes (got ${themes.length})`);
  assert.equal(new Set(themes.map((t) => t.id)).size, themes.length, 'theme ids are unique');
  assert.equal(new Set(themes.map((t) => t.name)).size, themes.length, 'theme names are unique');
  assert.ok(categories.includes('Animals'));
  for (const theme of themes) {
    assert.ok(fontKeys.has(theme.font), `${theme.id} font ${theme.font}`);
    assert.ok(fontKeys.has(theme.titleFont), `${theme.id} title font ${theme.titleFont}`);
    assert.notEqual(theme.font, theme.titleFont, `${theme.id} pairs two different fonts`);
    for (const value of [theme.palette.background, theme.palette.ink, theme.frameColor]) assert.match(value, /^#[0-9a-f]{6}$/i, theme.id);
    for (const size of ['square', 'portrait', 'landscape']) {
      for (const page of [theme.cover, theme.page]) {
        const saved = sanitizePage({ ...page, id: 'page-1' });
        assert.equal(saved.font, theme.font, `${theme.id} body font survives a save`);
        assert.equal(saved.titleFont, theme.titleFont, `${theme.id} title font survives a save`);
        assert.equal(saved.elements.length, page.elements.length, `${theme.id} (${size}) keeps every decoration`);
      }
    }
  }
  for (const starter of starters) assert.ok(themes.some((t) => t.id === starter.themeId), `${starter.id} uses a real theme`);
});

test('applying a theme sets both fonts on every page', () => {
  const { applyTheme, themes } = loadTemplates();
  const theme = themes.find((t) => t.id === 'jungle-trek');
  const book = { size: 'landscape', pages: [{ layout: 'cover', elements: [] }, { layout: 'image-top', elements: [{ id: 'mine', type: 'text' }] }] };
  applyTheme(book, theme.id);
  for (const page of book.pages) {
    assert.equal(page.font, theme.font);
    assert.equal(page.titleFont, theme.titleFont);
  }
  assert.ok(book.pages[1].elements.some((el) => el.id === 'mine'), 'the author’s own elements stay');
});

test('an e-book embeds the font files it uses, with matching @font-face rules', () => {
  const font = manifest.fonts.find((f) => f.key === 'andika');
  const fonts = font.files.map((f) => ({ family: font.cssFamily, weight: f.weight, style: f.style, file: f.file, data: fs.readFileSync(path.join(fontsDir, f.file)) }));
  const epub = buildEpub({ book: { id: 'b1', title: 'T', language: 'en' }, pages: [{ body: '<p>Hi</p>' }], css: '', width: 600, height: 600, fonts });
  const files = Object.fromEntries(unzip(epub)); // unzip returns a Map of name → data
  for (const f of font.files) assert.ok(files[`OEBPS/fonts/${f.file}`], `${f.file} is in the e-book`);
  const opf = files['OEBPS/content.opf'].toString('utf8');
  assert.match(opf, /href="fonts\/andika-400-normal-latin\.woff2" media-type="font\/woff2"/);
  const css = files['OEBPS/book.css'].toString('utf8');
  assert.match(css, /@font-face \{ font-family: "Storyloom Andika"; src: url\("fonts\/andika-400-normal-latin\.woff2"\)/);
  // Names that could break out of the stylesheet or the package are never embedded.
  const unsafe = buildEpub({ book: { id: 'b1', title: 'T', language: 'en' }, pages: [{ body: '<p>Hi</p>' }], css: '', width: 600, height: 600,
    fonts: [{ family: 'X"; } body { display:none', weight: 400, style: 'normal', file: '../evil.woff2', data: Buffer.from('x') }] });
  const unsafeFiles = [...unzip(unsafe).keys()];
  assert.ok(!unsafeFiles.some((n) => n.includes('evil')), 'unsafe file names are dropped');
});
