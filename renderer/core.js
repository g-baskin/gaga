'use strict';
// Shared helpers and page rendering. Used by the editor, thumbnails, bookshelf, and PDF export.
const api = window.storyloom;
// The default ink for words, outlines, and frames in a book (storage.cjs falls back to the same colour).
const BOOK_INK = '#2a2433';

// Unexpected errors go to Storyloom's log on this Mac (Account → Open log folder). Nothing is sent anywhere.
// shown: the user already sees this error on screen (so the console gets a warning, not an error).
function logError(error, { shown = false } = {}) {
  if (shown) console.warn(error); else console.error(error);
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error?.message ?? error);
  api?.logError?.({ message, stack: error instanceof Error ? String(error.stack || '') : '' }).catch(() => {});
}
window.addEventListener('error', (event) => logError(event.error || event.message));
window.addEventListener('unhandledrejection', (event) => logError(event.reason));

// 'smooth' scrolling, unless the user has turned on Reduce Motion.
function scrollBehavior() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'style') {
      for (const [prop, v] of Object.entries(value)) {
        if (prop.startsWith('--') || prop.includes('-')) el.style.setProperty(prop, v);
        else el.style[prop] = v;
      }
    } else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (['value', 'checked', 'disabled', 'selected'].includes(key)) el[key] = value;
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat(Infinity)) if (child != null && child !== false) el.append(child);
  return el;
}
const SVG_NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs || {})) if (value != null) el.setAttribute(key, String(value));
  el.append(...children);
  return el;
}

const cleanError = (error) => String(error?.message || error).replace(/^Error invoking remote method '[^']+': (Error: )?/, '');
const newId = () => crypto.randomUUID();

