'use strict';
// The Designer's state, element types and their defaults, and undo/redo history.
// Part of the Designer (renderer/editor.js); loaded before it by index.html, sharing its top-level names.

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
  { label: 'Label', text: 'Chapter One', font: 'sans', fontSize: 22, bold: true, color: BOOK_INK, highlight: '#ffd96a', w: 260, h: 38 },
  { label: 'Note', text: 'Remember this!', font: 'hand', fontSize: 30, color: '#2f7f75', w: 300, h: 48 },
  { label: 'Title', text: 'THE END', font: 'serif', fontSize: 56, bold: true, letterSpacing: 6, color: BOOK_INK, w: 380, h: 80 },
  { label: 'Whisper', text: 'shh… quiet now', font: 'serif', fontSize: 24, italic: true, color: '#776f80', w: 320, h: 40 },
];
const SHAPE_DEFAULTS = { rect: '#7cc6b8', rounded: '#f2b84b', ellipse: '#e88a7a', triangle: '#9a8cd8', star: '#f2c94c', burst: '#f28e5c', heart: '#e5566f', cloud: '#ffffff', speech: '#ffffff', arrow: '#5aa5d6' };

// ---------- element factories (full defaults, matching what storage keeps) ----------
const base = (w, h) => ({ id: newId(), x: 0, y: 0, w, h, rotation: 0, opacity: 1, locked: false });
function textElement(preset) {
  return {
    ...base(preset.w, preset.h), type: 'text', text: preset.text, font: preset.font, fontSize: preset.fontSize,
    color: preset.color || BOOK_INK, align: 'center', bold: !!preset.bold, italic: !!preset.italic,
    lineHeight: 1.25, letterSpacing: preset.letterSpacing || 0, shadow: !!preset.shadow,
    outline: !!preset.outline, outlineColor: preset.outlineColor || '#ffffff', highlight: preset.highlight || null,
  };
}
function shapeElement(shape) {
  const outlined = shape === 'cloud' || shape === 'speech';
  const size = shape === 'speech' ? [220, 160] : shape === 'arrow' ? [200, 120] : [160, 160];
  return { ...base(...size), type: 'shape', shape, fill: SHAPE_DEFAULTS[shape], stroke: BOOK_INK, strokeWidth: outlined ? 3 : 0 };
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
