'use strict';
// The book designer: pages, free-placed elements, drag/resize/rotate, layers, undo.

const editor = {
  selected: null,
  editingId: null,
  drawer: 'pages',
  scale: 1,
  showSafeArea: false,
  clipboard: null,
  dragPayload: null,
  history: { past: [], future: [], lastKey: null, lastTime: 0 },
};

const STICKERS = {
  Animals: ['🦊', '🐻', '🐰', '🐱', '🐶', '🦁', '🐯', '🐼', '🐨', '🐸', '🐵', '🦉', '🐧', '🐢', '🐙', '🦋', '🐝', '🐞', '🦄', '🐲', '🐘', '🦒', '🐳', '🐠'],
  Nature: ['🌳', '🌲', '🌴', '🌵', '🌷', '🌻', '🌹', '🍄', '🍁', '🍀', '🌈', '☀️', '🌙', '⭐', '☁️', '❄️', '🌊', '🔥', '⛰️', '🌍'],
  Food: ['🍎', '🍓', '🍌', '🍉', '🍒', '🥕', '🍪', '🍰', '🧁', '🍩', '🍦', '🍭', '🥞', '🍕', '🧀', '🍯'],
  Fun: ['🎈', '🎁', '🎉', '🪁', '🧸', '🎨', '📚', '✏️', '🚀', '🚂', '🚗', '⛵', '🏰', '🏠', '👑', '🔑', '💎', '🪄', '⚽', '🎵'],
  Faces: ['😀', '😄', '😊', '🥰', '😮', '😢', '😴', '🤔', '😎', '🥳', '😱', '😡'],
  Symbols: ['❤️', '💛', '💚', '💙', '💜', '✨', '💫', '⚡', '💤', '❗', '❓', '➡️', '✔️', '🌟', '💬', '💭'],
};

// Original text presets. `w` and `h` are in points.
const TEXT_PRESETS = {
  heading: { label: 'Add a heading', text: 'Your heading', font: 'serif', fontSize: 48, bold: true, w: 420, h: 72 },
  subheading: { label: 'Add a subheading', text: 'A subheading', font: 'sans', fontSize: 28, bold: true, w: 380, h: 44 },
  body: { label: 'Add body text', text: 'Once upon a time…', font: 'serif', fontSize: 20, w: 360, h: 34 },
};
const TEXT_STYLES = [
  { label: 'Bubble', text: 'POP!', font: 'rounded', fontSize: 64, bold: true, color: '#ffffff', outline: true, outlineColor: '#d9553f', w: 240, h: 90 },
  { label: 'Glow', text: 'Magic', font: 'serif', fontSize: 54, bold: true, italic: true, color: '#fff6c9', shadow: true, w: 280, h: 80 },
  { label: 'Label', text: 'Chapter One', font: 'sans', fontSize: 22, bold: true, color: '#2a2433', highlight: '#ffd96a', w: 260, h: 38 },
  { label: 'Note', text: 'Remember this!', font: 'hand', fontSize: 30, color: '#2f7f75', w: 300, h: 48 },
  { label: 'Title', text: 'THE END', font: 'serif', fontSize: 56, bold: true, letterSpacing: 6, color: '#2a2433', w: 380, h: 80 },
  { label: 'Whisper', text: 'shh… quiet now', font: 'serif', fontSize: 24, italic: true, color: '#776f80', w: 320, h: 40 },
];
const SHAPE_DEFAULTS = { rect: '#7cc6b8', rounded: '#f2b84b', ellipse: '#e88a7a', triangle: '#9a8cd8', star: '#f2c94c', burst: '#f28e5c', heart: '#e5566f', cloud: '#ffffff', speech: '#ffffff', arrow: '#5aa5d6' };

// ---------- element factories (full defaults, matching what storage keeps) ----------
const base = (w, h) => ({ id: newId(), x: 0, y: 0, w, h, rotation: 0, opacity: 1, locked: false });
function textElement(preset) {
  return {
    ...base(preset.w, preset.h), type: 'text', text: preset.text, font: preset.font, fontSize: preset.fontSize,
    color: preset.color || '#2a2433', align: 'center', bold: !!preset.bold, italic: !!preset.italic,
    lineHeight: 1.25, letterSpacing: preset.letterSpacing || 0, shadow: !!preset.shadow,
    outline: !!preset.outline, outlineColor: preset.outlineColor || '#ffffff', highlight: preset.highlight || null,
  };
}
function shapeElement(shape) {
  const outlined = shape === 'cloud' || shape === 'speech';
  const size = shape === 'speech' ? [220, 160] : shape === 'arrow' ? [200, 120] : [160, 160];
  return { ...base(...size), type: 'shape', shape, fill: SHAPE_DEFAULTS[shape], stroke: '#2a2433', strokeWidth: outlined ? 3 : 0 };
}
const stickerElement = (char) => ({ ...base(110, 110), type: 'sticker', char });
function imageElement(name, ratio) {
  const [W, H] = PAGE_PT[state.book.size];
  let w = W * 0.6;
  let h = w / ratio;
  if (h > H * 0.6) { h = H * 0.6; w = h * ratio; }
  return { ...base(round2(w), round2(h)), type: 'image', image: name, fit: 'cover', radius: 0, borderWidth: 0, borderColor: '#ffffff' };
}

