'use strict';
// Designer: move, resize, rotate, undo/redo, drop a shape, frames, crop rendering, drawer extras, PDF export.
const fs = require('node:fs/promises');
const path = require('node:path');
const { makePng } = require('./mock-ai.cjs');

module.exports = async function designer(ctx) {
  const { js, pause, drag, centerOf, wc } = ctx;
  // A test-only Pictures drawer button proves the extension hook renders.
  await js(`window.picturesDrawerExtras.push(() => h('button', { class: 'btn ghost block', id: 'selftest-extra' }, 'Self-test extra')); true`);

  await ctx.click('#new-book');
  await ctx.waitFor('#book-title');
  await ctx.assertNoMissing();
  const result = await js(`(async () => {
    const title = $must('#book-title');
    title.value = 'The Lantern Fox'; title.dispatchEvent(new Event('input', { bubbles: true }));
    (await $waitFor('#add-page')).click();
    const text = await $waitFor('#page-text');
    text.value = 'A small fox found a lantern in the snow.'; text.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    const rendered = document.querySelector('#page .page-text')?.textContent;
    $must('[data-drawer="text"]').click();
    (await $waitFor('[data-add="heading"]')).click();
    await $waitFor('#overlay .selection');
    return { rendered, onDesigner: window.__storyloom.current() === 'designer' };
  })()`);
  const checks = { canvasRendered: result.rendered === 'A small fox found a lantern in the snow.', onDesignerTab: result.onDesigner };

  const selected = () => js('JSON.parse(JSON.stringify(selectedElement()))');
  const scale = await js('editor.scale * PT_PX');
  const before = await selected();
  const start = await centerOf('#overlay .selection');
  await drag(start, { x: start.x + 90, y: start.y + 60 });
  const moved = await selected();
  checks.moved = Math.abs(moved.x - before.x - 90 / scale) < 3 && Math.abs(moved.y - before.y - 60 / scale) < 3;
  await js('$settle()'); // the selection handles are redrawn after a move; measure them once they're in place
  const corner = await centerOf('.handle[data-dir="1,1"]');
  await drag(corner, { x: corner.x + 60, y: corner.y + 30 });
  const resized = await selected();
  checks.resized = resized.w > moved.w + 30 / scale;
  // Measure the handle and the box centre after a single scroll, so neither position goes stale.
  await centerOf('#overlay .selection');
  const { handle, center } = await js(`(() => {
    const mid = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; };
    return { handle: mid($must('.rotate-handle')), center: mid($must('#overlay .selection')) };
  })()`);
  await drag(handle, { x: center.x + (center.y - handle.y), y: center.y }); // Quarter turn clockwise.
  checks.rotated = (await selected()).rotation === 90;

  // Undo and redo go through the same menu path as ⌘Z / ⇧⌘Z.
  wc.send('menu:action', 'undo');
  await pause(100);
  checks.undo = (await selected()).rotation === 0;
  wc.send('menu:action', 'redo');
  await pause(100);
  checks.redo = (await selected()).rotation === 90;

  // Add a sticker by click and a shape by drag-and-drop, then set a frame.
  const dropped = await js(`(async () => {
    $must('[data-drawer="stickers"]').click();
    $must('#drawer .card').click();
    $must('[data-drawer="shapes"]').click();
    const starCard = $must('#drawer .card', 4);
    const page = document.getElementById('page').getBoundingClientRect();
    const at = { clientX: page.left + page.width * 0.25, clientY: page.top + page.height * 0.75 };
    const dataTransfer = new DataTransfer();
    starCard.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
    const canvas = document.getElementById('canvas');
    canvas.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer, ...at }));
    canvas.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer, ...at }));
    await new Promise((r) => setTimeout(r, 100));
    const star = selectedElement();
    const [W, H] = PAGE_PT[state.book.size];
    $must('[data-drawer="frames"]').click();
    $must('[data-frame="double"]').click();
    select(currentPage().elements[0].id);
    return { shape: star.shape, dropX: star.x + star.w / 2 - W * 0.25, dropY: star.y + star.h / 2 - H * 0.75 };
  })()`);
  checks.dropped = dropped.shape === 'star' && Math.abs(dropped.dropX) < 2 && Math.abs(dropped.dropY) < 2;

  // Pictures drawer: the registered extra appears; a cropped picture renders clipped.
  const bookId = await js('state.book.id');
  const image = await ctx.store.saveImageBytes(bookId, makePng());
  const crop = await js(`(async () => {
    $must('[data-drawer="uploads"]').click();
    await $waitFor('#selftest-extra');
    await addImageToPage(${JSON.stringify(image)});
    const el = selectedElement();
    checkpoint('crop'); el.crop = { x: 0.25, y: 0.25, w: 0.5, h: 0.5 }; refreshPage(); scheduleSave();
    await $settle();
    const img = document.querySelector('#page [data-id="' + el.id + '"] img');
    const cropButton = [...document.querySelectorAll('#inspector button')].some((b) => /crop/i.test(b.textContent));
    return { viewBox: img ? getComputedStyle(img).objectViewBox : null, cropButton };
  })()`);
  checks.drawerExtra = true;
  checks.cropRendered = /inset\(25%/.test(crop.viewBox || '');
  checks.cropButton = crop.cropButton;
  await js(`select(currentPage().elements[0].id); $settle()`);
  await ctx.screenshot('designer');

  // Digital and print PDFs (the Export dialog will call the same function).
  await js(`(async () => { await exportPdf({ mode: 'digital' }); await exportPdf({ mode: 'print' }); await saveNow(); })()`);
  const pdf = await fs.readFile(path.join(ctx.userData, 'self-test.pdf'));
  const printPdf = await fs.readFile(path.join(ctx.userData, 'self-test-print.pdf'));
  const pageSize = (buf) => /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/.exec(buf.toString('latin1'))?.slice(1).map(Number);
  const saved = await ctx.store.read(bookId);
  const page = saved.pages[1];
  Object.assign(checks, {
    pdfValid: pdf.subarray(0, 5).toString() === '%PDF-' && pdf.length > 1000,
    pdfPageCount: (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length === 2,
    pdfDigitalSize: Math.abs(pageSize(pdf)[0] - 612) < 2,
    pdfPrintBleedSize: Math.abs(pageSize(printPdf)[0] - 630) < 2, // 8.5 in + 2 × 0.125 in = 8.75 in = 630 pt
    savedTitle: saved.title === 'The Lantern Fox',
    savedElements: page.elements.map((el) => el.type).join(',') === 'text,sticker,shape,image',
    savedRotation: page.elements[0].rotation === 90,
    savedFrame: page.frame === 'double',
    savedCrop: JSON.stringify(page.elements[3].crop) === JSON.stringify({ x: 0.25, y: 0.25, w: 0.5, h: 0.5 }),
  });
  return checks;
};