// Plain or lightly marked-up text → manuscript blocks. Used for imported stories and AI-written chapters.
// Paragraphs are separated by blank lines; the lines inside one are joined (so hard-wrapped text reads normally).
// A line starting with "# " is a heading, "## "/"### " a subheading, "- "/"* " a list item, "> " a quote.
function textToBlocks(text) {
  const block = (type, line) => ({ type, runs: [{ text: line }] });
  const blocks = [];
  for (const para of String(text || '').replace(/\r\n?/g, '\n').split(/\n\s*\n/)) {
    let buffer = [];
    const flush = () => { if (buffer.length) blocks.push(block('p', buffer.join(' '))); buffer = []; };
    for (const line of para.split('\n').map((l) => l.trim()).filter(Boolean)) {
      let m;
      if ((m = /^(#{1,3})\s+(.*)$/.exec(line))) { flush(); blocks.push(block(m[1].length === 1 ? 'h2' : 'h3', m[2])); }
      else if ((m = /^[-*]\s+(.*)$/.exec(line))) { flush(); blocks.push(block('li', m[1])); }
      else if ((m = /^>\s?(.*)$/.exec(line))) { flush(); blocks.push(block('quote', m[1])); }
      else buffer.push(line);
    }
    flush();
  }
  return blocks;
}
const round2 = (n) => Math.round(n * 100) / 100;
const mediaUrl = (bookId, name) => `app://media/${bookId}/${encodeURIComponent(name)}`;
const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

let toastTimer;
function toast(message, action) {
  const el = document.getElementById('toast');
  el.replaceChildren(h('span', {}, message), ...(action ? [h('button', { class: 'link', onclick: action.run }, action.label)] : []));
  el.classList.add('toast-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('toast-visible'), action ? 7000 : 4000);
}
async function run(task) {
  try { return await task(); } catch (error) { toast(cleanError(error)); return undefined; }
}

// ---------- constants ----------
const PT_PX = 4 / 3; // CSS pixels per point
const PAGE_PT = { square: [612, 612], portrait: [612, 792], landscape: [792, 612] };
const SIZE_LABEL = { square: 'Square 8.5 × 8.5 in', portrait: 'Portrait 8.5 × 11 in', landscape: 'Landscape 11 × 8.5 in' };
// FONTS and FONT_LABEL live in fonts.js (the Mac fonts plus the bundled ones in renderer/fonts/).
const LAYOUTS = [
  ['cover', 'Cover'], ['image-top', 'Picture above'], ['image-left', 'Side by side'],
  ['image-full', 'Full picture'], ['text-only', 'Words only'], ['blank', 'Blank canvas'],
];
const FRAMES = [
  ['none', 'No frame'], ['thin', 'Thin line'], ['thick', 'Bold line'], ['double', 'Double'],
  ['dashed', 'Dashed'], ['dotted', 'Dotted'], ['rounded', 'Rounded'],
];

function starPath(points, outer, inner) {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / points - Math.PI / 2;
    d += `${i ? 'L' : 'M'}${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)} `;
  }
  return `${d}Z`;
}
const SHAPES = {
  rect: { label: 'Square' },
  rounded: { label: 'Rounded square' },
  ellipse: { label: 'Circle' },
  triangle: { label: 'Triangle', path: 'M50 2 L98 98 L2 98 Z' },
  star: { label: 'Star', path: starPath(5, 49, 20) },
  burst: { label: 'Burst', path: starPath(12, 49, 37) },
  heart: { label: 'Heart', path: 'M50 94 C22 72 2 54 2 31 C2 15 14 4 28 4 C38 4 46 10 50 19 C54 10 62 4 72 4 C86 4 98 15 98 31 C98 54 78 72 50 94 Z' },
  cloud: { label: 'Cloud', path: 'M24 82 C10 82 2 72 2 60 C2 48 12 40 24 41 C26 26 38 16 52 18 C62 8 82 12 86 28 C96 30 100 42 98 52 C100 66 90 82 76 82 Z' },
  speech: { label: 'Speech bubble', path: 'M12 4 H88 Q98 4 98 14 V62 Q98 72 88 72 H42 L22 96 L27 72 H12 Q2 72 2 62 V14 Q2 4 12 4 Z' },
  arrow: { label: 'Arrow', path: 'M2 36 H60 V10 L98 50 L60 90 V64 H2 Z' },
};

// ---------- element rendering ----------
function renderElement(el, book) {
  const box = h('div', { class: `el el-${el.type}`, 'data-id': el.id });
  positionElement(box, el);
  fillElement(box, el, book);
  return box;
}

function positionElement(box, el) {
  Object.assign(box.style, {
    left: `${el.x}pt`, top: `${el.y}pt`, width: `${el.w}pt`, height: `${el.h}pt`,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : '', opacity: String(el.opacity),
  });
}

function fillElement(box, el, book) {
  box.replaceChildren();
  if (el.type === 'text') {
    const style = {
      fontFamily: FONTS[el.font] || FONTS.serif, fontSize: `${el.fontSize}pt`, color: el.color, textAlign: el.align,
      fontWeight: el.bold ? '800' : '400', fontStyle: el.italic ? 'italic' : 'normal',
      lineHeight: String(el.lineHeight), letterSpacing: `${el.letterSpacing}pt`,
    };
    if (el.shadow) style.textShadow = '0 2pt 6pt rgba(0, 0, 0, .35)';
    if (el.outline) {
      style['-webkit-text-stroke'] = `${Math.max(1, el.fontSize * 0.14).toFixed(1)}pt ${el.outlineColor}`;
      style['paint-order'] = 'stroke fill';
    }
    box.append(h('div', { class: 'el-words', style },
      el.highlight ? h('span', { class: 'el-highlight', style: { backgroundColor: el.highlight } }, el.text) : el.text));
  } else if (el.type === 'image') {
    box.append(h('img', {
      src: mediaUrl(book.id, el.image), alt: '', draggable: 'false',
      style: {
        objectFit: el.fit, borderRadius: `${el.radius}pt`,
        border: el.borderWidth ? `${el.borderWidth}pt solid ${el.borderColor}` : 'none',
        objectViewBox: cropViewBox(el.crop),
      },
    }));
  } else if (el.type === 'shape') {
    const shape = SHAPES[el.shape];
    if (!shape.path) {
      box.append(h('div', {
        class: 'el-shape-box',
        style: {
          backgroundColor: el.fill || 'transparent',
          border: el.strokeWidth ? `${el.strokeWidth}pt solid ${el.stroke}` : 'none',
          borderRadius: el.shape === 'ellipse' ? '50%' : el.shape === 'rounded' ? `${round2(Math.min(el.w, el.h) * 0.18)}pt` : '0',
        },
      }));
    } else {
      box.append(svg('svg', { viewBox: '0 0 100 100', preserveAspectRatio: 'none', class: 'el-shape-svg' },
        svg('path', {
          d: shape.path, fill: el.fill || 'none', stroke: el.strokeWidth ? el.stroke : 'none',
          'stroke-width': round2(el.strokeWidth * PT_PX), 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke',
        })));
    }
  } else if (el.type === 'sticker') {
    box.append(h('div', { class: 'el-sticker-glyph', style: { fontSize: `${round2(Math.min(el.w, el.h) * 0.82)}pt` } }, el.char));
  } else if (el.type === 'sound') {
    // Tap-to-play button; the read-along player plays el.sound. Shown as a round badge with a glyph.
    box.dataset.sound = el.sound || '';
    box.title = el.label || 'Sound';
    box.append(h('div', {
      class: 'el-sound-badge',
      style: { fontSize: `${round2(Math.min(el.w, el.h) * 0.5)}pt`, backgroundColor: el.fill, borderColor: el.stroke },
    }, el.char, h('span', { class: 'el-sound-mark', 'aria-hidden': 'true' }, '♪')));
  }
}

// crop: { x, y, w, h } as fractions of the source picture. Returns a CSS object-view-box value, or '' for none.
function cropViewBox(crop) {
  if (!crop) return '';
  const pct = (v) => `${round2(Math.max(0, v) * 100)}%`;
  return `inset(${pct(crop.y)} ${pct(1 - crop.x - crop.w)} ${pct(1 - crop.y - crop.h)} ${pct(crop.x)})`;
}

// ---------- page rendering ----------
// ---------- fit page words ----------
// Page words shrink to fit their text area, down to a readable minimum, so nothing is cut off on screen,
// in PDFs, or in e-books. The saved font size never changes: shorten the words and the text grows back.
const FIT_MIN_RATIO = 0.6; // never below 60% of the chosen size…
const FIT_MIN_PT = 12; // …or below 12 pt
const fitCache = new Map();
let fitHost = null;
// A font that finishes loading changes how much fits, so measure again.
document.fonts?.addEventListener('loadingdone', () => fitCache.clear());

function textFits(pageEl) {
  const box = pageEl.querySelector('.page-text');
  const kids = box ? [...box.children] : [];
  if (!kids.length) return true;
  const cs = getComputedStyle(box);
  const padding = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  const content = kids.at(-1).getBoundingClientRect().bottom - kids[0].getBoundingClientRect().top;
  // A full-picture page's text box grows upward, so its limit is the page, less a margin top and bottom.
  const room = pageEl.classList.contains('layout-image-full')
    ? pageEl.getBoundingClientRect().height - 48 * PT_PX - padding
    : box.clientHeight - padding;
  return content <= room + 0.5;
}

// → { size, fits, shrunk }: the largest font size (pt) at which the page's words fit.
function fitPageText(page, book) {
  const want = Number(page.fontSize) || 24;
  if (page.layout === 'blank' || !document.body) return { size: want, fits: true, shrunk: false };
  const key = JSON.stringify([book.size, book.title, book.author, page.layout, page.text, page.font, page.titleFont, want, page.align]);
  if (fitCache.has(key)) return fitCache.get(key);
  if (!fitHost) {
    fitHost = h('div', { 'aria-hidden': 'true', style: { position: 'fixed', left: '-100000px', top: '0', visibility: 'hidden', pointerEvents: 'none' } });
    document.body.append(fitHost);
  }
  const fitsAt = (size) => {
    const el = renderPage(page, book, { print: true, textSize: size });
    fitHost.replaceChildren(el);
    return textFits(el);
  };
  let result;
  if (fitsAt(want)) {
    result = { size: want, fits: true, shrunk: false };
  } else {
    const min = Math.min(want, Math.max(FIT_MIN_PT, Math.round(want * FIT_MIN_RATIO)));
    let lo = min;
    let hi = want - 1;
    let best = null;
    while (lo <= hi) { // largest whole size that fits
      const mid = Math.floor((lo + hi) / 2);
      if (fitsAt(mid)) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    result = best === null ? { size: min, fits: false, shrunk: min < want } : { size: best, fits: true, shrunk: true };
  }
  fitHost.replaceChildren();
  fitCache.set(key, result);
  return result;
}

function renderPage(page, book, { print = false, textSize } = {}) {
  const [width, height] = PAGE_PT[book.size];
  const el = h('div', {
    class: `page layout-${page.layout} size-${book.size}${print ? ' print-page' : ''}`,
    style: { width: `${width}pt`, height: `${height}pt`, backgroundColor: page.background },
  });
  if (page.layout !== 'text-only' && page.layout !== 'blank') {
    if (page.image) {
      el.append(h('div', { class: 'page-image' },
        h('img', { src: mediaUrl(book.id, page.image), alt: '', draggable: 'false', style: { objectViewBox: cropViewBox(page.crop) } })));
    }
    else el.append(h('div', { class: `page-image${print ? '' : ' placeholder'}` }, print ? null : h('span', {}, 'Add a picture')));
  }
  const isCover = page.layout === 'cover';
  const words = isCover ? (page.text.trim() || book.title) : page.text;
  if (page.layout !== 'blank' && (words || isCover)) {
    const size = textSize ?? fitPageText(page, book).size;
    el.append(h('div', {
      class: 'page-text',
      style: { fontFamily: FONTS[page.font] || FONTS.serif, fontSize: `${size}pt`, textAlign: page.align, color: page.color },
    },
    // A cover's title can use its own font (a theme's title font); the byline keeps the page font.
    words ? h('p', isCover && FONTS[page.titleFont] ? { class: 'cover-title', style: { fontFamily: FONTS[page.titleFont] } } : {}, words) : null,
    isCover && book.author ? h('p', { class: 'byline', style: { fontSize: `${Math.max(12, Math.round(size * 0.4))}pt` } }, `by ${book.author}`) : null));
  }
  if (page.frame && page.frame !== 'none') {
    el.append(h('div', { class: `page-border frame-${page.frame}`, style: { borderColor: page.frameColor } }));
  }
  el.append(h('div', { class: 'elements' }, (page.elements || []).map((item) => renderElement(item, book))));
  return el;
}

// Wraps a full-size page in a box scaled to fit the requested pixel size.
function scaledPage(page, book, maxWidth, maxHeight = Infinity) {
  const [width, height] = PAGE_PT[book.size].map((pt) => pt * PT_PX);
  const scale = Math.min(maxWidth / width, maxHeight / height);
  const pageEl = renderPage(page, book);
  Object.assign(pageEl.style, { transform: `scale(${scale})`, transformOrigin: 'top left' });
  return h('div', { class: 'page-frame', style: { width: `${width * scale}px`, height: `${height * scale}px` } }, pageEl);
}