// ---------- open / state ----------
// Called by the app shell whenever a different book is opened.
function resetDesigner() {
  state.pageIndex = 0;
  Object.assign(editor, { selected: null, editingId: null, history: { past: [], future: [], lastKey: null, lastTime: 0 } });
}
const currentPage = () => state.book.pages[state.pageIndex];
const selectedElement = () => (editor.selected ? currentPage().elements.find((el) => el.id === editor.selected) || null : null);
const findElement = (id) => currentPage().elements.find((el) => el.id === id) || null;

// ---------- undo / redo ----------
function snapshot() {
  return structuredClone({
    pages: state.book.pages, title: state.book.title, author: state.book.author, size: state.book.size,
    pageIndex: state.pageIndex, selected: editor.selected,
  });
}
// Records the state before a change. Rapid changes with the same key (typing, sliders) merge into one step.
function checkpoint(key = null) {
  const hist = editor.history;
  const now = Date.now();
  if (key && key === hist.lastKey && now - hist.lastTime < 1000) { hist.lastTime = now; return; }
  hist.past.push(snapshot());
  if (hist.past.length > 100) hist.past.shift();
  hist.future = [];
  hist.lastKey = key;
  hist.lastTime = now;
}
function restore(snap) {
  Object.assign(state.book, { pages: snap.pages, title: snap.title, author: snap.author, size: snap.size });
  state.pageIndex = Math.min(snap.pageIndex, state.book.pages.length - 1);
  editor.selected = snap.selected;
  editor.editingId = null;
  syncBookBar();
  renderEditor();
  scheduleSave();
}
function undo() {
  const hist = editor.history;
  if (!hist.past.length) return;
  hist.future.push(snapshot());
  restore(hist.past.pop());
  hist.lastKey = null;
}
function redo() {
  const hist = editor.history;
  if (!hist.future.length) return;
  hist.past.push(snapshot());
  restore(hist.future.pop());
  hist.lastKey = null;
}

// ---------- layout ----------
const DRAWERS = [
  ['pages', 'Pages', '▤'], ['text', 'Text', 'T'], ['shapes', 'Shapes', '◆'],
  ['stickers', 'Stickers', '☺'], ['uploads', 'Pictures', '▣'], ['frames', 'Frames', '▢'],
];

function renderEditor() {
  if (editor.editingId) editor.editingId = null;
  const host = document.getElementById('screen');
  if (!host || !state.book) return;
  const { book } = state;
  if (state.pageIndex >= book.pages.length) state.pageIndex = book.pages.length - 1;
  const hist = editor.history;
  const topbar = h('div', { class: 'designer-bar' },
    h('div', { class: 'topbar-actions' },
      h('button', { class: 'icon-btn', id: 'undo', title: 'Undo (⌘Z)', 'aria-label': 'Undo', disabled: !hist.past.length, onclick: undo }, '↶'),
      h('button', { class: 'icon-btn', id: 'redo', title: 'Redo (⇧⌘Z)', 'aria-label': 'Redo', disabled: !hist.future.length, onclick: redo }, '↷'),
      h('label', { class: 'check compact', title: 'Shows where printers may trim the page' },
        h('input', { type: 'checkbox', checked: editor.showSafeArea, onchange: (e) => { editor.showSafeArea = e.target.checked; drawSelection(); } }),
        'Safe area'),
      h('select', {
        'aria-label': 'Page size',
        onchange: (e) => { checkpoint(); book.size = e.target.value; renderEditor(); scheduleSave(); },
      }, Object.keys(PAGE_PT).map((size) => h('option', { value: size, selected: book.size === size }, SIZE_LABEL[size]))),
      h('button', { class: 'btn primary', id: 'export-pdf', onclick: () => (window.openExportDialog ? run(() => window.openExportDialog()) : notBuilt()) }, 'Export…')));

  const rail = h('nav', { class: 'rail', 'aria-label': 'Design tools' }, DRAWERS.map(([id, label, icon]) =>
    h('button', {
      class: `rail-btn${editor.drawer === id ? ' active' : ''}`, 'data-drawer': id, 'aria-pressed': String(editor.drawer === id),
      onclick: () => { editor.drawer = id; renderDrawer(); markRail(); },
    }, h('span', { class: 'rail-icon', 'aria-hidden': 'true' }, icon), label)));

  const canvas = h('div', {
    class: 'canvas', id: 'canvas',
    onpointerdown: (e) => { if (e.target === e.currentTarget) select(null); },
    ondragover: (e) => { if (editor.dragPayload) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } },
    ondrop: onCanvasDrop,
  });
  host.replaceChildren(topbar, h('div', { class: 'editor' },
    rail,
    h('aside', { class: 'drawer', id: 'drawer' }),
    h('main', { class: 'canvas-wrap' }, canvas),
    h('aside', { class: 'inspector', id: 'inspector' })));
  renderDrawer();
  renderCanvas();
  renderInspector();
}

function markRail() {
  document.querySelectorAll('.rail-btn').forEach((btn) => {
    const on = btn.dataset.drawer === editor.drawer;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', String(on));
  });
}

function updateHistoryButtons() {
  const undoBtn = document.getElementById('undo');
  const redoBtn = document.getElementById('redo');
  if (undoBtn) undoBtn.disabled = !editor.history.past.length;
  if (redoBtn) redoBtn.disabled = !editor.history.future.length;
}

