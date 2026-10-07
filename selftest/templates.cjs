'use strict';
// Templates catalogue, theme application, crop dialog, and the "Generate a picture" drawer extra.
const { makePng } = require('./mock-ai.cjs');

const tplCount = (book) => book.pages.reduce((n, p) => n + p.elements.filter((e) => e.id.startsWith('tpl-')).length, 0);

module.exports = async function templates(ctx) {
  const { js } = ctx;
  const checks = {};

  // ---------- catalogue ----------
  await ctx.navigate('templates');
  await ctx.assertNoMissing();
  const counts = await js(`({ themes: document.querySelectorAll('[data-theme-id]').length, starters: document.querySelectorAll('[data-starter-id]').length,
    data: STORYLOOM_TEMPLATES.themes.length, starterData: STORYLOOM_TEMPLATES.starters.length,
    pagesOk: STORYLOOM_TEMPLATES.starters.every((s) => s.pages.length >= 6 && s.pages.length <= 8) })`);
  checks.allThemesShown = counts.data >= 24 && counts.themes === counts.data;
  checks.allStarters = counts.starterData >= 7 && counts.starters === counts.starterData;
  checks.starterLengths = counts.pagesOk;
  await ctx.screenshot('templates');

  await ctx.click('[data-category="Seasons"]');
  checks.filterCategory = await js(`[...document.querySelectorAll('[data-theme-id]')].map((b) => b.dataset.themeId).join(',') === 'maple-lane,first-snow,spring-showers,summer-shore'
    && document.querySelectorAll('[data-starter-id]').length === 1 && !document.getElementById('templates-fonts')`);
  // The new Animals category.
  await ctx.click('[data-category="Animals"]');
  checks.animalsCategory = await js(`[...document.querySelectorAll('[data-theme-id]')].map((b) => b.dataset.themeId).join(',') === 'barnyard,polar-pals,buzzing-garden'
    && [...document.querySelectorAll('[data-starter-id]')].map((b) => b.dataset.starterId).join(',') === 'penguin-hats'`);
  // Each card names its font pairing.
  checks.cardShowsFonts = await js(`/Fonts: Sniglet \\+ Andika/.test(document.querySelector('[data-theme-id="barnyard"] .templates-fonts')?.textContent || '')`);
  // The Fonts category lists every font, each sample shown in that font.
  await ctx.click('[data-category="Fonts"]');
  checks.fontsCategory = await js(`(() => {
    const cards = [...document.querySelectorAll('#templates-fonts [data-font]')];
    return cards.length === Object.keys(FONTS).length && cards.length >= 21 && !document.querySelector('[data-theme-id]')
      && cards.every((c) => c.querySelector('.templates-font-sample').style.fontFamily.length > 0);
  })()`);
  // Bundled fonts really load (not just fall back): Fredoka's regular file.
  checks.bundledFontLoads = await js(`loadFonts(['fredoka']).then(() => document.fonts.check('400 16px "Storyloom Fredoka"'))`);
  await ctx.screenshot('templates-fonts');
  await ctx.click('[data-category="all"]');
  await ctx.click('#templates-search');
  await ctx.type('tide pool');
  checks.search = await js(`[...document.querySelectorAll('[data-theme-id]')].map((b) => b.dataset.themeId).join(',') === 'tide-pool'`);
  // Searching also finds fonts by name.
  await js(`(() => { const s = $must('#templates-search'); s.value = 'caveat'; s.dispatchEvent(new Event('input')); return true; })()`);
  checks.searchFindsFont = await js(`[...document.querySelectorAll('#templates-fonts [data-font]')].map((c) => c.dataset.font).join(',') === 'caveat'`);
  await js(`(() => { const s = $must('#templates-search'); s.value = ''; s.dispatchEvent(new Event('input')); return true; })()`);

  // Preview a starter and flip pages.
  await ctx.click('[data-starter-id="pip-boat"]');
  await ctx.waitFor('dialog[open] [data-flip="next"]');
  const counter = () => js(`document.querySelector('dialog[open] .templates-counter').textContent`);
  const first = await counter();
  await ctx.click('dialog[open] [data-flip="next"]');
  await ctx.click('dialog[open] [data-flip="next"]');
  const afterClicks = await counter();
  await ctx.key('Left');
  const afterKey = await counter();
  checks.flipPages = first === 'Page 1 of 8' && afterClicks === 'Page 3 of 8' && afterKey === 'Page 2 of 8';
  await js(`document.querySelector('dialog[open]').close(); true`);

  // Use a theme → designer with themed book.
  await ctx.click('[data-theme-id="moonlit-quilt"]');
  await ctx.waitFor('dialog[open] [data-action="use"]');
  await ctx.click('dialog[open] [data-action="use"]');
  await js(`$waitFor(() => window.__storyloom.current() === 'designer' && state.book).then(() => true)`);
  checks.useOpensDesigner = (await js('window.__storyloom.current()')) === 'designer';
  const usedId = await js('state.book.id');
  const used = await ctx.store.read(usedId);
  checks.usedThemeStyling = used.builder.templateId === 'moonlit-quilt' && used.pages.length === 2
    && used.pages.every((p) => p.background === '#1f2a4a' && p.frame === 'double' && p.font === 'literata' && p.titleFont === 'playfair') && tplCount(used) > 0;

  // ---------- apply to an existing book ----------
  const existing = await ctx.store.create({
    title: 'Garden Notes', size: 'portrait',
    pages: [{ layout: 'cover', text: 'Garden Notes' }, { layout: 'image-top', text: 'The beans grew taller than the gate.',
      elements: [{ id: 'my-own-sticker', type: 'sticker', char: '🐸', x: 100, y: 100, w: 80, h: 80 }] }],
  });
  const applyVia = async (themeId) => {
    await ctx.navigate('templates');
    await ctx.click(`[data-theme-id="${themeId}"]`);
    await ctx.waitFor('dialog[open] [data-action="apply"]');
    await ctx.click('dialog[open] [data-action="apply"]');
    await ctx.waitFor(`dialog[open] [data-apply-book="${existing.id}"]`);
    await ctx.click(`dialog[open] [data-apply-book="${existing.id}"]`);
    await js(`$waitFor(() => window.__storyloom.current() === 'designer' && state.book?.id === ${JSON.stringify(existing.id)}).then(() => true)`);
    await js('saveNow()');
    return ctx.store.read(existing.id);
  };
  const once = await applyVia('tide-pool');
  checks.applyKeepsText = once.pages[1].text === 'The beans grew taller than the gate.' && once.pages[0].text === 'Garden Notes';
  checks.applyKeepsOwnElements = once.pages[1].elements.some((e) => e.id === 'my-own-sticker');
  checks.applyChangesBackground = once.pages.every((p) => p.background === '#e2f3f5') && once.builder.templateId === 'tide-pool';
  const twice = await applyVia('maple-lane');
  const mapleExpected = await js(`STORYLOOM_TEMPLATES.themes.find((t) => t.id === 'maple-lane').decor.cover.length + STORYLOOM_TEMPLATES.themes.find((t) => t.id === 'maple-lane').decor.page.length`);
  checks.secondThemeReplacesDecor = tplCount(twice) === mapleExpected
    && twice.pages.every((p) => p.elements.filter((e) => e.id.startsWith('tpl-')).every((e) => e.id.startsWith('tpl-maple-lane-')))
    && twice.pages[1].elements.some((e) => e.id === 'my-own-sticker') && twice.pages[0].background === '#fbeedd';

  // ---------- crop dialog ----------
  const cropBook = await ctx.store.create({ title: 'Crop Test', pages: [{ layout: 'blank', text: '' }] });
  const png = [...makePng()]; // 256 × 256
  const imageName = await js(`api.saveImage(${JSON.stringify(cropBook.id)}, new Uint8Array(${JSON.stringify(png)}))`);
  await js(`openBook(${JSON.stringify(cropBook.id)}, 'designer').then(() => $settle()).then(() => true)`);
  await js(`(async () => { await addImageToPage(${JSON.stringify(imageName)}); await $settle(); return true; })()`);
  await ctx.waitFor('#crop-picture');
  await ctx.click('#crop-picture');
  await ctx.waitFor('dialog[open] .crop-box');
  await js(`$waitFor(() => document.querySelector('dialog[open] .crop-box').offsetWidth > 50).then(() => true)`);
  await ctx.click('dialog[open] [data-aspect="16-9"]');
  await ctx.click('dialog[open] [data-aspect="square"]');
  const corner = await ctx.centerOf('dialog[open] .crop-handle[data-dir="1,1"]');
  await ctx.drag(corner, { x: corner.x - 120, y: corner.y - 30 });
  const boxAfterDrag = await js(`(() => { const b = document.querySelector('dialog[open] .crop-box'); return { w: b.offsetWidth, h: b.offsetHeight, stage: document.querySelector('dialog[open] .crop-stage').offsetWidth }; })()`);
  checks.cropHandleDrag = boxAfterDrag.w < boxAfterDrag.stage - 40 && Math.abs(boxAfterDrag.w - boxAfterDrag.h) <= 2;
  await ctx.key('Right');
  await ctx.screenshot('templates-crop');
  await ctx.click('dialog[open] [data-crop="apply"]');
  await js('saveNow()');
  const cropped = (await ctx.store.read(cropBook.id)).pages[0].elements.find((e) => e.type === 'image');
  const c = cropped?.crop;
  checks.cropSaved = !!c && c.w > 0 && c.h > 0;
  checks.cropSquare = !!c && Math.abs(c.w / c.h - 1) < 0.03 && c.w < 0.9;

  // ---------- Generate a picture (mock AI) ----------
  await ctx.click('[data-drawer="uploads"]');
  await ctx.waitFor('[data-action="generate-picture"]');
  checks.upscaleUnavailable = await js(`!!document.querySelector('[data-unavailable="image-upscale"]')`);
  const before = await js('currentPage().elements.length');
  await ctx.click('[data-action="generate-picture"]');
  await ctx.waitFor('dialog[open] textarea[name="prompt"]');
  await ctx.click('dialog[open] textarea[name="prompt"]');
  await ctx.type('A fox reading under a lamp');
  await ctx.click('dialog[open] [data-generate="submit"]');
  await js(`$waitFor(() => currentPage().elements.length > ${before}).then(() => true)`);
  await js('saveNow()');
  const gen = (await ctx.store.read(cropBook.id)).pages[0].elements;
  checks.generatedPicture = gen.filter((e) => e.type === 'image').length === 2;
  return checks;
};
