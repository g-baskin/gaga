'use strict';
// The Designer's left drawers: pages, text, shapes, stickers, pictures, and frames.
// Part of the Designer (renderer/editor.js); loaded before it by index.html, sharing its top-level names.

// ---------- drawers ----------
function renderDrawer() {
  const drawer = document.getElementById('drawer');
  if (!drawer) return;
  const body = { pages: pagesDrawer, text: textDrawer, shapes: shapesDrawer, stickers: stickersDrawer, uploads: uploadsDrawer, frames: framesDrawer }[editor.drawer]();
  drawer.replaceChildren(body);
}

// Cards can be clicked (adds to the middle of the page) or dragged onto the page.
function card(payload, label, preview, extraClass = '') {
  return h('button', {
    class: `card ${extraClass}`, draggable: 'true', title: label, 'aria-label': label,
    onclick: () => addElement(payload()),
    ondragstart: (e) => { editor.dragPayload = payload; e.dataTransfer.setData('text/plain', ''); e.dataTransfer.effectAllowed = 'copy'; },
    ondragend: () => { editor.dragPayload = null; },
  }, preview);
}
// Payloads may be async (pictures must load first to learn their shape).
function onCanvasDrop(e) {
  const payload = editor.dragPayload;
  editor.dragPayload = null;
  if (!payload) return;
  e.preventDefault();
  const rect = document.getElementById('page').getBoundingClientRect();
  const k = 1 / (editor.scale * PT_PX);
  const at = { x: (e.clientX - rect.left) * k, y: (e.clientY - rect.top) * k };
  run(async () => addElement(await payload(), at));
}

function pagesDrawer() {
  const { book } = state;
  return h('div', { class: 'drawer-inner pages-drawer' },
    h('ol', { class: 'page-list', id: 'page-list' }, book.pages.map((page, index) =>
      h('li', {},
        h('button', {
          class: `thumb${index === state.pageIndex ? ' active' : ''}`, 'aria-label': `Page ${index + 1}`,
          'aria-current': index === state.pageIndex ? 'page' : null,
          onclick: () => goToPage(index),
        }, scaledPage(page, book, 190, 150), h('span', { class: 'thumb-number' }, index === 0 ? 'Cover' : String(index)))))),
    h('div', { class: 'page-tools' },
      h('button', { class: 'btn secondary block', id: 'add-page', onclick: addPage }, '+ Add page'),
      h('div', { class: 'tool-row' },
        h('button', { class: 'btn ghost small', onclick: () => movePage(-1), disabled: state.pageIndex === 0, title: 'Move earlier' }, '↑'),
        h('button', { class: 'btn ghost small', onclick: () => movePage(1), disabled: state.pageIndex === book.pages.length - 1, title: 'Move later' }, '↓'),
        h('button', { class: 'btn ghost small', onclick: duplicatePage }, 'Duplicate'),
        h('button', { class: 'btn ghost small danger', onclick: deletePage, disabled: book.pages.length === 1 }, 'Delete'))));
}

function textDrawer() {
  return h('div', { class: 'drawer-inner' },
    h('h3', {}, 'Text'),
    h('div', { class: 'stack' }, Object.entries(TEXT_PRESETS).map(([key, preset]) =>
      h('button', {
        class: `text-add text-add-${key}`, 'data-add': key, draggable: 'true',
        onclick: () => addElement(textElement(preset)),
        ondragstart: (e) => { editor.dragPayload = () => textElement(preset); e.dataTransfer.setData('text/plain', ''); },
        ondragend: () => { editor.dragPayload = null; },
      }, preset.label))),
    h('h3', {}, 'Text styles'),
    h('div', { class: 'card-grid two' }, TEXT_STYLES.map((preset) => {
      const sample = textElement({ ...preset, w: 200, h: 80 });
      const preview = h('div', { class: 'style-preview' }, renderElement({ ...sample, x: 0, y: 0, fontSize: Math.min(28, preset.fontSize * 0.5) }, state.book));
      return card(() => textElement(preset), preset.label, preview, 'style-card');
    })),
    h('p', { class: 'muted small-print' }, 'Double-click text on the page to edit it.'));
}