// ---------- canvas ----------
function renderCanvas() {
  const canvas = document.getElementById('canvas');
  if (!canvas || !state.book) return;
  const box = canvas.getBoundingClientRect();
  const [wPt, hPt] = PAGE_PT[state.book.size];
  const scale = Math.max(0.1, Math.min((box.width - 80) / (wPt * PT_PX), (box.height - 80) / (hPt * PT_PX)));
  editor.scale = scale;
  const transform = { transform: `scale(${scale})`, transformOrigin: 'top left' };
  const pageEl = renderPage(currentPage(), state.book);
  Object.assign(pageEl.style, transform);
  pageEl.id = 'page';
  pageEl.addEventListener('pointerdown', onPagePointerDown);
  pageEl.addEventListener('dblclick', (e) => {
    const node = e.target.closest('.el-words')?.parentElement;
    if (node) startEditing(node.dataset.id);
  });
  const overlay = h('div', { class: 'overlay', id: 'overlay', style: { width: `${wPt}pt`, height: `${hPt}pt`, ...transform } });
  canvas.replaceChildren(h('div', {
    class: 'page-frame editing', style: { width: `${wPt * PT_PX * scale}px`, height: `${hPt * PT_PX * scale}px` },
  }, pageEl, overlay));
  drawSelection();
  updateFitNote();
}

const elementNode = (id) => document.querySelector(`#page .el[data-id="${id}"]`);
function updateElementNode(el, content = false) {
  const node = elementNode(el.id);
  if (!node) return;
  positionElement(node, el);
  if (content) fillElement(node, el, state.book);
}

// Grows a text box to fit its words, so text never spills out unnoticed.
function fitText(el) {
  const inner = elementNode(el.id)?.querySelector('.el-words');
  if (!inner) return;
  const needed = round2(inner.scrollHeight / PT_PX);
  if (needed > el.h + 0.5) {
    el.h = needed;
    updateElementNode(el);
  }
}

function select(id) {
  if (editor.editingId && editor.editingId !== id) stopEditing();
  if (editor.selected === id) return;
  editor.selected = id;
  drawSelection();
  renderInspector();
  markLayers();
}

function onPagePointerDown(e) {
  if (e.button !== 0) return;
  const node = e.target.closest('.el');
  if (!node) { select(null); return; }
  const el = findElement(node.dataset.id);
  if (!el || editor.editingId === el.id) return; // Let the user select words while editing.
  select(el.id);
  if (!el.locked) startMove(e, el);
}

// Pointer tracking on window, so drags keep working outside the page.
function track(onMove, onEnd) {
  const up = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    onEnd();
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

function finishEdit(el) {
  drawSelection();
  refreshThumb();
  renderInspector();
  updateHistoryButtons();
  scheduleSave();
  if (el?.type === 'text') fitText(el);
}

function startMove(e, el) {
  e.preventDefault();
  const start = { x: e.clientX, y: e.clientY, ex: el.x, ey: el.y };
  const k = 1 / (editor.scale * PT_PX);
  let moved = false;
  track((ev) => {
    if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 3) return;
    if (!moved) { checkpoint(); moved = true; }
    const x = start.ex + (ev.clientX - start.x) * k;
    const y = start.ey + (ev.clientY - start.y) * k;
    const snap = ev.altKey ? { x, y, guides: [] } : snapPosition(el, x, y);
    el.x = round2(snap.x);
    el.y = round2(snap.y);
    updateElementNode(el);
    drawSelection(snap.guides);
  }, () => { if (moved) finishEdit(el); });
}

// Snaps element edges and centers to the page and to other elements. Hold Option to move freely.
function snapPosition(el, x, y) {
  const [W, H] = PAGE_PT[state.book.size];
  const threshold = 6 / (editor.scale * PT_PX);
  const others = currentPage().elements.filter((o) => o.id !== el.id && !o.rotation);
  const xs = [0, W / 2, W, ...others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w])];
  const ys = [0, H / 2, H, ...others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h])];
  const axis = (pos, size, targets) => {
    let best = null;
    for (const offset of [0, size / 2, size]) {
      for (const target of targets) {
        const d = target - (pos + offset);
        if (Math.abs(d) <= threshold && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, at: target };
      }
    }
    return best;
  };
  const bx = axis(x, el.w, xs);
  const by = axis(y, el.h, ys);
  const guides = [];
  if (bx) guides.push({ axis: 'x', at: bx.at });
  if (by) guides.push({ axis: 'y', at: by.at });
  return { x: x + (bx ? bx.d : 0), y: y + (by ? by.d : 0), guides };
}

