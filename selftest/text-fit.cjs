'use strict';
// Page words that are too long shrink to fit, on screen, in PDFs, and in e-books; the Designer says so.
const fs = require('node:fs/promises');
const path = require('node:path');
const { unzip } = require('../epub.cjs');

// A real chapter Claude wrote for an early reader (64 words): too long for 28 pt under a picture, but it fits smaller.
const LONG = 'One day the sun slipped away early. The ice turned blue, then gray, then black. Pemba\'s flippers began to shake. '
  + 'Wiggle, wiggle, wobble! She waddled forward and bumped into something round and cold. "Sorry, Mr. Snowball," she whispered. '
  + 'The snowball did not answer. Pemba gulped. It was only a snowball! She giggled a tiny giggle, but her flippers still shook.';
const SHORT = 'Pemba looked up at the sky.';

module.exports = async function textFit(ctx) {
  const { js, store, userData } = ctx;
  const checks = {};
  const book = await store.create({
    title: 'Fit Test', author: 'Kelly Bass', size: 'square',
    pages: [
      { layout: 'cover', text: '', fontSize: 48, font: 'fredoka' },
      { layout: 'image-top', text: LONG, fontSize: 28, font: 'nunito' },
      { layout: 'image-top', text: SHORT, fontSize: 28, font: 'nunito' },
      { layout: 'image-top', text: `${LONG}\n\n${LONG}\n\n${LONG}`, fontSize: 28, font: 'nunito' },
    ],
  });
  await ctx.navigate('designer', { bookId: book.id });
  await ctx.waitFor('#page .page-text');
  await js(`loadFonts(['nunito', 'fredoka']).then(() => true)`);

  // How a rendered page's words sit: font size, and whether they stay inside the page's text area.
  const measure = (index) => js(`(() => {
    const el = renderPage(state.book.pages[${index}], state.book, { print: true });
    document.body.append(el);
    const box = el.querySelector('.page-text');
    const result = { size: parseFloat(box.style.fontSize), inside: textFits(el) };
    el.remove();
    return result;
  })()`);

  const longPage = await measure(1);
  const shortPage = await measure(2);
  checks.longPageShrunk = longPage.size < 28 && longPage.size >= 17 && longPage.inside;
  checks.shortPageUnchanged = shortPage.size === 28 && shortPage.inside;
  checks.savedSizeKept = (await store.read(book.id)).pages[1].fontSize === 28;

  // The Designer explains what happened on each page.
  await js(`goToPage(1); true`);
  checks.noteShrunk = await js(`$waitFor(() => /Shrunk to \\d+ pt/.test(document.getElementById('page-fit-note')?.textContent || '') || null, 5000).then(() => true, () => false)`);
  await ctx.screenshot('text-fit');
  await js(`goToPage(2); true`);
  checks.noteEmptyWhenFits = await js(`$waitFor(() => document.getElementById('page-fit-note')?.textContent === '' || null, 5000).then(() => true, () => false)`);
  await js(`goToPage(3); true`);
  checks.noteWarnsWhenTooLong = await js(`$waitFor(() => (document.getElementById('page-fit-note')?.classList.contains('warn') && /don’t fit/.test(document.getElementById('page-fit-note').textContent)) || null, 5000).then(() => true, () => false)`);

  // Shortening the words grows the text back to the chosen size.
  await js(`(() => { state.book.pages[1].text = ${JSON.stringify(SHORT)}; refreshPage(); return true; })()`);
  checks.growsBack = (await measure(1)).size === 28;
  await js(`(() => { state.book.pages[1].text = ${JSON.stringify(LONG)}; refreshPage(); return saveNow().then(() => true); })()`);

  // The PDF and the e-book use the same shrunk size.
  await ctx.navigate('export', { bookId: book.id });
  await ctx.waitFor('#export-epub');
  await ctx.click('#export-epub');
  await js(`$waitFor(() => ![...document.querySelectorAll('.export-card .btn')].some((b) => b.textContent === 'Exporting…'), 60000).then(() => true)`);
  for (let i = 0; i < 100; i++) { if (await fs.stat(path.join(userData, 'self-test.epub')).then(() => true, () => false)) break; await ctx.pause(100); }
  const files = unzip(await fs.readFile(path.join(userData, 'self-test.epub')));
  const page2 = files.get('OEBPS/page-0002.xhtml')?.toString() || '';
  const px = Number((/class="sl-text" style="[^"]*font-size: ?([\d.]+)px/.exec(page2) || [])[1]);
  checks.epubUsesFittedSize = Math.abs(px - longPage.size * (4 / 3)) < 0.6;
  return checks;
};
