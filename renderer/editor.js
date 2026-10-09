'use strict';
// The book designer screen: its layout and its keyboard, clipboard, and menu listeners. The rest of the Designer
// lives in renderer/designer/ (model, canvas, drawers, inspector, pages), loaded just before this file.

// ---------- layout ----------
const DRAWERS = [
  ['pages', 'Pages', 'pages'], ['text', 'Text', 'text'], ['shapes', 'Shapes', 'shapes'],
  ['stickers', 'Stickers', 'sticker'], ['uploads', 'Pictures', 'picture'], ['frames', 'Frames', 'frame'],
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

  const rail = h('nav', { class: 'rail', 'aria-label': 'Design tools' }, DRAWERS.map(([id, label, iconName]) =>
    h('button', {
      class: `rail-btn${editor.drawer === id ? ' active' : ''}`, 'data-drawer': id, 'aria-pressed': String(editor.drawer === id),
      onclick: () => { editor.drawer = id; renderDrawer(); markRail(); },
    }, h('span', { class: 'rail-icon' }, icon(iconName, { size: 22 })), label)));

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

// ---------- keyboard, clipboard, menu ----------
const isTyping = (node) => !!node?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])');

// Installed by app.js once every script has run: these listeners read `state` (declared in app.js, which loads
// after this file), so a key press, menu command, or resize during a page (re)load must not reach them earlier.
function installEditorListeners() {
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
}