const MIN_SIZE = 8;
function startResize(e, el, dx, dy) {
  e.preventDefault();
  e.stopPropagation();
  checkpoint();
  const k = 1 / (editor.scale * PT_PX);
  const start = { x: e.clientX, y: e.clientY, w: el.w, h: el.h };
  const rad = (el.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const cx0 = el.x + el.w / 2;
  const cy0 = el.y + el.h / 2;
  track((ev) => {
    const gx = (ev.clientX - start.x) * k;
    const gy = (ev.clientY - start.y) * k;
    // Convert the pointer movement into the element's own (rotated) directions.
    const lx = gx * cos + gy * sin;
    const ly = -gx * sin + gy * cos;
    let w = dx ? Math.max(MIN_SIZE, start.w + dx * lx) : start.w;
    let hgt = dy ? Math.max(MIN_SIZE, start.h + dy * ly) : start.h;
    const keepRatio = el.type === 'sticker' || el.type === 'sound' || (dx && dy && (el.type === 'image' || ev.shiftKey));
    if (keepRatio) {
      const factor = Math.max(w / start.w, hgt / start.h);
      w = Math.max(MIN_SIZE, start.w * factor);
      hgt = w * (start.h / start.w);
    }
    // Keep the opposite edge or corner where it was.
    const sx = (dx * (w - start.w)) / 2;
    const sy = (dy * (hgt - start.h)) / 2;
    const cx = cx0 + sx * cos - sy * sin;
    const cy = cy0 + sx * sin + sy * cos;
    Object.assign(el, { w: round2(w), h: round2(hgt), x: round2(cx - w / 2), y: round2(cy - hgt / 2) });
    updateElementNode(el, true);
    drawSelection();
  }, () => finishEdit(el));
}

function startRotate(e, el) {
  e.preventDefault();
  e.stopPropagation();
  checkpoint();
  const rect = document.querySelector('#overlay .selection').getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  track((ev) => {
    let angle = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
    angle = (((angle + 180) % 360) + 360) % 360 - 180;
    if (ev.shiftKey) angle = Math.round(angle / 15) * 15;
    else {
      const nearest = Math.round(angle / 90) * 90;
      if (Math.abs(angle - nearest) < 4) angle = nearest;
    }
    el.rotation = Math.round(angle * 10) / 10;
    if (el.rotation === -180) el.rotation = 180;
    updateElementNode(el);
    drawSelection();
  }, () => finishEdit(el));
}

const HANDLES = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
function drawSelection(guides = []) {
  const overlay = document.getElementById('overlay');
  if (!overlay) return;
  const unit = 1 / (editor.scale * PT_PX); // one screen pixel, in points
  overlay.replaceChildren();
  for (const guide of guides) {
    overlay.append(h('div', { class: `guide guide-${guide.axis}`, style: { [guide.axis === 'x' ? 'left' : 'top']: `${guide.at}pt`, '--line': `${unit}pt` } }));
  }
  if (editor.showSafeArea) overlay.append(h('div', { class: 'safe-area', style: { '--line': `${unit}pt` } }));
  const el = selectedElement();
  if (!el) return;
  const editing = editor.editingId === el.id;
  const sel = h('div', {
    class: `selection${el.locked ? ' locked' : ''}${editing ? ' editing' : ''}`,
    style: {
      left: `${el.x}pt`, top: `${el.y}pt`, width: `${el.w}pt`, height: `${el.h}pt`,
      transform: el.rotation ? `rotate(${el.rotation}deg)` : '', '--handle': `${10 * unit}pt`, '--line': `${1.5 * unit}pt`,
    },
  });
  if (!el.locked && !editing) {
    for (const [dx, dy] of HANDLES) {
      const edge = dx === 0 || dy === 0;
      if (edge && (el.type === 'sticker' || el.type === 'sound')) continue;
      if (el.type === 'text' && dx === 0) continue; // Text height follows its words.
      sel.append(h('div', {
        class: `handle${edge ? ' edge' : ''}`, 'data-dir': `${dx},${dy}`,
        style: { left: `${(dx + 1) * 50}%`, top: `${(dy + 1) * 50}%` },
        onpointerdown: (e) => startResize(e, el, dx, dy),
      }));
    }
    sel.append(h('div', { class: 'rotate-handle', title: 'Rotate (hold Shift to snap)', onpointerdown: (e) => startRotate(e, el) }));
  }
  overlay.append(sel);
}

// ---------- text editing on the page ----------
function startEditing(id) {
  const el = findElement(id);
  if (!el || el.type !== 'text' || el.locked) return;
  checkpoint(`edit:${id}`);
  editor.selected = id;
  editor.editingId = id;
  const inner = elementNode(id)?.querySelector('.el-words');
  if (!inner) return;
  inner.replaceChildren(el.text);
  inner.contentEditable = 'plaintext-only';
  inner.spellcheck = true;
  inner.addEventListener('input', () => {
    el.text = inner.innerText.replace(/\n$/, '').slice(0, 5000);
    fitText(el);
    drawSelection();
    refreshThumb();
    scheduleSave();
  });
  inner.addEventListener('blur', () => stopEditing(), { once: true });
  inner.focus();
  getSelection().selectAllChildren(inner);
  drawSelection();
  renderInspector();
}

function stopEditing() {
  const id = editor.editingId;
  if (!id) return;
  editor.editingId = null;
  const el = findElement(id);
  if (el && !el.text.trim()) {
    // An emptied text box is removed, like most design tools do.
    currentPage().elements = currentPage().elements.filter((item) => item.id !== id);
    if (editor.selected === id) editor.selected = null;
    elementNode(id)?.remove();
  } else if (el) {
    updateElementNode(el, true);
  }
  drawSelection();
  refreshThumb();
  renderInspector();
  updateHistoryButtons();
  scheduleSave();
}

// ---------- element operations ----------
function addElement(el, at) {
  checkpoint();
  const [W, H] = PAGE_PT[state.book.size];
  const point = at || { x: W / 2, y: H / 2 };
  el.x = round2(point.x - el.w / 2);
  el.y = round2(point.y - el.h / 2);
  currentPage().elements.push(el);
  editor.selected = el.id;
  renderCanvas();
  refreshThumb();
  renderInspector();
  updateHistoryButtons();
  scheduleSave();
  if (el.type === 'text') fitText(el);
  return el;
}
function deleteElement(el) {
  checkpoint();
  currentPage().elements = currentPage().elements.filter((item) => item.id !== el.id);
  editor.selected = null;
  editor.editingId = null;
  renderCanvas();
  refreshThumb();
  renderInspector();
  updateHistoryButtons();
  scheduleSave();
}
function duplicateElement(el) {
  const copy = { ...structuredClone(el), id: newId(), locked: false };
  addElement(copy, { x: el.x + el.w / 2 + 16, y: el.y + el.h / 2 + 16 });
}
function moveLayer(el, where) {
  const list = currentPage().elements;
  const from = list.indexOf(el);
  const to = { forward: from + 1, backward: from - 1, front: list.length - 1, back: 0 }[where];
  if (to < 0 || to >= list.length || to === from) return;
  checkpoint();
  list.splice(from, 1);
  list.splice(to, 0, el);
  renderCanvas();
  refreshThumb();
  renderInspector();
  updateHistoryButtons();
  scheduleSave();
}
function toggleLock(el) {
  checkpoint();
  el.locked = !el.locked;
  if (el.locked && editor.editingId === el.id) stopEditing();
  drawSelection();
  renderInspector();
  updateHistoryButtons();
  scheduleSave();
}

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

// ---------- inspector ----------
function field(label, control) {
  return h('label', { class: 'field' }, h('span', { class: 'field-label' }, label), control);
}
function slider(label, value, min, max, step, unit, onInput) {
  const caption = h('span', { class: 'field-label' }, `${label} · ${value}${unit}`);
  return h('label', { class: 'field' }, caption, h('input', {
    type: 'range', min: String(min), max: String(max), step: String(step), value: String(value),
    oninput: (e) => { const v = Number(e.target.value); caption.textContent = `${label} · ${v}${unit}`; onInput(v); },
  }));
}
function segmented(label, options, current, onPick) {
  return h('div', { class: 'segmented', role: 'group', 'aria-label': label, style: { gridTemplateColumns: `repeat(${options.length}, 1fr)` } },
    options.map(([value, text]) => h('button', {
      class: current === value ? 'active' : '', 'aria-pressed': String(current === value), onclick: () => onPick(value),
    }, text)));
}

function renderInspector() {
  const inspector = document.getElementById('inspector');
  if (!inspector) return;
  const el = selectedElement();
  inspector.replaceChildren(h('div', { class: 'inspector-inner' }, el ? elementInspector(el) : pageInspector(), layersPanel()));
  updateFitNote(); // the page panel was just rebuilt, so fill in its fit note
}

function pageInspector() {
  const page = currentPage();
  const change = (key, rerender = false) => (e) => {
    checkpoint(`page:${key}`);
    page[key] = e.target.type === 'range' ? Number(e.target.value) : e.target.value;
    if (rerender) renderInspector();
    refreshPage();
    scheduleSave();
  };
  const set = (key, value) => { checkpoint(); page[key] = value; refreshPage(); renderInspector(); scheduleSave(); };
  return [
    h('section', {},
      h('h3', {}, 'Page layout'),
      h('div', { class: 'layout-grid' }, LAYOUTS.map(([value, label]) =>
        h('button', {
          class: `layout-option${page.layout === value ? ' active' : ''}`, 'aria-pressed': String(page.layout === value),
          onclick: () => set('layout', value),
        }, h('span', { class: `layout-icon icon-${value}`, 'aria-hidden': 'true' }, h('i'), h('b')), label)))),
    page.layout === 'blank' ? null : h('section', {},
      h('h3', {}, 'Page words'),
      h('textarea', {
        id: 'page-text', rows: '5', value: page.text, maxlength: '20000',
        placeholder: page.layout === 'cover' ? `Leave blank to show “${state.book.title}”` : 'What happens on this page?',
        oninput: change('text'),
      }),
      field('Font', h('select', { id: 'page-font', onchange: change('font') }, fontOptions(page.font))),
      page.layout === 'cover' ? field('Title font', h('select', { id: 'page-title-font', onchange: change('titleFont') },
        h('option', { value: '', selected: !page.titleFont }, 'Same as the page font'), fontOptions(page.titleFont))) : null,
      slider('Size', page.fontSize, 10, 96, 1, ' pt', (v) => { checkpoint('page:fontSize'); page.fontSize = v; refreshPage(); scheduleSave(); }),
      h('p', { class: 'page-fit-note', id: 'page-fit-note', role: 'status' }),
      segmented('Text alignment', [['left', 'Left'], ['center', 'Center'], ['right', 'Right']], page.align, (v) => set('align', v)),
      field('Text color', h('input', { type: 'color', value: page.color, oninput: change('color') }))),
    h('section', {},
      h('h3', {}, 'Background'),
      field('Page color', h('input', { type: 'color', value: page.background, oninput: change('background') })),
      page.layout === 'text-only' || page.layout === 'blank' ? null : h('div', { class: 'tool-row' },
        h('button', { class: 'btn secondary', onclick: () => run(choosePagePicture) }, page.image ? 'Replace layout picture' : 'Choose layout picture'),
        page.image ? cropButton({ image: page.image, crop: page.crop }, (crop) => { checkpoint(); page.crop = crop; refreshPage(); renderInspector(); scheduleSave(); }) : null,
        ...pagePictureButtons(page),
        page.image ? h('button', { class: 'btn ghost danger', onclick: () => { page.imagePrompt = ''; set('image', null); } }, 'Remove') : null)),
  ];
}

// Other screens add page-picture buttons here (window.pagePictureExtras), e.g. "Redraw this picture".
window.pagePictureExtras = window.pagePictureExtras || [];
function pagePictureButtons(page) {
  const out = [];
  for (const make of window.pagePictureExtras) {
    try {
      const node = make(state.book, page);
      if (node instanceof Node) out.push(node);
    } catch (error) { console.error(error); }
  }
  return out;
}

// The crop dialog itself lives in screens/crop.js (window.openCropDialog).
// target: { image, crop }. onApply(crop) receives { x, y, w, h } as fractions, or null to remove the crop.
function cropButton(target, onApply) {
  return h('button', {
    class: 'btn ghost', id: 'crop-picture',
    onclick: () => {
      if (typeof window.openCropDialog !== 'function') { notBuilt(); return; }
      window.openCropDialog({ bookId: state.book.id, image: target.image, crop: target.crop || null }, onApply);
    },
  }, target.crop ? 'Crop… (cropped)' : 'Crop…');
}

const TYPE_LABEL = { text: 'Text', image: 'Picture', shape: 'Shape', sticker: 'Sticker', sound: 'Sound button' };
function elementInspector(el) {
  const apply = (key, value, merge = true) => {
    checkpoint(merge ? `${el.id}:${key}` : null);
    el[key] = value;
    updateElementNode(el, true);
    if (el.type === 'text') fitText(el);
    drawSelection();
    refreshThumb();
    updateHistoryButtons();
    scheduleSave();
  };
  const toggle = (key) => { apply(key, !el[key], false); renderInspector(); };
  const numberField = (label, key, min, max) => field(label, h('input', {
    type: 'number', step: '1', value: String(Math.round(el[key])), min: String(min), max: String(max),
    onchange: (e) => {
      const v = Number(e.target.value);
      if (Number.isFinite(v)) apply(key, round2(Math.min(max, Math.max(min, v))), false);
      e.target.value = String(Math.round(el[key]));
    },
  }));

  const common = h('section', {},
    h('div', { class: 'inspector-head' },
      h('h3', {}, TYPE_LABEL[el.type]),
      h('div', { class: 'tool-row' },
        h('button', { class: 'btn ghost small', onclick: () => duplicateElement(el), title: 'Duplicate (⌘D)' }, 'Duplicate'),
        h('button', { class: 'btn ghost small danger', id: 'delete-element', onclick: () => deleteElement(el), title: 'Delete (⌫)' }, 'Delete'))),
    h('div', { class: 'tool-row arrange' },
      h('button', { class: 'btn ghost small', onclick: () => moveLayer(el, 'front'), title: 'Bring to front' }, 'Front'),
      h('button', { class: 'btn ghost small', onclick: () => moveLayer(el, 'forward'), title: 'Bring forward (])' }, 'Forward'),
      h('button', { class: 'btn ghost small', onclick: () => moveLayer(el, 'backward'), title: 'Send backward ([)' }, 'Backward'),
      h('button', { class: 'btn ghost small', onclick: () => moveLayer(el, 'back'), title: 'Send to back' }, 'Back'),
      h('button', { class: `btn small ${el.locked ? 'secondary' : 'ghost'}`, onclick: () => toggleLock(el), 'aria-pressed': String(el.locked) }, el.locked ? 'Locked' : 'Lock')),
    h('div', { class: 'pos-grid' },
      numberField('X', 'x', -2000, 4000), numberField('Y', 'y', -2000, 4000),
      numberField('Width', 'w', MIN_SIZE, 4000), numberField('Height', 'h', MIN_SIZE, 4000),
      numberField('Rotate°', 'rotation', -180, 180)),
    slider('Opacity', Math.round(el.opacity * 100), 0, 100, 1, '%', (v) => apply('opacity', v / 100)));

  let specific = null;
  if (el.type === 'text') {
    specific = h('section', {},
      h('h3', {}, 'Words'),
      h('textarea', {
        rows: '3', value: el.text, maxlength: '5000', id: 'element-text',
        oninput: (e) => { apply('text', e.target.value); },
        onblur: () => { if (!el.text.trim()) deleteElement(el); },
      }),
      field('Font', h('select', { id: 'element-font', onchange: (e) => apply('font', e.target.value, false) }, fontOptions(el.font))),
      slider('Size', el.fontSize, 6, 200, 1, ' pt', (v) => apply('fontSize', v)),
      h('div', { class: 'tool-row' },
        h('button', { class: `btn small ${el.bold ? 'secondary' : 'ghost'}`, 'aria-pressed': String(el.bold), onclick: () => toggle('bold') }, h('b', {}, 'B')),
        h('button', { class: `btn small ${el.italic ? 'secondary' : 'ghost'}`, 'aria-pressed': String(el.italic), onclick: () => toggle('italic') }, h('i', {}, 'I'))),
      segmented('Text alignment', [['left', 'Left'], ['center', 'Center'], ['right', 'Right']], el.align, (v) => { apply('align', v, false); renderInspector(); }),
      field('Color', h('input', { type: 'color', value: el.color, oninput: (e) => apply('color', e.target.value) })),
      slider('Line spacing', el.lineHeight, 0.8, 3, 0.05, '×', (v) => apply('lineHeight', v)),
      slider('Letter spacing', el.letterSpacing, -5, 40, 0.5, ' pt', (v) => apply('letterSpacing', v)),
      h('h3', {}, 'Effects'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: el.shadow, onchange: () => toggle('shadow') }), 'Shadow'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: el.outline, onchange: () => toggle('outline') }), 'Outline'),
      el.outline ? field('Outline color', h('input', { type: 'color', value: el.outlineColor, oninput: (e) => apply('outlineColor', e.target.value) })) : null,
      h('label', { class: 'check' }, h('input', {
        type: 'checkbox', checked: !!el.highlight,
        onchange: (e) => { apply('highlight', e.target.checked ? '#ffd96a' : null, false); renderInspector(); },
      }), 'Highlight'),
      el.highlight ? field('Highlight color', h('input', { type: 'color', value: el.highlight, oninput: (e) => apply('highlight', e.target.value) })) : null);
  } else if (el.type === 'shape') {
    specific = h('section', {},
      h('h3', {}, 'Shape'),
      field('Shape', h('select', { onchange: (e) => apply('shape', e.target.value, false) },
        Object.entries(SHAPES).map(([key, shape]) => h('option', { value: key, selected: el.shape === key }, shape.label)))),
      h('label', { class: 'check' }, h('input', {
        type: 'checkbox', checked: el.fill === null,
        onchange: (e) => { apply('fill', e.target.checked ? null : SHAPE_DEFAULTS[el.shape], false); renderInspector(); },
      }), 'No fill'),
      el.fill === null ? null : field('Fill', h('input', { type: 'color', value: el.fill, oninput: (e) => apply('fill', e.target.value) })),
      slider('Outline width', el.strokeWidth, 0, 30, 0.5, ' pt', (v) => apply('strokeWidth', v)),
      field('Outline color', h('input', { type: 'color', value: el.stroke, oninput: (e) => apply('stroke', e.target.value) })));
  } else if (el.type === 'image') {
    specific = h('section', {},
      h('h3', {}, 'Picture'),
      segmented('Picture fit', [['cover', 'Fill box'], ['contain', 'Show all']], el.fit, (v) => { apply('fit', v, false); renderInspector(); }),
      slider('Corner rounding', el.radius, 0, 200, 1, ' pt', (v) => apply('radius', v)),
      slider('Border', el.borderWidth, 0, 30, 0.5, ' pt', (v) => apply('borderWidth', v)),
      field('Border color', h('input', { type: 'color', value: el.borderColor, oninput: (e) => apply('borderColor', e.target.value) })),
      h('div', { class: 'tool-row' },
        h('button', {
          class: 'btn secondary',
          onclick: () => run(async () => { const name = await api.importImage(state.book.id); if (name) apply('image', name, false); }),
        }, 'Replace picture'),
        cropButton(el, (crop) => { apply('crop', crop, false); renderInspector(); })));
  } else if (el.type === 'sticker') {
    specific = h('section', {}, h('p', { class: 'muted small-print' }, 'Drag the corners to resize. Stickers keep their shape.'));
  } else if (el.type === 'sound') {
    specific = h('section', {},
      h('h3', {}, 'Sound button'),
      field('Label', h('input', { type: 'text', value: el.label, maxlength: '80', oninput: (e) => apply('label', e.target.value) })),
      h('p', { class: 'muted small-print' }, el.sound ? 'Plays its sound when tapped in the read-along player.' : 'Choose a sound for it in the Studio.'));
  }
  return [common, specific];
}

