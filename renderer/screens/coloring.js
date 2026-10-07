(() => {
  'use strict';
  // Coloring: turn a book into line-art pages, make one from an idea with your own AI, and paint pages.

  const MAX_SIDE = 2048;
  const DARK_INK = '#222222';
  const PALETTE = [
    '#e63946', '#ff7f50', '#ffb703', '#ffe066', '#8ac926', '#2a9d8f', '#06d6a0', '#4cc9f0',
    '#1d70b8', '#7b6cf6', '#f78fb3', '#a0522d', '#f4d1ae', '#8d99ae', '#ffffff', '#222222',
  ];

  // ---------- line art (pure) ----------
  // Grayscale → 3×3 blur → Sobel edge magnitude → threshold. Lines come out dark on white.
  function lineArt(imageData, threshold = 48) {
    const { width: w, height: hgt, data } = imageData;
    const gray = new Float32Array(w * hgt);
    for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
      const a = data[p + 3] / 255; // Transparent counts as white.
      gray[i] = (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) * a + 255 * (1 - a);
    }
    const at = (arr, x, y) => arr[Math.min(hgt - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
    const blur = new Float32Array(w * hgt);
    for (let y = 0; y < hgt; y++) {
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += at(gray, x + dx, y + dy);
        blur[y * w + x] = s / 9;
      }
    }
    const out = new ImageData(w, hgt);
    const o = out.data;
    for (let y = 0; y < hgt; y++) {
      for (let x = 0; x < w; x++) {
        const tl = at(blur, x - 1, y - 1), t = at(blur, x, y - 1), tr = at(blur, x + 1, y - 1);
        const l = at(blur, x - 1, y), r = at(blur, x + 1, y);
        const bl = at(blur, x - 1, y + 1), b = at(blur, x, y + 1), br = at(blur, x + 1, y + 1);
        const gx = tr + 2 * r + br - tl - 2 * l - bl;
        const gy = bl + 2 * b + br - tl - 2 * t - tr;
        const v = Math.hypot(gx, gy) > threshold ? 0 : 255;
        const p = (y * w + x) * 4;
        o[p] = o[p + 1] = o[p + 2] = v;
        o[p + 3] = 255;
      }
    }
    return out;
  }
  window.storyloomLineArt = lineArt;

  // ---------- image helpers ----------
  async function loadBitmap(bookId, name) {
    const res = await fetch(mediaUrl(bookId, name));
    if (!res.ok) throw new Error('Could not open a picture in this book');
    return createImageBitmap(await res.blob());
  }
  function canvasFor(bitmap) {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const c2d = canvas.getContext('2d', { willReadFrequently: true });
    c2d.fillStyle = '#ffffff';
    c2d.fillRect(0, 0, canvas.width, canvas.height);
    c2d.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas;
  }
  async function canvasBytes(canvas) {
    const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make the picture'))), 'image/png'));
    return new Uint8Array(await blob.arrayBuffer());
  }
  async function convertImage(bookId, name) {
    const canvas = canvasFor(await loadBitmap(bookId, name));
    const c2d = canvas.getContext('2d');
    c2d.putImageData(lineArt(c2d.getImageData(0, 0, canvas.width, canvas.height)), 0, 0);
    return api.saveImage(bookId, await canvasBytes(canvas));
  }

  // ---------- progress modal ----------
  function progressModal(title) {
    const label = h('p', { class: 'coloring-progress-label' }, 'Getting ready…');
    const bar = h('progress', { class: 'coloring-progress-bar', max: '1', value: '0' });
    const dialog = modal(title, () => h('div', { class: 'form coloring-progress' }, label, bar,
      h('p', { class: 'muted small-print' }, 'Please keep Storyloom open until this finishes.')));
    dialog.addEventListener('cancel', (e) => e.preventDefault());
    dialog.querySelector('header .icon-btn')?.remove();
    return {
      set(text, fraction) { label.textContent = text; bar.value = fraction; },
      close() { dialog.close(); dialog.remove(); },
    };
  }

  // ---------- book → coloring book ----------
  async function convertToColoringBook(bookId) {
    const source = await api.readBook(bookId);
    const progress = progressModal('Making a coloring book');
    try {
      const copy = await api.duplicateBook(bookId, { title: `${source.title} (coloring)`.slice(0, 200), kind: 'coloring' });
      const done = new Map();
      const convert = async (name) => {
        if (!done.has(name)) done.set(name, await convertImage(copy.id, name));
        return done.get(name);
      };
      const total = copy.pages.length;
      for (const [i, page] of copy.pages.entries()) {
        progress.set(`Page ${i + 1} of ${total}`, i / Math.max(1, total));
        if (page.image) page.image = await convert(page.image);
        page.background = '#ffffff';
        page.color = DARK_INK;
        for (const el of page.elements || []) {
          if (el.type === 'image' && el.image) el.image = await convert(el.image);
          else if (el.type === 'shape') { el.fill = null; el.strokeWidth = Math.max(2, el.strokeWidth || 0); if (!el.stroke) el.stroke = DARK_INK; }
          else if (el.type === 'text') el.color = DARK_INK;
        }
      }
      progress.set('Saving…', 1);
      await api.saveBook(copy);
      return copy.id;
    } finally {
      progress.close();
    }
  }
  window.convertToColoringBook = convertToColoringBook;

  // ---------- idea → coloring book (own AI) ----------
  async function makeFromIdea(idea, count) {
    const progress = progressModal('Making a coloring book');
    try {
      progress.set('Writing page ideas…', 0);
      const story = await api.generateStory({ idea, length: 'tiny', pages: count, purpose: 'coloring' });
      const captions = story.pages.slice(0, count);
      const book = await api.createBook({
        kind: 'coloring', title: story.title || 'My coloring book',
        pages: [{ layout: 'cover', text: '', fontSize: 44, background: '#ffffff', color: DARK_INK }],
      });
      const steps = captions.length + 1;
      progress.set(`Drawing the cover (1 of ${steps})`, 0);
      book.pages[0].image = await api.generateImage({ bookId: book.id, prompt: `Cover: ${idea}`, lineArt: true });
      for (const [i, caption] of captions.entries()) {
        progress.set(`Drawing page ${i + 1} of ${captions.length}`, (i + 1) / steps);
        const image = await api.generateImage({ bookId: book.id, prompt: caption, lineArt: true });
        book.pages.push({ layout: 'image-top', text: caption, image, background: '#ffffff', color: DARK_INK });
      }
      progress.set('Saving…', 1);
      const saved = await api.saveBook(book);
      return saved.id;
    } finally {
      progress.close();
    }
  }

  // ---------- home view ----------
  async function renderHome(host) {
    const books = (await run(() => api.listBooks())) || [];
    const coloring = books.filter((b) => b.kind === 'coloring');
    const stories = books.filter((b) => b.kind !== 'coloring');
    const thumb = (s) => scaledPage(s.cover, { id: s.id, title: s.title, author: s.author, size: s.size }, 200, 200);

    const pickBook = () => modal('Convert a book', (close) => h('div', { class: 'form' },
      stories.length
        ? h('div', { class: 'coloring-pick-list' }, stories.map((s) => h('button', {
          class: 'coloring-pick', 'data-convert': s.id,
          onclick: () => run(async () => {
            close();
            const id = await convertToColoringBook(s.id);
            toast('Coloring book ready');
            await navigate('coloring', { paint: id });
          }),
        }, h('span', { class: 'coloring-pick-cover' }, scaledPage(s.cover, { id: s.id, title: s.title, author: s.author, size: s.size }, 56, 56)),
        h('span', {}, h('strong', {}, s.title), h('span', { class: 'muted small-print' }, `${s.pageCount} pages`)))))
        : h('p', { class: 'muted' }, 'You have no story books yet. Make one first, then come back.'),
      h('p', { class: 'muted small-print' }, 'Your book is copied — the original stays as it is.')));

    const ideaInput = h('textarea', { id: 'coloring-idea', rows: '3', maxlength: '2000', required: true, placeholder: 'Dinosaurs having a picnic by the sea' });
    const pagesInput = h('input', { id: 'coloring-pages', type: 'number', min: '4', max: '12', value: '6' });
    const ideaButton = h('button', { class: 'btn primary', id: 'coloring-make' }, 'Make coloring book');
    const ideaForm = h('form', { class: 'form coloring-idea-form', onsubmit: (e) => {
      e.preventDefault();
      run(async () => {
        const idea = ideaInput.value.trim();
        if (!idea) return toast('Describe your idea first');
        const count = Math.min(12, Math.max(4, Math.round(Number(pagesInput.value) || 6)));
        ideaButton.disabled = true;
        try {
          const id = await makeFromIdea(idea, count);
          toast('Coloring book ready');
          await navigate('coloring', { paint: id });
        } catch (error) {
          toast(cleanError(error), { label: 'Open settings', run: openAiSettings });
        } finally { ideaButton.disabled = false; }
      });
    } },
    h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Your idea'), ideaInput),
    h('label', { class: 'field coloring-pages-field' }, h('span', { class: 'field-label' }, 'Number of pages (4–12)'), pagesInput),
    h('p', { class: 'muted small-print' }, 'Captions are written by your writing service; outline pictures use your picture service (both set in Account).'),
    aiWriterNote(),
    h('div', { class: 'form-actions' }, ideaButton));

    host.replaceChildren(h('div', { class: 'library-main coloring-home' },
      h('header', { class: 'coloring-head' },
        h('div', {}, h('h1', {}, 'Coloring'),
          h('p', { class: 'muted' }, 'Turn any book into pages to color, then paint them right here.'))),
      h('div', { class: 'coloring-starts' },
        h('section', { class: 'coloring-start' },
          h('h2', {}, 'Convert a book'),
          h('p', { class: 'muted' }, 'Every picture becomes clean outlines on white, made on your Mac with no AI service needed.'),
          h('button', { class: 'btn secondary', id: 'coloring-convert', onclick: pickBook }, 'Choose a book…')),
        h('section', { class: 'coloring-start' },
          h('h2', {}, 'Make one from an idea'), ideaForm)),
      h('h2', { class: 'coloring-section-title' }, 'Your coloring books'),
      coloring.length
        ? h('div', { class: 'book-grid' }, coloring.map((s) => h('article', { class: 'book-card coloring-card', 'data-book': s.id },
          h('button', { class: 'book-open', 'data-paint': s.id, onclick: () => run(() => navigate('coloring', { paint: s.id })), 'aria-label': `Paint ${s.title}` },
            h('div', { class: 'book-cover' }, thumb(s)),
            h('h2', {}, s.title),
            h('p', { class: 'muted' }, `${s.pageCount} ${s.pageCount === 1 ? 'page' : 'pages'} · Open to paint`)))))
        : h('p', { class: 'muted coloring-none' }, 'No coloring books yet. Convert a book or start from an idea above.')));
  }

  // ---------- paint view ----------
  // Scanline flood fill. Stops at dark line pixels and at colors far from the start color.
  function floodFill(img, sx, sy, rgb, tolerance = 40) {
    const { width: w, height: hgt, data } = img;
    const start = (sy * w + sx) * 4;
    const sr = data[start], sg = data[start + 1], sb = data[start + 2];
    const isLine = (p) => 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2] < 90;
    if (isLine(start)) return false;
    if (Math.abs(sr - rgb[0]) + Math.abs(sg - rgb[1]) + Math.abs(sb - rgb[2]) < 3) return false;
    const seen = new Uint8Array(w * hgt);
    const ok = (i) => {
      if (seen[i]) return false;
      const p = i * 4;
      return !isLine(p) && Math.abs(data[p] - sr) + Math.abs(data[p + 1] - sg) + Math.abs(data[p + 2] - sb) <= tolerance * 3;
    };
    const stack = [[sx, sy]];
    while (stack.length) {
      const [x0, y] = stack.pop();
      let x = x0;
      if (!ok(y * w + x)) continue;
      while (x > 0 && ok(y * w + x - 1)) x--;
      let up = false, down = false;
      for (; x < w && ok(y * w + x); x++) {
        const i = y * w + x;
        seen[i] = 1;
        data[i * 4] = rgb[0]; data[i * 4 + 1] = rgb[1]; data[i * 4 + 2] = rgb[2]; data[i * 4 + 3] = 255;
        if (y > 0) { const u = ok(i - w); if (u && !up) stack.push([x, y - 1]); up = u; }
        if (y < hgt - 1) { const d = ok(i + w); if (d && !down) stack.push([x, y + 1]); down = d; }
      }
    }
    return true;
  }
  const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

  function pageImageRef(page) {
    if (page.image) return { name: page.image, set: (n) => { page.image = n; } };
    const imgs = (page.elements || []).filter((e) => e.type === 'image' && e.image);
    if (!imgs.length) return null;
    const el = imgs.reduce((a, b) => (b.w * b.h > a.w * a.h ? b : a));
    return { name: el.image, set: (n) => { el.image = n; } };
  }

  async function renderPaint(host, bookId, startIndex = 0) {
    const book = await api.readBook(bookId);
    // Start on the requested page, or the first page that has a picture to color.
    const firstWithImage = Math.max(0, book.pages.findIndex((p) => pageImageRef(p)));
    const paint = { tool: 'fill', color: PALETTE[0], size: 18, undo: [], index: Math.min(startIndex || firstWithImage, book.pages.length - 1) };
    window.__coloringPaint = paint;
    const stage = h('div', { class: 'coloring-stage' });
    const pagePicker = h('div', { class: 'coloring-pages', 'aria-label': 'Pages' });
    const undoBtn = h('button', { class: 'btn ghost', id: 'coloring-undo', disabled: true, onclick: () => undo() }, 'Undo');
    const saveBtn = h('button', { class: 'btn primary', id: 'coloring-save', onclick: () => run(save) }, 'Save colored page');
    let canvas = null, c2d = null, overlay = null, ref = null;

    const toolBtn = (tool, label) => h('button', {
      class: `coloring-tool${paint.tool === tool ? ' active' : ''}`, 'data-tool': tool,
      onclick: (e) => { paint.tool = tool; for (const b of e.currentTarget.parentNode.children) b.classList.toggle('active', b.dataset.tool === tool); },
    }, label);
    const swatches = h('div', { class: 'coloring-palette' }, PALETTE.map((c) => h('button', {
      class: `coloring-swatch${c === paint.color ? ' active' : ''}`, 'data-color': c, style: { backgroundColor: c }, 'aria-label': `Color ${c}`,
      onclick: () => setColor(c),
    })));
    const custom = h('input', { type: 'color', id: 'coloring-custom', value: paint.color, oninput: (e) => setColor(e.target.value) });
    function setColor(c) {
      paint.color = c;
      custom.value = c;
      for (const b of swatches.children) b.classList.toggle('active', b.dataset.color === c);
    }
    const size = h('input', { type: 'range', id: 'coloring-size', min: '2', max: '80', value: String(paint.size), oninput: (e) => { paint.size = Number(e.target.value); } });

    function pushUndo() {
      paint.undo.push(c2d.getImageData(0, 0, canvas.width, canvas.height));
      if (paint.undo.length > 20) paint.undo.shift();
      undoBtn.disabled = false;
    }
    function undo() {
      const last = paint.undo.pop();
      if (last && c2d) c2d.putImageData(last, 0, 0);
      undoBtn.disabled = paint.undo.length === 0;
    }
    const toCanvas = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height };
    };
    // Keeps the outlines on top of brush/eraser strokes.
    const relayLines = () => {
      c2d.save(); c2d.globalCompositeOperation = 'darken'; c2d.drawImage(overlay, 0, 0); c2d.restore();
    };

    async function showPage() {
      const page = book.pages[paint.index];
      paint.undo = []; undoBtn.disabled = true;
      for (const b of pagePicker.children) b.classList.toggle('active', Number(b.dataset.page) === paint.index);
      ref = pageImageRef(page);
      canvas = null;
      if (!ref) {
        saveBtn.disabled = true;
        stage.replaceChildren(h('div', { class: 'coloring-noimage', 'data-noimage': '' },
          h('h2', {}, 'Nothing to color on this page'), h('p', { class: 'muted' }, 'This page has no picture. Pick another page.')));
        return;
      }
      saveBtn.disabled = false;
      stage.replaceChildren(h('p', { class: 'muted' }, 'Loading…'));
      const bitmap = await loadBitmap(book.id, ref.name);
      canvas = canvasFor(bitmap);
      canvas.id = 'coloring-canvas';
      c2d = canvas.getContext('2d', { willReadFrequently: true });
      overlay = canvasFor(bitmap);
      let last = null;
      canvas.addEventListener('pointerdown', (e) => {
        const p = toCanvas(e);
        const x = Math.floor(p.x), y = Math.floor(p.y);
        if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
        if (paint.tool === 'fill') {
          const before = c2d.getImageData(0, 0, canvas.width, canvas.height);
          const img = c2d.getImageData(0, 0, canvas.width, canvas.height);
          if (floodFill(img, x, y, hexRgb(paint.color))) {
            paint.undo.push(before); if (paint.undo.length > 20) paint.undo.shift(); undoBtn.disabled = false;
            c2d.putImageData(img, 0, 0);
          }
          return;
        }
        pushUndo();
        canvas.setPointerCapture(e.pointerId);
        last = p;
        stroke(p, p);
      });
      canvas.addEventListener('pointermove', (e) => { if (!last) return; const p = toCanvas(e); stroke(last, p); last = p; });
      const end = () => { if (last) relayLines(); last = null; };
      canvas.addEventListener('pointerup', end);
      canvas.addEventListener('pointercancel', end);
      stage.replaceChildren(canvas);
      fitCanvas();
    }
    // Shows the picture as large as the stage allows, keeping its shape.
    function fitCanvas() {
      if (!canvas) return;
      const r = stage.getBoundingClientRect();
      const scale = Math.min(r.width / canvas.width, r.height / canvas.height);
      if (!(scale > 0)) return;
      canvas.style.width = `${Math.floor(canvas.width * scale)}px`;
      canvas.style.height = `${Math.floor(canvas.height * scale)}px`;
    }
    new ResizeObserver(fitCanvas).observe(stage);
    function stroke(a, b) {
      const scale = canvas.width / canvas.getBoundingClientRect().width;
      c2d.save();
      c2d.strokeStyle = paint.tool === 'eraser' ? '#ffffff' : paint.color;
      c2d.lineWidth = paint.size * scale;
      c2d.lineCap = 'round'; c2d.lineJoin = 'round';
      c2d.beginPath(); c2d.moveTo(a.x, a.y); c2d.lineTo(b.x + 0.01, b.y); c2d.stroke();
      c2d.restore();
      relayLines();
    }
    async function save() {
      if (!canvas || !ref) return;
      saveBtn.disabled = true;
      try {
        const name = await api.saveImage(book.id, await canvasBytes(canvas));
        ref.set(name);
        await api.saveBook(book);
        ref = pageImageRef(book.pages[paint.index]);
        overlay = canvasFor(await loadBitmap(book.id, name));
        refreshThumbs();
        toast('Colored page saved');
      } finally { saveBtn.disabled = false; }
    }
    function refreshThumbs() {
      pagePicker.replaceChildren(...book.pages.map((page, i) => h('button', {
        class: `coloring-page-btn${i === paint.index ? ' active' : ''}`, 'data-page': String(i), 'aria-label': `Page ${i + 1}`,
        onclick: () => { if (i !== paint.index) { paint.index = i; run(showPage); } },
      }, scaledPage(page, book, 84, 84), h('span', {}, i === 0 ? 'Cover' : `Page ${i}`))));
    }
    refreshThumbs();

    host.replaceChildren(h('div', { class: 'coloring-paint' },
      h('header', { class: 'coloring-paint-bar' },
        h('button', { class: 'btn ghost', id: 'coloring-back', onclick: () => run(() => navigate('coloring')) }, '← Coloring books'),
        h('h1', {}, book.title),
        h('div', { class: 'coloring-paint-actions' },
          h('button', { class: 'btn ghost', onclick: () => run(() => openBook(book.id)) }, 'Open in designer'), undoBtn, saveBtn)),
      h('div', { class: 'coloring-paint-body' },
        pagePicker,
        h('div', { class: 'coloring-stage-wrap' }, stage),
        h('aside', { class: 'coloring-tools' },
          h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Tool'),
            h('div', { class: 'coloring-toolset' }, toolBtn('fill', 'Fill'), toolBtn('brush', 'Brush'), toolBtn('eraser', 'Eraser'))),
          h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Brush size'), size),
          h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Colors'), swatches),
          h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Any color'), custom),
          h('p', { class: 'muted small-print' }, 'Fill colors a whole area up to the outlines. Brush and eraser keep the outlines on top.')))));
    await showPage();
  }

  registerScreen('coloring', {
    label: 'Coloring',
    scope: 'app',
    render(host, params = {}) {
      const id = params.paint || params.bookId;
      return id ? renderPaint(host, id, params.page || 0) : renderHome(host);
    },
  });
})();