function shapesDrawer() {
  return h('div', { class: 'drawer-inner' },
    h('h3', {}, 'Shapes'),
    h('div', { class: 'card-grid' }, Object.entries(SHAPES).map(([key, shape]) => {
      const el = { ...shapeElement(key), x: 0, y: 0, w: 52, h: 52, strokeWidth: key === 'cloud' || key === 'speech' ? 1.5 : 0 };
      return card(() => shapeElement(key), shape.label, h('div', { class: 'shape-preview' }, renderElement(el, state.book)));
    })));
}

function stickersDrawer() {
  return h('div', { class: 'drawer-inner' },
    Object.entries(STICKERS).map(([group, chars]) => [
      h('h3', {}, group),
      h('div', { class: 'card-grid stickers' }, chars.map((char) => card(() => stickerElement(char), `${group} sticker ${char}`, h('span', { class: 'sticker-preview' }, char)))),
    ]));
}

function uploadsDrawer() {
  const grid = h('div', { class: 'card-grid two', id: 'upload-grid' }, h('p', { class: 'muted small-print' }, 'Loading…'));
  const bookId = state.book.id;
  run(async () => {
    const names = await api.listImages(bookId);
    if (state.book?.id !== bookId || editor.drawer !== 'uploads') return;
    grid.replaceChildren(...(names.length ? names.map((name) => imageCard(name))
      : [h('p', { class: 'muted small-print' }, 'Pictures you add to this book appear here.')]));
  });
  return h('div', { class: 'drawer-inner' },
    h('h3', {}, 'Pictures'),
    h('button', { class: 'btn secondary block', onclick: () => run(uploadPicture) }, 'Add picture from Mac'),
    h('p', { class: 'muted small-print' }, 'PNG, JPEG, WebP, or GIF up to 25 MB. Click or drag a picture onto the page.'),
    pictureExtras(),
    grid);
}
// Other screens add buttons here (window.picturesDrawerExtras) without editing this file.
window.picturesDrawerExtras = window.picturesDrawerExtras || [];
function pictureExtras() {
  const items = [];
  for (const make of window.picturesDrawerExtras) {
    try {
      const node = make(state.book);
      if (node instanceof Node) items.push(node);
    } catch (error) { console.error(error); }
  }
  return items.length ? h('div', { class: 'stack drawer-extras' }, items) : null;
}
function imageCard(name) {
  const build = async () => {
    const img = new Image();
    img.src = mediaUrl(state.book.id, name);
    await img.decode();
    return imageElement(name, img.naturalWidth / img.naturalHeight || 1);
  };
  const preview = h('img', { src: mediaUrl(state.book.id, name), alt: '', draggable: 'false' });
  // Image size is only known after loading, so drops resolve the element asynchronously.
  return h('button', {
    class: 'card image-card', draggable: 'true', 'aria-label': 'Add this picture',
    onclick: () => run(async () => addElement(await build())),
    ondragstart: (e) => { editor.dragPayload = build; e.dataTransfer.setData('text/plain', ''); e.dataTransfer.effectAllowed = 'copy'; },
    ondragend: () => { editor.dragPayload = null; },
  }, preview);
}
async function uploadPicture() {
  const name = await api.importImage(state.book.id);
  if (name) await addImageToPage(name);
}
// Places a picture that is already in this book's assets onto the current page.
async function addImageToPage(name) {
  if (!state.book || state.screen !== 'designer') throw new Error('Open the designer to place a picture');
  const img = new Image();
  img.src = mediaUrl(state.book.id, name);
  await img.decode();
  addElement(imageElement(name, img.naturalWidth / img.naturalHeight || 1));
  if (editor.drawer === 'uploads') renderDrawer();
}

function framesDrawer() {
  const page = currentPage();
  return h('div', { class: 'drawer-inner' },
    h('h3', {}, 'Page frame'),
    h('div', { class: 'card-grid two' }, FRAMES.map(([key, label]) =>
      h('button', {
        class: `card frame-card${page.frame === key ? ' active' : ''}`, 'data-frame': key, 'aria-pressed': String(page.frame === key),
        onclick: () => { checkpoint(); page.frame = key; refreshPage(); renderDrawer(); scheduleSave(); },
      }, h('span', { class: `frame-swatch frame-${key}` }), label))),
    h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Frame color'),
      h('input', {
        type: 'color', value: page.frameColor,
        oninput: (e) => { checkpoint('frameColor'); page.frameColor = e.target.value; refreshPage(); scheduleSave(); },
      })));
}