function layerLabel(el) {
  if (el.type === 'text') return el.text.split('\n')[0].slice(0, 28) || 'Text';
  if (el.type === 'shape') return SHAPES[el.shape].label;
  if (el.type === 'sticker') return `Sticker ${el.char}`;
  if (el.type === 'sound') return `Sound ${el.label || el.char}`;
  return 'Picture';
}
function layersPanel() {
  const elements = currentPage().elements;
  return h('section', { class: 'layers' },
    h('h3', {}, 'Layers'),
    elements.length === 0
      ? h('p', { class: 'muted small-print' }, 'Add text, shapes, stickers, or pictures from the left. They stack here, front to back.')
      : h('ol', { class: 'layer-list', id: 'layer-list' }, [...elements].reverse().map((el) =>
        h('li', { class: `layer${el.id === editor.selected ? ' active' : ''}`, 'data-id': el.id },
          h('button', { class: 'layer-name', onclick: () => select(el.id) },
            h('span', { class: 'layer-type', 'aria-hidden': 'true' }, { text: 'T', image: '▣', shape: '◆', sticker: '☺', sound: '♪' }[el.type]),
            layerLabel(el)),
          h('button', {
            class: 'icon-btn small', title: el.locked ? 'Unlock' : 'Lock', 'aria-label': `${el.locked ? 'Unlock' : 'Lock'} ${layerLabel(el)}`,
            onclick: () => toggleLock(el),
          }, el.locked ? '🔒' : '🔓')))));
}
function markLayers() {
  document.querySelectorAll('#layer-list .layer').forEach((row) => row.classList.toggle('active', row.dataset.id === editor.selected));
}

