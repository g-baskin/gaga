(() => {
  'use strict';
  // Export: PDF (screen / print with bleed), fixed-layout EPUB 3, narrated WAV, ISBN + copyright page.

  const PX = 4 / 3; // CSS px per point
  const px = (pt) => `${Math.round(pt * PX * 100) / 100}px`;
  let addCopyright = false; // Session-only toggle, never stored in the book.

  // ---------- ISBN ----------
  function isbnError(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const d = raw.toUpperCase().replace(/[\s-]/g, '');
    if (/^\d{9}[\dX]$/.test(d)) {
      let sum = 0;
      for (let i = 0; i < 10; i++) sum += (10 - i) * (d[i] === 'X' ? 10 : Number(d[i]));
      return sum % 11 === 0 ? '' : 'That ISBN-10 has a wrong check digit — please check for a typo.';
    }
    if (/^97[89]\d{10}$/.test(d)) {
      let sum = 0;
      for (let i = 0; i < 13; i++) sum += Number(d[i]) * (i % 2 ? 3 : 1);
      return sum % 10 === 0 ? '' : 'That ISBN-13 has a wrong check digit — please check for a typo.';
    }
    return 'An ISBN has 10 digits (last may be X) or 13 digits starting with 978 or 979.';
  }

  function copyrightText(book) {
    const year = new Date().getFullYear();
    return [
      book.title,
      book.author ? `Written by ${book.author}` : null,
      `Copyright © ${year}${book.author ? ` ${book.author}` : ''}. All rights reserved.`,
      book.isbn ? `ISBN ${book.isbn}` : null,
      'Made with Storyloom',
    ].filter(Boolean).join('\n\n');
  }
  function copyrightPage(book) {
    return {
      id: newId(), layout: 'text-only', text: copyrightText(book), image: null, crop: null,
      background: '#ffffff', color: BOOK_INK, font: 'serif', fontSize: 12, align: 'center', frame: 'none', frameColor: BOOK_INK, elements: [],
    };
  }

  // ---------- PDF ----------
  async function pdf(mode) {
    const book = state.book;
    if (!addCopyright) return exportPdf({ mode });
    await saveNow(); // Flush real edits first so the temporary page is never saved.
    const original = book.pages;
    book.pages = [...original, copyrightPage(book)];
    try { await exportPdf({ mode }); } finally { book.pages = original; }
  }

  // ---------- EPUB serializer ----------
  // Text content: escape markup, and '=' / ':' too so words never look like handlers or URLs to the safety check.
  const xmlText = (v) => String(v ?? '').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
    .replace(/[&<>"'=:]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '=': '&#61;', ':': '&#58;' }[c]));
  const attr = (v) => String(v ?? '').replace(/[\x00-\x1f]/g, '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const style = (obj) => attr(Object.entries(obj).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${k}:${v}`).join(';'));
  const imgName = (name) => (/^[a-z0-9-]{1,64}\.(png|jpg|webp|gif)$/.test(name || '') ? name : null);

  function shapeSvg(el) {
    const fill = attr(el.fill || 'none');
    const stroke = el.strokeWidth ? attr(el.stroke) : 'none';
    const sw = Math.round(el.strokeWidth * PX * 100) / 100;
    const common = `fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" vector-effect="non-scaling-stroke"`;
    let inner;
    if (el.shape === 'ellipse') inner = `<ellipse cx="50" cy="50" rx="49" ry="49" ${common}/>`;
    else if (el.shape === 'rect' || el.shape === 'rounded') {
      const r = el.shape === 'rounded' ? 18 : 0;
      inner = `<rect x="1" y="1" width="98" height="98" rx="${r}" ry="${r}" ${common}/>`;
    } else inner = `<path d="${attr(SHAPES[el.shape]?.path || '')}" ${common}/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">${inner}</svg>`;
  }

  function elementXhtml(el) {
    const box = {
      left: px(el.x), top: px(el.y), width: px(el.w), height: px(el.h),
      transform: el.rotation ? `rotate(${Number(el.rotation)}deg)` : null, opacity: String(el.opacity ?? 1),
    };
    let inner = '';
    if (el.type === 'text') {
      const s = {
        'font-family': FONTS[el.font] || FONTS.serif, 'font-size': px(el.fontSize), color: el.color, 'text-align': el.align,
        'font-weight': el.bold ? '800' : '400', 'font-style': el.italic ? 'italic' : 'normal',
        'line-height': String(el.lineHeight || 1.2), 'letter-spacing': px(el.letterSpacing || 0),
        'text-shadow': el.shadow ? '0 2px 8px rgba(0,0,0,.35)' : null,
      };
      const words = el.highlight ? `<span style="${style({ 'background-color': el.highlight })}">${xmlText(el.text)}</span>` : xmlText(el.text);
      inner = `<div class="sl-words" style="${style(s)}">${words}</div>`;
    } else if (el.type === 'image') {
      const name = imgName(el.image);
      if (name) {
        inner = `<img src="images/${name}" alt="" style="${style({
          'object-fit': el.fit === 'contain' ? 'contain' : 'cover', 'border-radius': px(el.radius || 0),
          border: el.borderWidth ? `${px(el.borderWidth)} solid ${el.borderColor}` : null,
        })}"/>`;
      }
    } else if (el.type === 'shape') inner = shapeSvg(el);
    else if (el.type === 'sticker') {
      inner = `<div class="sl-glyph" style="${style({ 'font-size': px(Math.min(el.w, el.h) * 0.82) })}">${xmlText(el.char)}</div>`;
    } else if (el.type === 'sound') {
      inner = `<div class="sl-glyph" style="${style({ 'font-size': px(Math.min(el.w, el.h) * 0.5) })}">${xmlText(el.char)}</div>`
        + (el.label ? `<div class="sl-sound-label">${xmlText(el.label)}</div>` : '');
    }
    return `<div class="sl-el" style="${style(box)}">${inner}</div>`;
  }

  function pageXhtml(page, book, [w, h]) {
    const parts = [];
    if (page.layout !== 'text-only' && page.layout !== 'blank') {
      const name = imgName(page.image);
      parts.push(`<div class="sl-image">${name ? `<img src="images/${name}" alt=""/>` : ''}</div>`);
    }
    const isCover = page.layout === 'cover';
    const words = isCover ? (String(page.text || '').trim() || book.title) : page.text;
    if (page.layout !== 'blank' && (words || isCover)) {
      const size = fitPageText(page, book).size; // shrunk to fit, the same as on screen and in PDFs
      const byline = isCover && book.author
        ? `<p class="sl-byline" style="${style({ 'font-size': px(Math.max(12, Math.round(size * 0.4))) })}">by ${xmlText(book.author)}</p>` : '';
      const titleStyle = isCover && FONTS[page.titleFont] ? ` style="${style({ 'font-family': FONTS[page.titleFont] })}"` : '';
      parts.push(`<div class="sl-text" style="${style({
        'font-family': FONTS[page.font] || FONTS.serif, 'font-size': px(size), 'text-align': page.align, color: page.color,
      })}">${words ? `<p${titleStyle}>${xmlText(words)}</p>` : ''}${byline}</div>`);
    }
    if (page.frame && page.frame !== 'none') parts.push(`<div class="sl-frame frame-${attr(page.frame)}" style="${style({ 'border-color': page.frameColor })}"></div>`);
    parts.push(`<div class="sl-elements">${(page.elements || []).map(elementXhtml).join('')}</div>`);
    return `<div class="sl-page layout-${attr(page.layout)}" style="${style({ width: `${w}px`, height: `${h}px`, 'background-color': page.background })}">${parts.join('')}</div>`;
  }

  const EPUB_CSS = `
.sl-page { position: relative; overflow: hidden; display: grid; }
.sl-image { position: relative; overflow: hidden; min-height: 0; }
.sl-image img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; }
.sl-text { padding: 37px 48px; display: flex; flex-direction: column; justify-content: center; line-height: 1.35; min-height: 0; }
.sl-text p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.sl-byline { margin-top: .6em; opacity: .85; font-style: italic; }
.layout-image-top { grid-template-rows: 62% 1fr; }
.layout-image-left { grid-template-columns: 50% 1fr; }
.layout-text-only .sl-text { padding: 75px; }
.layout-image-full .sl-image, .layout-cover .sl-image { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
.layout-image-full .sl-text { position: absolute; left: 32px; right: 32px; bottom: 32px; padding: 21px 29px; border-radius: 19px; background: rgba(255,255,255,.88); }
.layout-cover .sl-text { position: absolute; top: 0; left: 0; right: 0; bottom: 0; justify-content: flex-start; padding: 85px 64px; }
.layout-cover .sl-text p:first-child { font-weight: 800; line-height: 1.1; }
.sl-frame { position: absolute; top: 24px; left: 24px; right: 24px; bottom: 24px; border: 0 solid; }
.frame-thin { border-width: 2px; } .frame-thick { border-width: 8px; } .frame-double { border-width: 11px; border-style: double; }
.frame-dashed { border-width: 4px; border-style: dashed; } .frame-dotted { border-width: 5px; border-style: dotted; }
.frame-rounded { border-width: 4px; border-radius: 32px; }
.sl-elements { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
.sl-el { position: absolute; transform-origin: center; }
.sl-el img { width: 100%; height: 100%; display: block; box-sizing: border-box; }
.sl-el svg { display: block; overflow: visible; }
.sl-words { width: 100%; white-space: pre-wrap; overflow-wrap: anywhere; }
.sl-glyph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; line-height: 1; }
.sl-sound-label { font: 12px sans-serif; text-align: center; }
`;

  // Exposed for checks; returns the exportEpub input.
  function buildEpubInput(book, withCopyright) {
    const size = PAGE_PT[book.size].map((pt) => Math.round(pt * PX));
    const pages = withCopyright ? [...book.pages, copyrightPage(book)] : book.pages;
    const cover = book.pages[0]?.layout === 'cover' ? imgName(book.pages[0].image) : null;
    return {
      bookId: book.id, css: EPUB_CSS, width: size[0], height: size[1], coverImage: cover || undefined,
      // Only the font names; the app adds the matching bundled font files itself.
      fonts: bookFontKeys(book).filter((key) => FONT_FILES[key]),
      pages: pages.map((page, i) => ({
        body: pageXhtml(page, book, size),
        label: withCopyright && i === pages.length - 1 ? 'Copyright' : page.layout === 'cover' && i === 0 ? 'Cover' : `Page ${i + 1}`,
      })),
    };
  }

  async function epub() {
    await saveNow();
    await loadFonts(bookFontKeys(state.book));
    const name = await api.exportEpub(buildEpubInput(state.book, addCopyright));
    if (name) toast(`Exported “${name}”`, { label: 'Show in Finder', run: () => api.revealExport() });
  }

  // ---------- WAV ----------
  const RATE = 44100;
  const GAP = 0.6;
  async function decode(ctx, bookId, file) {
    const res = await fetch(mediaUrl(bookId, file));
    if (!res.ok) throw new Error(`Could not read the sound “${file}”`);
    return ctx.decodeAudioData(await res.arrayBuffer());
  }
  function encodeWav(buffer) {
    const channels = buffer.numberOfChannels;
    const frames = buffer.length;
    const out = new DataView(new ArrayBuffer(44 + frames * channels * 2));
    const tag = (at, s) => { for (let i = 0; i < 4; i++) out.setUint8(at + i, s.charCodeAt(i)); };
    tag(0, 'RIFF'); out.setUint32(4, 36 + frames * channels * 2, true); tag(8, 'WAVE');
    tag(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, channels, true);
    out.setUint32(24, buffer.sampleRate, true); out.setUint32(28, buffer.sampleRate * channels * 2, true);
    out.setUint16(32, channels * 2, true); out.setUint16(34, 16, true);
    tag(36, 'data'); out.setUint32(40, frames * channels * 2, true);
    const data = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));
    let at = 44;
    for (let i = 0; i < frames; i++) {
      for (let c = 0; c < channels; c++) {
        const s = Math.max(-1, Math.min(1, data[c][i]));
        out.setInt16(at, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        at += 2;
      }
    }
    return new Uint8Array(out.buffer);
  }
  async function wav() {
    const book = state.book;
    const files = book.pages.map((p) => book.audio?.narration?.[p.id]?.file).filter(Boolean);
    if (!files.length) throw new Error('This book has no narration yet');
    const decoder = new OfflineAudioContext(2, 1, RATE);
    const clips = [];
    for (const file of files) clips.push(await decode(decoder, book.id, file));
    const music = book.audio?.music ? await decode(decoder, book.id, book.audio.music.file) : null;
    const total = clips.reduce((n, c) => n + c.duration, 0) + GAP * (clips.length - 1);
    const mix = new OfflineAudioContext(2, Math.max(1, Math.ceil(total * RATE)), RATE);
    let t = 0;
    for (const clip of clips) {
      const src = mix.createBufferSource();
      src.buffer = clip;
      src.connect(mix.destination);
      src.start(t);
      t += clip.duration + GAP;
    }
    if (music) {
      const src = mix.createBufferSource();
      src.buffer = music;
      src.loop = book.audio.music.loop !== false;
      const gain = mix.createGain();
      gain.gain.value = book.audio.music.volume ?? 0.3;
      src.connect(gain).connect(mix.destination);
      src.start(0);
    }
    const rendered = await mix.startRendering();
    const name = await api.exportWav({ title: book.title, bytes: encodeWav(rendered) });
    if (name) toast(`Exported “${name}”`, { label: 'Show in Finder', run: () => api.revealExport() });
  }

  // ---------- panel ----------
  function busyButton(props, label, task) {
    const btn = h('button', {
      ...props, onclick: async () => {
        btn.disabled = true;
        const old = btn.textContent;
        btn.textContent = 'Exporting…';
        try { await run(task); } finally { btn.disabled = false; btn.textContent = old; }
      },
    }, label);
    return btn;
  }
  const card = (id, title, desc, ...rest) => h('article', { class: 'export-card', 'data-export': id },
    h('h3', {}, title), h('p', { class: 'muted' }, desc), ...rest);

  function exportPanel() {
    const book = state.book;
    const hasNarration = book.pages.some((p) => book.audio?.narration?.[p.id]?.file);
    const pageCount = book.pages.length;

    const isbnErr = h('p', { class: 'export-error', id: 'export-isbn-error', role: 'alert' });
    const isbnOk = h('span', { class: 'export-saved muted', id: 'export-isbn-saved' });
    const isbnInput = h('input', {
      id: 'export-isbn', value: book.isbn || '', placeholder: '978-…', spellcheck: 'false', maxlength: '20', inputmode: 'numeric',
      oninput: () => {
        const err = isbnError(isbnInput.value);
        isbnErr.textContent = err;
        isbnInput.setAttribute('aria-invalid', err ? 'true' : 'false');
        isbnOk.textContent = '';
        if (err) return;
        book.isbn = isbnInput.value.trim();
        scheduleSave();
        isbnOk.textContent = book.isbn ? 'Saved' : '';
      },
    });
    const copyToggle = h('input', {
      type: 'checkbox', id: 'export-copyright', checked: addCopyright,
      onchange: () => { addCopyright = copyToggle.checked; },
    });

    const printWarn = pageCount < 24
      ? h('p', { class: 'export-warning', id: 'export-print-warning' },
        `This book has ${pageCount} ${pageCount === 1 ? 'page' : 'pages'}. Many print services need at least 24 pages — add more pages or check your printer’s minimum.`)
      : null;

    return h('div', { class: 'export-panel' },
      h('div', { class: 'export-grid' },
        card('pdf-digital', 'PDF for screens', 'Exact page size, for sharing by email or reading on a tablet.',
          busyButton({ class: 'btn primary', id: 'export-pdf-digital' }, 'Export PDF', () => pdf('digital'))),
        card('pdf-print', 'PDF for printing', 'Adds 0.125 in bleed on every edge so colour runs past the trim line. Many print services require at least 24 pages.',
          printWarn,
          busyButton({ class: 'btn primary', id: 'export-pdf-print' }, 'Export print PDF', () => pdf('print'))),
        card('epub', 'EPUB 3 e-book', 'Fixed-layout pages that keep your design, for Apple Books and other e-readers.',
          busyButton({ class: 'btn primary', id: 'export-epub' }, 'Export EPUB', epub)),
        card('audio', 'Audiobook (WAV)', hasNarration
          ? 'All narration in page order with short pauses, mixed with your background music.'
          : 'Record or generate narration in the Studio first — this book has no narration yet.',
        busyButton({ class: 'btn primary', id: 'export-wav', disabled: !hasNarration }, 'Export WAV', wav),
        h('div', { class: 'export-unavailable', 'data-unavailable': 'mp3-export' },
          h('strong', {}, 'MP3 isn’t available'),
          h('span', {}, ' — Storyloom doesn’t bundle an MP3 encoder. Open the WAV in Music or QuickTime Player to convert it.')))),
      h('section', { class: 'export-details' },
        h('h3', {}, 'Book details'),
        h('label', { class: 'field export-isbn-field' }, h('span', { class: 'field-label' }, 'ISBN (optional)'),
          h('div', { class: 'export-isbn-row' }, isbnInput, isbnOk)),
        isbnErr,
        h('label', { class: 'check' }, copyToggle, 'Add a copyright page to PDFs and e-books'),
        h('p', { class: 'muted small-print' }, 'The copyright page (title, author, year, ISBN) is added only to exported PDFs and EPUBs — your book isn’t changed.')));
  }

  registerScreen('export', {
    label: 'Export', scope: 'book',
    render(host) {
      host.replaceChildren(h('div', { class: 'export-main' },
        h('header', { class: 'export-head' }, h('h1', {}, 'Export'), h('p', { class: 'muted' }, `Share “${state.book.title}” as a PDF, an e-book, or an audiobook. Files are saved on this Mac.`)),
        exportPanel()));
    },
  });

  window.openExportDialog = () => {
    if (!state.book) { toast('Open a book first'); return null; }
    const dialog = modal('Export', () => exportPanel());
    dialog.classList.add('export-modal');
    return dialog;
  };
  window.__storyloomExport = { isbnError, buildEpubInput };
})();
