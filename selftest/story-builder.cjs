'use strict';
// Story builder: validation, characters + library, details, preview, AI write, offline outline.
const { makePng } = require('./mock-ai.cjs');

module.exports = async function storyBuilder(ctx) {
  const { js, pause, store } = ctx;
  const checks = {};
  const book = await store.create({ title: '', author: 'Robin Vale', pages: [{ layout: 'cover', text: '', fontSize: 48 }] });
  await ctx.navigate('story-builder', { bookId: book.id });
  await ctx.waitFor('#sb-write');

  // Empty idea → inline errors, nothing written.
  await ctx.click('#sb-write');
  await pause(400);
  checks.validationShown = await js(`!!document.querySelector('[data-field="idea"].sb-invalid .sb-error') && !!document.querySelector('[data-field="title"].sb-invalid')`);
  checks.stayedOnBuilder = (await js('window.__storyloom.current()')) === 'story-builder';
  await js('saveNow()');
  checks.noChaptersYet = ((await store.read(book.id)).manuscript?.chapters || []).length === 0;

  // Title and idea by typing.
  await ctx.click('#sb-title');
  await js(`document.getElementById('sb-title').select(); true`);
  await ctx.type('The Lantern Otter');
  await ctx.click('#sb-idea');
  await ctx.type('A small otter learns to swim at night to rescue a friend.');
  checks.errorsCleared = await js(`!document.querySelector('.sb-invalid')`);
  checks.bookBarSynced = (await js(`document.getElementById('book-title').value`)) === 'The Lantern Otter';

  // Add a character with a picture.
  await ctx.setOpenFile(await ctx.fixture('kid.png', makePng(64, 64, () => [200, 120, 80, 255])));
  await ctx.click('#sb-add-character');
  await ctx.waitFor('dialog[open] #sb-character-name');
  await ctx.click('#sb-character-name');
  await ctx.type('Otto');
  await ctx.click('#sb-character-description');
  await ctx.type('A sleek brown otter with a tiny lantern');
  await ctx.click('dialog[open] [data-action="choose-picture"]');
  await ctx.waitFor('dialog[open] .sb-picture-img');
  // The cover preview shows the new picture while the dialog is still open (before saving).
  checks.previewLiveDraft = await js(`$waitFor(() => {
    const draft = document.querySelector('dialog[open] .sb-picture-img')?.src;
    return draft && document.querySelector('#sb-cover img')?.src === draft ? true : null;
  }, 5000).catch(() => false)`);
  checks.previewLiveCast = await js(`$waitFor(() => /Starring Otto/.test(document.getElementById('sb-cast')?.textContent || '') || null, 5000).catch(() => false)`);
  // The dialog explains who draws pictures: subscriptions can't, the configured API service does.
  const note = await js(`$waitFor(() => document.querySelector('dialog[open] .ai-picture-note strong') && document.querySelector('dialog[open] .ai-picture-note').textContent, 5000)`);
  checks.pictureNoteReady = /don\u2019t draw pictures in Storyloom/.test(note) && /your own AI service \(mock-painter\)/.test(note);
  checks.drawEnabled = await js(`!document.querySelector('dialog[open] [data-action="draw-portrait"]').disabled`);
  await ctx.click('#sb-character-save');
  await ctx.waitFor('.sb-character .sb-avatar img');
  checks.characterAdded = (await js(`document.querySelectorAll('.sb-left .sb-character').length`)) === 1;

  // Without a picture service: the button is disabled and the dialog says what to set up.
  // A cancelled edit shows on the preview while typing, then disappears.
  await js(`api.saveSettings({ pictures: 'openrouter' })`);
  await ctx.click('#sb-add-character');
  await ctx.waitFor('dialog[open] #sb-character-name');
  const missing = await js(`$waitFor(() => document.querySelector('dialog[open] .ai-picture-note-missing')?.textContent || null, 5000)`);
  checks.pictureNoteMissing = /aren\u2019t set up/.test(missing) && /add an OpenRouter key/.test(missing);
  checks.drawDisabled = await js(`document.querySelector('dialog[open] [data-action="draw-portrait"]').disabled`);
  await ctx.screenshot('story-builder-pictures');
  checks.previewNoNull = await js(`!/\\bnull\\b/.test(document.querySelector('.sb-preview-body').textContent)`);
  await ctx.click('#sb-character-name');
  await ctx.type('Zed');
  checks.previewTypingLive = await js(`$waitFor(() => /Zed/.test(document.getElementById('sb-cast')?.textContent || '') || null, 5000).catch(() => false)`);
  await ctx.click('dialog[open] .form-actions .btn.ghost');
  checks.previewCancelReverts = await js(`$waitFor(() => !/Zed/.test(document.getElementById('sb-cast')?.textContent || '') || null, 5000).catch(() => false)`);
  // A change that lands after the dialog closed (like a slow portrait) must not bring the draft back.
  await ctx.click('#sb-add-character');
  await ctx.waitFor('dialog[open] #sb-character-name');
  // Close, wait for the dialog's close event to finish, then deliver the late change.
  await js(`new Promise((resolve) => {
    const dialog = document.querySelector('dialog[open]');
    window.__lateForm = dialog.querySelector('form');
    dialog.addEventListener('close', () => setTimeout(resolve, 50), { once: true });
    dialog.close();
  }).then(() => {
    __lateForm.elements.name.value = 'Late Larry';
    __lateForm.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })`);
  await pause(100);
  checks.previewIgnoresLateDraft = await js(`!/Late Larry/.test(document.getElementById('sb-cast')?.textContent || '')`);
  await js(`api.saveSettings({ pictures: 'custom' })`);

  // Save to library, then insert a second copy.
  await ctx.click('[data-action="save-to-library"]');
  await pause(400);
  const lib = await store.listCharacters();
  checks.savedToLibrary = lib.length === 1 && lib[0].name === 'Otto' && !!lib[0].image;
  await ctx.click('#sb-insert-character');
  await ctx.waitFor('dialog[open] [data-action="insert"]');
  checks.libraryPicture = await js(`(document.querySelector('dialog[open] .sb-avatar img')?.src || '').startsWith('app://media/_characters/')`);
  await ctx.click('dialog[open] [data-action="insert"]');
  await js(`$waitFor(() => document.querySelectorAll('.sb-left .sb-character').length === 2 || null)`);
  checks.insertedCopy = (await js(`document.querySelectorAll('.sb-left .sb-character').length`)) === 2;

  // Details, level, length, look.
  await ctx.click('[data-genre="Adventure"]');
  await ctx.click('[data-style="Rhyming"]');
  await ctx.click('[data-style="Gentle"]');
  await ctx.click('[data-level="growing-reader"]');
  await ctx.click('[data-length="tiny"]');
  await ctx.click('[data-illustration="Watercolor"]');
  await ctx.click('#sb-themes .sb-theme', { index: 1 });
  await ctx.click('[data-size="landscape"]');
  await ctx.click('[data-sb="location"]');
  await ctx.type('a seaside village');
  checks.previewSetting = await js(`$waitFor(() => /Set in a seaside village/.test(document.getElementById('sb-setting')?.textContent || '') || null, 5000).catch(() => false)`);
  await js('$settle()');
  const preview = await js(`(() => { const c = document.querySelector('#sb-cover'); return { text: c?.textContent || '', landscape: !!c?.querySelector('.page.size-landscape') }; })()`);
  checks.previewTitle = preview.text.includes('The Lantern Otter') && preview.text.includes('Robin Vale');
  checks.previewSize = preview.landscape;
  // At the smallest window size the cover preview still fits inside its column.
  const [winW, winH] = ctx.win.getSize();
  ctx.win.setSize(1100, 700);
  await pause(200);
  await js('$settle()');
  checks.coverFitsAtMinWidth = await js(`(() => { const c = $must('#sb-cover .page-frame').getBoundingClientRect(); const p = $must('.sb-preview').getBoundingClientRect(); return c.left >= p.left && c.right <= p.right; })()`);
  ctx.win.setSize(winW, winH);
  await pause(200);
  await js(`$must('.sb-left').scrollTop = 0; $settle()`);
  await ctx.screenshot();

  // Write with AI (mock service).
  await ctx.click('#sb-write');
  await js(`$waitFor(() => window.__storyloom.current() === 'manuscript' || null, 20000)`);
  checks.wentToManuscript = (await js('window.__storyloom.current()')) === 'manuscript';
  await js('saveNow()');
  const saved = await store.read(book.id);
  const chapters = saved.manuscript.chapters;
  checks.chaptersWritten = chapters.length > 0 && chapters.every((c) => c.blocks.length && c.blocks.every((b) => b.type === 'p' && b.runs[0].text));
  const b = saved.builder;
  checks.builderPersisted = b.idea.startsWith('A small otter') && b.genre === 'Adventure' && b.writingStyle.join() === 'Rhyming,Gentle'
    && b.readingLevel === 'growing-reader' && b.length === 'tiny' && b.illustrationStyle === 'Watercolor' && !!b.templateId
    && b.characters.length === 2 && b.characters.every((c) => c.image) && saved.size === 'landscape' && saved.title === 'The Lantern Otter';

  // Outline on a fresh book.
  const second = await store.create({ title: 'Quiet Hills', builder: { length: 'medium' } });
  await ctx.navigate('story-builder', { bookId: second.id });
  await ctx.click('#sb-outline');
  await js(`$waitFor(() => window.__storyloom.current() === 'manuscript' || null)`);
  await js('saveNow()');
  checks.outlineChapters = (await store.read(second.id)).manuscript.chapters.length === 18;
  return checks;
};