// ---------- page-level operations ----------
function refreshThumb() {
  const thumb = document.querySelectorAll('#page-list .thumb')[state.pageIndex];
  thumb?.firstChild.replaceWith(scaledPage(currentPage(), state.book, 190, 150));
}
// Tells the author when the page's words were shrunk to fit, or still don't fit.
function updateFitNote() {
  const note = document.getElementById('page-fit-note');
  const page = currentPage();
  if (!note || !page || page.layout === 'blank') return;
  const fit = fitPageText(page, state.book);
  note.classList.toggle('warn', !fit.fits);
  note.textContent = !fit.fits
    ? `These words don’t fit the page, even at ${fit.size} pt. Shorten them, or pick the Text only layout for more room.`
    : fit.shrunk ? `Shrunk to ${fit.size} pt so all the words fit.` : '';
}
function refreshPage() {
  renderCanvas();
  refreshThumb();
  updateHistoryButtons();
}
function goToPage(index) {
  stopEditing();
  state.pageIndex = index;
  editor.selected = null;
  renderEditor();
}
function blankPage(previous) {
  return {
    id: newId(), layout: 'image-top', text: '', image: null, background: previous.background, color: previous.color,
    font: previous.font, fontSize: previous.layout === 'cover' ? 24 : previous.fontSize, align: previous.align,
    frame: previous.frame, frameColor: previous.frameColor, elements: [],
  };
}
function addPage() {
  checkpoint();
  state.book.pages.splice(state.pageIndex + 1, 0, blankPage(currentPage()));
  state.pageIndex += 1;
  editor.selected = null;
  renderEditor();
  scheduleSave();
  document.getElementById('page-text')?.focus();
}
function duplicatePage() {
  checkpoint();
  const copy = structuredClone(currentPage());
  copy.id = newId();
  copy.elements = copy.elements.map((el) => ({ ...el, id: newId() }));
  state.book.pages.splice(state.pageIndex + 1, 0, copy);
  state.pageIndex += 1;
  editor.selected = null;
  renderEditor();
  scheduleSave();
}
function deletePage() {
  if (state.book.pages.length === 1) return;
  checkpoint();
  state.book.pages.splice(state.pageIndex, 1);
  state.pageIndex = Math.min(state.pageIndex, state.book.pages.length - 1);
  editor.selected = null;
  renderEditor();
  scheduleSave();
}
function movePage(offset) {
  const target = state.pageIndex + offset;
  if (target < 0 || target >= state.book.pages.length) return;
  checkpoint();
  const [page] = state.book.pages.splice(state.pageIndex, 1);
  state.book.pages.splice(target, 0, page);
  state.pageIndex = target;
  renderEditor();
  scheduleSave();
}
async function choosePagePicture() {
  const page = currentPage();
  const name = await api.importImage(state.book.id);
  if (!name) return;
  checkpoint();
  page.image = name;
  page.imagePrompt = '';
  refreshPage();
  renderInspector();
  scheduleSave();
}

