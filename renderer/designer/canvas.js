'use strict';
// The Designer's page canvas: drawing elements, selecting, dragging, resizing, rotating, editing text, and adding, deleting, and layering elements.
// Part of the Designer (renderer/editor.js); loaded before it by index.html, sharing its top-level names.

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
