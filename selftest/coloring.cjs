'use strict';
// Coloring: line-art filter, convert a book via the UI, paint (fill/undo/brush/save), idea → coloring book with mock AI.
const { makePng } = require('./mock-ai.cjs');

module.exports = async function coloring(ctx) {
  const { js, pause, store } = ctx;
  const checks = {};

  // A story book with one picture page.
  const png = makePng(120, 120, (x, y) => ((x - 60) ** 2 + (y - 60) ** 2 < 1600 ? [230, 80, 60, 255] : [120, 190, 240, 255]));
  const book = await store.create({ title: 'Red Ball', pages: [{ layout: 'cover', text: '' }, { layout: 'image-top', text: 'A ball.', background: '#ffeecc' }] });
  const image = await js(`api.saveImage(${JSON.stringify(book.id)}, new Uint8Array(${JSON.stringify([...png])}))`);
  await js(`(async () => { const b = await api.readBook(${JSON.stringify(book.id)}); b.pages[1].image = ${JSON.stringify(image)};
    b.pages[1].elements = [{ id: newId(), type: 'shape', shape: 'rect', x: 10, y: 10, w: 40, h: 40, fill: '#ff0000', stroke: '#000000', strokeWidth: 0 }];
    await api.saveBook(b); return true; })()`);

  // Pure filter: a black square on white → dark edges, white flat areas.
  const pure = await js(`(() => {
    const d = new ImageData(40, 40);
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) { const p = (y * 40 + x) * 4; const v = x >= 10 && x < 30 && y >= 10 && y < 30 ? 0 : 255; d.data[p] = d.data[p + 1] = d.data[p + 2] = v; d.data[p + 3] = 255; }
    const o = storyloomLineArt(d); const px = (x, y) => o.data[(y * 40 + x) * 4];
    return { flatOut: px(2, 2), flatIn: px(20, 20), edge: px(10, 20), size: o.width === 40 && o.height === 40 };
  })()`);
  checks.lineArtPure = pure.flatOut === 255 && pure.flatIn === 255 && pure.edge === 0 && pure.size;

  await ctx.navigate('coloring');
  await ctx.assertNoMissing();
  checks.homeRendered = await js(`!!document.querySelector('#coloring-convert') && !!document.querySelector('#coloring-idea')`);
  await ctx.screenshot('coloring-home');

  // Earlier modules may already have made coloring books; only count the ones this module creates.
  const coloringIds = async () => (await store.list()).filter((b) => b.kind === 'coloring').map((b) => b.id);
  const existing = new Set(await coloringIds());

  // Convert through the UI.
  await ctx.click('#coloring-convert');
  await ctx.waitFor(`[data-convert="${book.id}"]`);
  await ctx.click(`[data-convert="${book.id}"]`);
  await ctx.waitFor('#coloring-canvas');
  const convertedId = (await coloringIds()).find((id) => !existing.has(id));
  checks.converted = !!convertedId;
  const converted = { id: convertedId };
  existing.add(convertedId);
  const cb = await store.read(convertedId);
  const page = cb.pages[1];
  checks.convertedTitle = cb.title === 'Red Ball (coloring)';
  checks.newImageName = !!page.image && page.image !== image;
  checks.whiteBackground = cb.pages.every((p) => p.background === '#ffffff');
  checks.shapeOutlined = page.elements[0].fill === null && page.elements[0].strokeWidth >= 2;

  // Open the picture page in the paint view.
  await ctx.click('[data-page="1"]');
  await js(`$waitFor(() => window.__coloringPaint?.index === 1 && document.querySelector('#coloring-canvas'))`);
  await pause(200);
  const px = (fx, fy) => js(`(() => { const c = document.getElementById('coloring-canvas'); const d = c.getContext('2d').getImageData(Math.floor(c.width * ${fx}), Math.floor(c.height * ${fy}), 1, 1).data; return [d[0], d[1], d[2]]; })()`);
  const stats = await js(`(() => { const c = document.getElementById('coloring-canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let white = 0, dark = 0; for (let i = 0; i < d.length; i += 4) { if (d[i] > 230) white++; else if (d[i] < 60) dark++; } const n = d.length / 4; return { white: white / n, dark: dark / n }; })()`);
  checks.lineArtPixels = stats.white > 0.7 && stats.dark > 0.01;

  // Fill inside the circle with a palette color.
  await ctx.click('[data-tool="fill"]');
  await ctx.click('[data-color="#1d70b8"]');
  await ctx.click('#coloring-canvas');
  const inside = await px(0.5, 0.5);
  const outside = await px(0.05, 0.05);
  checks.fillInside = inside.join() === '29,112,184';
  checks.fillStopsAtLine = outside.join() === '255,255,255';
  // Undo steps are kept compressed, not as raw pixels (4 bytes per pixel).
  checks.undoCompact = await js(`(async () => { const blob = await window.__coloringPaint.undo.at(-1); const c = document.getElementById('coloring-canvas');
    return blob instanceof Blob && blob.size < (c.width * c.height * 4) / 4; })()`);
  await ctx.click('#coloring-undo');
  // Undo restores a compressed snapshot, which finishes a moment later.
  await js(`$waitFor(() => { const c = document.getElementById('coloring-canvas'); return c.getContext('2d').getImageData(Math.floor(c.width * 0.5), Math.floor(c.height * 0.5), 1, 1).data[0] === 255; }, 3000).catch(() => null)`);
  checks.undoRestores = (await px(0.5, 0.5)).join() === '255,255,255';

  // Brush stroke near the top (outside the circle).
  await ctx.click('[data-tool="brush"]');
  await ctx.click('[data-color="#8ac926"]');
  const rect = await js(`(() => { const r = document.getElementById('coloring-canvas').getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()`);
  await ctx.drag({ x: Math.round(rect.l + rect.w * 0.2), y: Math.round(rect.t + rect.h * 0.08) }, { x: Math.round(rect.l + rect.w * 0.8), y: Math.round(rect.t + rect.h * 0.08) });
  checks.brushPainted = (await px(0.5, 0.08)).join() === '138,201,38';
  // Fill again and save.
  await ctx.click('[data-tool="fill"]');
  await ctx.click('[data-color="#e63946"]');
  await ctx.click('#coloring-canvas');
  await ctx.screenshot('coloring');
  const beforeSave = (await store.read(converted.id)).pages[1].image;
  await ctx.click('#coloring-save');
  // Encoding and saving the picture can take a while on a busy machine; wait up to 5 s.
  let afterSave = beforeSave;
  for (let waited = 0; waited < 5000 && afterSave === beforeSave; waited += 100) {
    await pause(100);
    afterSave = (await store.read(converted.id)).pages[1].image;
  }
  checks.savedColoredPage = !!afterSave && afterSave !== beforeSave;

  // Idea → coloring book with the mock AI.
  await ctx.navigate('coloring');
  await js(`(() => { $must('#coloring-idea').value = 'Owls at a picnic'; $must('#coloring-pages').value = '4'; return true; })()`);
  await ctx.click('#coloring-make');
  await ctx.waitFor('#coloring-canvas');
  const made = (await coloringIds()).filter((id) => !existing.has(id));
  checks.ideaBookCreated = made.length === 1;
  if (made.length) {
    const ib = await store.read(made[0]);
    checks.ideaPages = ib.pages.length === 5 && ib.pages.every((p) => !!p.image) && ib.pages.slice(1).every((p) => p.layout === 'image-top' && p.text);
  }
  return checks;
};
