'use strict';
// Export (PDF digital/print, EPUB, WAV, ISBN, copyright page), Print orders, and Account.
const fs = require('node:fs/promises');
const path = require('node:path');
const { makePng, makeWav } = require('./mock-ai.cjs');
const { unzip } = require('../epub.cjs');

module.exports = async function exportOrdersAccount(ctx) {
  const { js, store, userData, pause } = ctx;
  const checks = {};

  const book = await store.create({
    title: 'The Paper Moon', author: 'Ada Writer', size: 'square',
    pages: [
      { layout: 'cover', text: '', fontSize: 48 },
      { layout: 'image-top', text: 'The moon was made of paper.' },
      { layout: 'text-only', text: 'Goodnight, paper moon.' },
    ],
  });
  const api = (code) => js(`(async () => { ${code} })()`);
  const image = await api(`return api.saveImage(${JSON.stringify(book.id)}, new Uint8Array(${JSON.stringify([...makePng()])}))`);
  const rec = await api(`return api.saveRecording(${JSON.stringify(book.id)}, new Uint8Array(${JSON.stringify([...makeWav(1)])}))`);
  const full = await store.read(book.id);
  full.pages[1].image = image;
  full.pages[2].elements = [{ id: 'shape-one', type: 'shape', shape: 'star', x: 40, y: 40, w: 120, h: 120, rotation: 0, opacity: 1, fill: '#f2c14e', stroke: '#2a2433', strokeWidth: 2 }];
  full.audio = { ...full.audio, narration: { [full.pages[1].id]: { file: rec, duration: 1, source: 'recording' } } };
  await store.save(full);

  await ctx.navigate('export', { bookId: book.id });
  await ctx.assertNoMissing();
  checks.panelShown = await js(`!!document.querySelector('.export-panel [data-export="epub"]') && !!document.querySelector('[data-unavailable="mp3-export"]')`);
  checks.printWarning24 = await js(`/24 pages/.test(document.getElementById('export-print-warning')?.textContent || '') && /3 pages/.test(document.getElementById('export-print-warning').textContent)`);
  checks.wavEnabled = await js(`!document.getElementById('export-wav').disabled`);

  // ISBN: invalid → error, valid → saved.
  await ctx.click('#export-isbn');
  await ctx.type('9780306406158');
  checks.isbnInvalid = await js(`document.getElementById('export-isbn-error').textContent.length > 0`);
  await js(`(() => { const i = $must('#export-isbn'); i.select(); return true; })()`);
  await ctx.type('9780306406157');
  checks.isbnErrorCleared = await js(`document.getElementById('export-isbn-error').textContent === ''`);
  await js('saveNow()');
  checks.isbnSaved = (await store.read(book.id)).isbn === '9780306406157';

  const exists = (name) => fs.stat(path.join(userData, name)).then(() => true, () => false);
  const waitFile = async (name) => { for (let i = 0; i < 100 && !(await exists(name)); i++) await pause(100); return exists(name); };
  const waitIdle = () => js(`$waitFor(() => ![...document.querySelectorAll('.export-card .btn')].some((b) => b.textContent === 'Exporting…'), 30000).then(() => true)`);

  await ctx.click('#export-pdf-print');
  await waitIdle();
  checks.printPdf = await waitFile('self-test-print.pdf');

  await ctx.click('#export-copyright');
  await ctx.click('#export-pdf-digital');
  await waitIdle();
  checks.digitalPdf = await waitFile('self-test.pdf');
  const pdf = (await fs.readFile(path.join(userData, 'self-test.pdf'))).toString('latin1');
  checks.pdfHasCopyrightPage = (pdf.match(/\/Type\s*\/Page(?!s)/g) || []).length === 4;
  checks.pagesNotPersisted = (await store.read(book.id)).pages.length === 3 && await js('state.book.pages.length === 3');
  await ctx.click('#export-copyright'); // Off again for the EPUB.

  await ctx.click('#export-epub');
  await waitIdle();
  checks.epubWritten = await waitFile('self-test.epub');
  const files = unzip(await fs.readFile(path.join(userData, 'self-test.epub')));
  checks.epubMimetype = files.get('mimetype')?.toString() === 'application/epub+zip';
  checks.epubNav = files.has('OEBPS/nav.xhtml');
  const xhtml = [...files.keys()].filter((n) => /OEBPS\/page-\d+\.xhtml$/.test(n));
  checks.epubOnePerPage = xhtml.length === 3;
  checks.epubImage = files.has(`OEBPS/images/${image}`);
  checks.epubIsbn = /urn:isbn:9780306406157/.test(files.get('OEBPS/content.opf')?.toString() || '');
  const page3 = files.get(xhtml.sort()[2]).toString();
  checks.epubShapeSvg = /<svg[^>]*viewBox="0 0 100 100"/.test(page3) && /Goodnight, paper moon\./.test(page3);

  await ctx.click('#export-wav');
  await waitIdle();
  checks.wavWritten = await waitFile('self-test.wav');
  const wav = await fs.readFile(path.join(userData, 'self-test.wav'));
  checks.wavHeader = wav.subarray(0, 4).toString('latin1') === 'RIFF' && wav.subarray(8, 12).toString('latin1') === 'WAVE'
    && wav.readUInt32LE(24) === 44100 && wav.readUInt16LE(22) === 2;
  checks.wavDuration = wav.readUInt32LE(40) / wav.readUInt32LE(28) >= 0.99;

  await js(`document.getElementById('toast').classList.remove('toast-visible'); document.getElementById('screen').scrollTop = 0; true`);
  await ctx.screenshot();

  // Dialog from the designer's Export… button.
  await ctx.navigate('designer', { bookId: book.id });
  await ctx.click('#export-pdf');
  checks.dialogOpen = await js(`$waitFor('dialog.export-modal[open] .export-panel', 5000).then(() => true, () => false)`);
  await js(`document.querySelector('dialog.export-modal')?.close(); true`);

  await ctx.navigate('orders');
  await ctx.assertNoMissing();
  checks.ordersUnavailable = await js(`!!document.querySelector('[data-unavailable="print-ordering"]')`);
  await ctx.click('#orders-export');
  checks.ordersPicker = await js(`$waitFor('[data-book-id="${book.id}"]', 5000).then(() => true, () => false)`);
  await ctx.screenshot('orders');
  await ctx.click(`[data-book-id="${book.id}"]`);
  await js(`$waitFor(() => window.__storyloom.current() === 'export' && document.querySelector('.export-panel'), 5000).then(() => true)`);
  checks.ordersToExport = await js(`window.__storyloom.current() === 'export' && state.book.id === ${JSON.stringify(book.id)}`);

  await ctx.navigate('account');
  await ctx.assertNoMissing();
  const before = await js('api.getSettings()');
  checks.accountPrefilled = await js(`$must('#account-base-url').value`) === before.baseUrl;
  checks.cloudUnavailable = await js(`!!document.querySelector('[data-unavailable="cloud-account"]')`);
  checks.licenseShown = await js(`/GNU AGPL v3/.test(document.getElementById('account-about')?.textContent || '')`);
  // The privacy link goes through the fixed allow-list in main.cjs (open-link opens nothing under --self-test).
  checks.privacyLink = await js(`(() => { const b = document.querySelector('[data-action="privacy"]'); return !!b && b.textContent === 'What leaves your Mac'; })()`)
    && (await js(`api.openLink('privacy')`)) === true;
  checks.notOfflineOnly = await js(`!/runs entirely on this Mac|works offline/i.test(document.querySelector('.screen-host')?.textContent || document.body.textContent)`);
  checks.dataPath = await js(`$must('#account-data-path').textContent.length > 0`);
  await ctx.click('#account-author');
  await ctx.type('Ada Writer');
  await ctx.click('#account-profile-save');
  await js(`$waitFor(() => document.getElementById('account-profile-status').textContent === 'Saved', 5000).then(() => true)`);
  checks.authorSaved = (await store.getProfile()).authorName === 'Ada Writer';

  await js(`(() => { for (const [id, v] of [['account-model', 'writer-2'], ['account-image-model', 'painter-2'], ['account-speech-model', 'voice-2']]) { $must('#' + id).value = v; } $must('#account-voice').value = 'nova'; return true; })()`);
  await ctx.click('#account-ai-save');
  await js(`$waitFor(() => document.getElementById('account-ai-status')?.textContent === 'Saved', 5000).then(() => true)`);
  const after = await js('api.getSettings()');
  checks.aiSaved = after.model === 'writer-2' && after.imageModel === 'painter-2' && after.speechModel === 'voice-2' && after.voice === 'nova' && after.baseUrl === before.baseUrl;
  // Inline error for a bad address.
  await js(`(() => { $must('#account-base-url').value = 'http://example.com/v1'; return true; })()`);
  await ctx.click('#account-ai-save');
  checks.aiErrorInline = await js(`$waitFor(() => document.getElementById('account-ai-error')?.textContent.includes('https'), 5000).then(() => true, () => false)`);
  checks.baseUrlKept = (await js('api.getSettings()')).baseUrl === before.baseUrl;
  await ctx.screenshot('account');
  return checks;
};
