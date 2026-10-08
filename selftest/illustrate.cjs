'use strict';
// Illustrate the whole book, through the real Designer, against the local fake services:
// with fal.ai, the main character's portrait is uploaded and sent with every page; pages get pictures,
// keep what they were drawn from, and "Redraw this picture" uses it again. Then the same with your own service.
const fs = require('node:fs/promises');
const mocks = require('./mock-services.cjs');

module.exports = async function illustrate(ctx) {
  const { js, store, pause } = ctx;
  const checks = {};
  const until = async (expr, ms = 20000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { if (await js(expr)) return true; await pause(50); }
    return false;
  };

  // A 4-page book with a main character who has a portrait.
  const book = await store.create({
    title: 'Pip and the Moon', author: 'Kelly Bass', size: 'portrait',
    pages: [
      { layout: 'cover', text: '' },
      { layout: 'image-top', text: 'Pip looked up at the big moon.' },
      { layout: 'image-top', text: 'Pip climbed the tallest hill.' },
      { layout: 'text-only', text: 'The end.' },
    ],
  });
  const portrait = await store.saveImageBytes(book.id, require('./mock-ai.cjs').makePng({}));
  const withCast = await store.read(book.id);
  withCast.builder = { ...(withCast.builder || {}), illustrationStyle: 'Watercolor',
    characters: [{ id: 'c1', name: 'Pip', role: 'Main character', description: 'A small mouse with a red scarf', image: portrait }] };
  await store.save(withCast);

  const fal = await mocks.startFal({ key: 'fal-selftest-key' });
  ctx.useTestServices({ STORYLOOM_TEST_FAL_RUN: fal.runBase, STORYLOOM_TEST_FAL_API: fal.apiBase, STORYLOOM_TEST_FAL_REST: fal.restBase });
  try {
    await js(`api.saveSettings({ writer: 'custom', pictures: 'fal', falKey: 'fal-selftest-key', tier: 'balanced' })`);
    await ctx.navigate('designer', { bookId: book.id });
    await ctx.click('[data-drawer="uploads"]');
    await ctx.waitFor('#illustrate-book');
    await ctx.click('#illustrate-book');
    await ctx.waitFor('#illustrate-dialog');
    checks.castNamed = await js(`/match their portraits: Pip/.test(document.getElementById('illustrate-cast')?.textContent || '')`);
    checks.sendingDisclosed = await js(`/portraits are sent to your picture service/.test(document.getElementById('illustrate-sends')?.textContent || '')`);
    checks.countsPages = await js(`/Pages without a picture \\(2\\)/.test(document.getElementById('illustrate-dialog').textContent)`);
    await until(`!document.getElementById('illustrate-start').disabled`);
    await ctx.click('#illustrate-start');
    checks.finished = await until(`/Drew 2 of 2 pictures/.test(document.getElementById('illustrate-status')?.textContent || '')`, 60000);
    await ctx.screenshot('illustrate');
    await ctx.click('dialog[open] .form-actions .btn.ghost:not([hidden])');

    const saved = await store.read(book.id);
    checks.picturePagesDrawn = Boolean(saved.pages[1].image && saved.pages[2].image);
    checks.coverAndTextLeftAlone = !saved.pages[0].image && !saved.pages[3].image;
    checks.promptsKept = /Scene for page 1/.test(saved.pages[1].imagePrompt) && /Scene for page 2/.test(saved.pages[2].imagePrompt);
    // Every page was drawn with Pip's portrait as a reference, in the book's shape.
    const runs = fal.calls.filter((c) => c.path === '/run/fal-ai/nano-banana-2/edit');
    checks.referencesSent = runs.length === 2 && runs.every((c) => c.body.image_urls?.length === 1 && c.body.aspect_ratio === '3:4');
    checks.referenceUploaded = fal.uploads.length === 2 && fal.uploads.every((u) => u.size > 0);
    checks.styleAndCastInPrompt = runs.every((c) => /Watercolor/.test(c.body.prompt) && /reference picture/.test(c.body.prompt));
    checks.pictureFileSaved = await fs.stat(store.mediaPath(book.id, saved.pages[1].image)).then((s) => s.size > 0, () => false);

    // Redraw one page from what it was drawn from.
    await js(`goToPage(1); true`);
    await ctx.waitFor('#redraw-picture');
    const before = saved.pages[1].image;
    await ctx.click('#redraw-picture');
    checks.redrawn = await until(`state.book.pages[1].image !== ${JSON.stringify(before)} && !document.getElementById('redraw-picture')?.disabled`, 30000);
    checks.redrawReusesPrompt = /Scene for page 1/.test(fal.calls.filter((c) => c.path === '/run/fal-ai/nano-banana-2/edit').at(-1)?.body.prompt || '');
    // A picture chosen from the Mac isn't an AI picture: no Redraw button.
    await js(`(() => { state.book.pages[1].imagePrompt = ''; renderInspector(); return true; })()`);
    checks.noRedrawForOwnPicture = await js(`!document.getElementById('redraw-picture')`);
  } finally {
    ctx.useTestServices({ STORYLOOM_TEST_FAL_RUN: undefined, STORYLOOM_TEST_FAL_API: undefined, STORYLOOM_TEST_FAL_REST: undefined });
    fal.close();
    await js(`api.saveSettings({ pictures: 'custom', clearFalKey: true })`).catch(() => {});
  }

  // With your own service (no reference pictures in its standard call), whole-book drawing still works.
  const own = await store.create({ title: 'Own Service', pages: [{ layout: 'cover', text: '' }, { layout: 'image-left', text: 'A kite.' }] });
  await ctx.navigate('designer', { bookId: own.id });
  await ctx.click('[data-drawer="uploads"]');
  await ctx.click('#illustrate-book');
  await until(`!document.getElementById('illustrate-start').disabled`);
  await ctx.click('#illustrate-start');
  checks.ownServiceWorks = await until(`/Drew 1 of 1 picture/.test(document.getElementById('illustrate-status')?.textContent || '')`, 60000);
  await ctx.click('dialog[open] .form-actions .btn.ghost:not([hidden])');
  checks.ownServiceSaved = Boolean((await store.read(own.id)).pages[1].image);
  return checks;
};
