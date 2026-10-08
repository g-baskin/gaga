'use strict';
// Save and open dialogs, and writing exported books (PDF, EPUB, WAV) to where the person chose.
const fs = require('node:fs/promises');
const path = require('node:path');
const { shell } = require('electron');
const { buildEpub, collectImages } = require('../epub.cjs');

const clip = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

function createExports({ app, dialog, selfTest, getWindow, getStore, rendererDir }) {
  const RENDERER = rendererDir;
  let lastExport = null;
  // --- Export helpers ---
  const safeTitle = (value) => (typeof value === 'string' ? value : '').replace(/[\\/:*?"<>|\x00-\x1f]/g, '').trim().slice(0, 100) || 'Story';
  // Asks where to save (or uses a fixed file during the self-test). Returns null if cancelled.
  async function chooseSaveFile(title, ext, label) {
    if (selfTest) return path.join(app.getPath('userData'), `self-test.${ext}`);
    const result = await dialog.showSaveDialog(getWindow(), {
      defaultPath: path.join(app.getPath('documents'), `${safeTitle(title)}.${ext}`), filters: [{ name: label, extensions: [ext] }],
    });
    return result.canceled || !result.filePath ? null : result.filePath;
  }
  // Self-test only: the next file an "open" dialog would return (null acts like Cancel).
  let selfTestOpenFile = null;
  async function chooseOpenFile(name, extensions) {
    if (selfTest) { const file = selfTestOpenFile; selfTestOpenFile = null; return file; }
    const result = await dialog.showOpenDialog(getWindow(), { properties: ['openFile'], filters: [{ name, extensions }] });
    return result.canceled || !result.filePaths[0] ? null : result.filePaths[0];
  }
  function toBuffer(bytes, max, label) {
    if (!(bytes instanceof Uint8Array) && !(bytes instanceof ArrayBuffer)) throw new Error(`${label} data is missing`);
    const buffer = Buffer.from(bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes);
    if (buffer.length > max) throw new Error(`${label} is too large`);
    return buffer;
  }
  const ISO_LANG = { english: 'en', spanish: 'es', french: 'fr', german: 'de', italian: 'it', portuguese: 'pt', dutch: 'nl', polish: 'pl', swedish: 'sv', japanese: 'ja', chinese: 'zh', korean: 'ko', arabic: 'ar', hindi: 'hi' };

  // The bundled font files for the requested font keys, read from the app's own renderer/fonts folder.
  // Only keys listed in fonts.json are used, so the page can't pull any other file into the e-book.
  async function bundledFontsFor(keys) {
    if (!Array.isArray(keys) || keys.length === 0) return [];
    const manifest = JSON.parse(await fs.readFile(path.join(RENDERER, 'fonts', 'fonts.json'), 'utf8'));
    const out = [];
    for (const key of new Set(keys.filter((k) => typeof k === 'string').slice(0, 40))) {
      const font = manifest.fonts.find((f) => f.key === key);
      if (!font?.cssFamily) continue;
      for (const f of font.files) {
        if (!/^[a-z0-9-]+\.woff2$/.test(f.file)) continue;
        out.push({ family: font.cssFamily, weight: f.weight, style: f.style, file: f.file, unicodeRange: f.unicodeRange, data: await fs.readFile(path.join(RENDERER, 'fonts', f.file)) });
      }
    }
    return out;
  }

  async function exportEpub(input = {}) {
    const book = await getStore().read(input.bookId);
    const pages = Array.isArray(input.pages) ? input.pages.slice(0, 500) : [];
    if (pages.length === 0) throw new Error('The book has no pages');
    const bodies = pages.map((p, i) => {
      const body = typeof p?.body === 'string' ? p.body : '';
      if (body.length > 2_000_000) throw new Error(`Page ${i + 1} is too large`);
      if (/<script|\son\w+=|javascript:/i.test(body)) throw new Error('Pages may not contain scripts');
      return { body, label: clip(p?.label, 100) || `Page ${i + 1}` };
    });
    const css = typeof input.css === 'string' ? input.css.slice(0, 2_000_000) : '';
    if (/@import|url\(\s*['"]?(?!images\/)/i.test(css)) throw new Error('The stylesheet may only reference book images');
    // Only images that really exist in this book's folder are packaged; references to missing ones are dropped.
    const packed = await collectImages({ pages: bodies, css, read: (name) => fs.readFile(getStore().mediaPath(book.id, name)) });
    const { images } = packed;
    const coverFirst = typeof input.coverImage === 'string' ? images.findIndex((img) => img.name === input.coverImage) : -1;
    if (coverFirst > 0) images.unshift(...images.splice(coverFirst, 1));
    const width = Math.min(4000, Math.max(100, Math.round(Number(input.width) || 816)));
    const height = Math.min(4000, Math.max(100, Math.round(Number(input.height) || 816)));
    const fonts = await bundledFontsFor(input.fonts);
    const epub = buildEpub({
      book: { id: book.id, title: book.title, author: book.author, isbn: book.isbn, language: ISO_LANG[book.language.toLowerCase()] || 'en', modified: new Date() },
      pages: packed.pages, css: packed.css, width, height, images, fonts,
    });
    const file = await chooseSaveFile(book.title, 'epub', 'EPUB book');
    if (!file) return null;
    await fs.writeFile(file, epub);
    lastExport = file;
    return path.basename(file);
  }

  // Prints the page that asked (the export view) to PDF.
  async function exportPdf(event, input = {}) {
    const mode = input.mode === 'print' ? 'print' : 'digital';
    const file = await chooseSaveFile(input.title, 'pdf', 'PDF');
    if (!file) return null;
    const pdf = await event.sender.printToPDF({ printBackground: true, preferCSSPageSize: true, margins: { marginType: 'none' } });
    const target = selfTest && mode === 'print' ? file.replace(/\.pdf$/, '-print.pdf') : file;
    await fs.writeFile(target, pdf);
    lastExport = target;
    return path.basename(target);
  }

  async function exportWav(input = {}) {
    const wav = toBuffer(input.bytes, 1024 * 1024 * 1024, 'The audio');
    if (wav.subarray(0, 4).toString('latin1') !== 'RIFF' || wav.subarray(8, 12).toString('latin1') !== 'WAVE') throw new Error('The audio is not a WAV file');
    const file = await chooseSaveFile(input.title, 'wav', 'WAV audio');
    if (!file) return null;
    await fs.writeFile(file, wav);
    lastExport = file;
    return path.basename(file);
  }

  const revealExport = () => { if (lastExport) shell.showItemInFolder(lastExport); };

  return {
    chooseOpenFile, toBuffer, exportEpub, exportPdf, exportWav, revealExport,
    setSelfTestOpenFile: (file) => { selfTestOpenFile = file; },
  };
}

module.exports = { createExports };