// Prints the open book to PDF. mode: 'digital' | 'print' (print adds trim bleed).
async function exportPdf({ mode = 'digital' } = {}) {
  if (state.screen === 'designer') stopEditing();
  await saveNow();
  // Fonts first: pages measure their words to fit, and that needs the real fonts.
  await loadFonts(bookFontKeys(state.book));
  const printRoot = document.getElementById('print-root');
  printRoot.className = mode === 'print' ? 'print-bleed' : '';
  printRoot.replaceChildren(...state.book.pages.map((page) => {
    const sheet = renderPage(page, state.book, { print: true });
    if (mode !== 'print') return sheet;
    // Print services trim 0.125 in from every edge, so the page colour runs out past the trim line.
    sheet.classList.remove('print-page');
    return h('div', { class: `print-page bleed-sheet size-${state.book.size}-bleed`, style: { backgroundColor: page.background } }, sheet);
  }));
  await Promise.all([...printRoot.querySelectorAll('img')].map((img) => img.decode().catch(() => {})));
  try {
    const name = await api.exportPdf({ title: state.book.title, size: state.book.size, mode });
    if (name) toast(`Exported “${name}”`, { label: 'Show in Finder', run: () => api.revealExport() });
  } finally {
    printRoot.replaceChildren();
    printRoot.className = '';
  }
}

