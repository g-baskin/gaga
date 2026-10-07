'use strict';
// Manuscript: chapters, rich text stored as blocks, word limit, reorder, AI chapter, plain paste, lay out into pages.

module.exports = async function manuscript(ctx) {
  const { js, pause } = ctx;
  const checks = {};
  const book = await ctx.store.create({
    title: 'Moon Meadow', author: 'Ada Pine',
    builder: { readingLevel: 'first-words' },
    manuscript: { chapters: [{ id: 'chapter-one', title: 'Opening', blocks: [] }] },
  });
  await ctx.navigate('manuscript', { bookId: book.id });
  await ctx.assertNoMissing();
  checks.limitsExposed = await js(`window.STORYLOOM_WORD_LIMITS['first-words'] === 40 && window.STORYLOOM_WORD_LIMITS['confident-reader'] === 300`);
  checks.titleShown = await js(`document.querySelector('#ms-book-title').value === 'Moon Meadow'`);

  // Add and rename a chapter.
  await ctx.click('#ms-add-chapter');
  await ctx.waitFor('[data-chapter]:nth-child(2).active');
  await ctx.click('[data-chapter]:nth-child(2) [data-rename]');
  await ctx.waitFor('.ms-rename');
  await ctx.type('The Meadow');
  await ctx.key('Enter');
  const saved = async () => { await js('saveNow()'); return ctx.store.read(book.id); };
  let b = await saved();
  checks.chapterAdded = b.manuscript.chapters.length === 2 && b.manuscript.chapters[1].title === 'The Meadow';

  // Type, then bold one word with ⌘B.
  await ctx.click('#ms-editor');
  await ctx.type('The fox ran fast.');
  await js(`(() => { const t = $must('#ms-editor p').firstChild; const r = document.createRange(); r.setStart(t, 4); r.setEnd(t, 7);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
  await ctx.key('b', ['meta']);
  await pause(50);
  checks.boldPressed = await js(`$must('[data-format="bold"]').getAttribute('aria-pressed') === 'true'`);
  b = await saved();
  const runs = b.manuscript.chapters[1].blocks[0]?.runs || [];
  checks.boldRun = runs.some((r) => r.text === 'fox' && r.b === true) && runs.some((r) => r.text === 'The ' && !r.b);

  // Block type → Heading.
  await js(`(() => { const sel = $must('#ms-block-type'); sel.value = 'h2'; sel.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  b = await saved();
  checks.heading = b.manuscript.chapters[1].blocks[0]?.type === 'h2' && (await js(`!!document.querySelector('#ms-editor h2 strong')`));

  // Enter makes a new paragraph; then fill to the 40-word limit.
  await js(`(() => { const ed = $must('#ms-editor'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
  await ctx.key('Enter');
  await ctx.type('Then the moon rose.');
  b = await saved();
  checks.newParagraph = b.manuscript.chapters[1].blocks.length === 2 && b.manuscript.chapters[1].blocks[1].type === 'p';
  checks.noticeHiddenBelowLimit = await js(`$must('#ms-limit-notice').hidden`);
  const filler = Array.from({ length: 32 }, (_v, i) => `w${i}`).join(' ');
  await ctx.type(` ${filler}`);
  checks.atLimit = await js(`$must('#ms-chapter-words').textContent.startsWith('40 /')`);
  await ctx.type(' extra words here');
  await pause(50);
  checks.extraBlocked = await js(`$must('#ms-chapter-words').textContent.startsWith('40 /') && !$must('#ms-editor').textContent.includes('extra')`);
  checks.noticeShown = await js(`!$must('#ms-limit-notice').hidden && $must('#ms-limit-notice').textContent.includes('40')`);
  await ctx.key('Backspace');
  checks.deleteAllowed = await js(`!$must('#ms-editor').textContent.includes('w31')`);
  await ctx.screenshot();

  // Reorder: move The Meadow up.
  await ctx.click('[data-chapter]:nth-child(2) [data-move="up"]');
  b = await saved();
  checks.reordered = b.manuscript.chapters[0].title === 'The Meadow' && b.manuscript.chapters[1].title === 'Opening';

  // AI writes the empty Opening chapter (mock service).
  await ctx.click('[data-chapter]:nth-child(2) .ms-chapter-open');
  await ctx.waitFor('#ms-ai');
  checks.aiLabel = await js(`$must('#ms-ai').textContent === 'Write with AI'`);
  await ctx.click('#ms-ai');
  await js(`$waitFor(() => document.querySelector('#ms-editor')?.textContent.includes('moon hummed'))`);
  b = await saved();
  const opening = b.manuscript.chapters[1];
  checks.aiFilled = opening.blocks.length === 2 && opening.blocks[0].runs[0].text === 'The moon hummed a quiet song.';

  // Paste: HTML formatting must not leak.
  const paste = await js(`(() => { const ed = $must('#ms-editor'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed.lastElementChild); r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    const dt = new DataTransfer(); dt.setData('text/html', '<b style="color:red">Sunny</b> <i>day</i><script>x()</script>');
    ed.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    return { tags: ed.querySelectorAll('b, i, strong, em, script, span[style]').length, text: ed.textContent }; })()`);
  b = await saved();
  const lastRuns = b.manuscript.chapters[1].blocks.at(-1).runs;
  checks.pastePlain = paste.tags === 0 && paste.text.includes('Sunny day') && lastRuns.every((r) => !r.b && !r.i);

  // Lay out into pages.
  await ctx.click('#ms-layout');
  await js(`$waitFor(() => window.__storyloom.current() === 'designer')`);
  checks.onDesigner = (await js('window.__storyloom.current()')) === 'designer';
  b = await ctx.store.read(book.id);
  checks.pages = b.pages.length === 3 && b.pages[0].layout === 'cover'
    && b.pages[1].text.startsWith('The fox ran fast.') && b.pages[2].text.startsWith('The moon hummed')
    && b.pages[1].layout === 'image-top' && b.pages[1].fontSize === 32;
  return checks;
};