// ---------- keyboard, clipboard, menu ----------
const isTyping = (node) => !!node?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])');

api.onMenuAction((action) => {
  if (isTyping(document.activeElement)) { document.execCommand(action); return; }
  if (state.view === 'editor' && !document.querySelector('dialog[open]')) (action === 'undo' ? undo : redo)();
});

document.addEventListener('keydown', (e) => {
  if (state.view !== 'editor' || document.querySelector('dialog[open]')) return;
  if (isTyping(e.target)) {
    if (e.key === 'Escape' && editor.editingId) e.target.blur();
    return;
  }
  const mod = e.metaKey || e.ctrlKey;
  const el = selectedElement();
  if (e.key === 'Escape') { select(null); return; }
  if (!el) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteElement(el); return; }
  if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateElement(el); return; }
  if (e.key === 'Enter' && el.type === 'text') { e.preventDefault(); startEditing(el.id); return; }
  if (e.key === ']' || e.key === '[') {
    e.preventDefault();
    moveLayer(el, e.key === ']' ? (mod ? 'front' : 'forward') : (mod ? 'back' : 'backward'));
    return;
  }
  const nudge = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (nudge && !el.locked) {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    checkpoint(`nudge:${el.id}`);
    el.x = round2(el.x + nudge[0] * step);
    el.y = round2(el.y + nudge[1] * step);
    updateElementNode(el);
    drawSelection();
    refreshThumb();
    updateHistoryButtons();
    scheduleSave();
  }
});

// Copy and paste of design elements (the system clipboard is left alone for text fields).
document.addEventListener('copy', (e) => {
  if (state.view !== 'editor' || isTyping(document.activeElement)) return;
  const el = selectedElement();
  if (!el) return;
  e.preventDefault();
  editor.clipboard = structuredClone(el);
});
document.addEventListener('cut', (e) => {
  if (state.view !== 'editor' || isTyping(document.activeElement)) return;
  const el = selectedElement();
  if (!el) return;
  e.preventDefault();
  editor.clipboard = structuredClone(el);
  deleteElement(el);
});
document.addEventListener('paste', (e) => {
  if (state.view !== 'editor' || isTyping(document.activeElement) || !editor.clipboard) return;
  e.preventDefault();
  const copy = { ...structuredClone(editor.clipboard), id: newId(), locked: false };
  const onSamePage = findElement(editor.clipboard.id);
  addElement(copy, { x: copy.x + copy.w / 2 + (onSamePage ? 16 : 0), y: copy.y + copy.h / 2 + (onSamePage ? 16 : 0) });
});

new ResizeObserver(() => { if (state.view === 'editor' && !editor.editingId) renderCanvas(); }).observe(document.body);
