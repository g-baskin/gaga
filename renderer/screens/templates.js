// Templates catalogue: page themes and starter books, with a page-flipping preview.
(() => {
  'use strict';

  const T = () => window.STORYLOOM_TEMPLATES;
  const view = { category: 'all', query: '' };

  // Scaled page preview without the "Add a picture" placeholder.
  function preview(page, book, maxW, maxH) {
    const [w, hgt] = PAGE_PT[book.size].map((pt) => pt * (4 / 3));
    const scale = Math.min(maxW / w, maxH / hgt);
    const pageEl = renderPage(page, book, { print: true });
    Object.assign(pageEl.style, { transform: `scale(${scale})`, transformOrigin: 'top left' });
    return h('div', { class: 'page-frame templates-frame', style: { width: `${w * scale}px`, height: `${hgt * scale}px` } }, pageEl);
  }

  const themeBook = (theme) => ({ id: 'template-preview', title: theme.name, author: '', size: 'square' });
  const starterBook = (s) => ({ id: 'template-preview', title: s.title, author: '', size: s.size });

  // "Fredoka + Quicksand": the title font and the body font a theme pairs.
  const pairing = (theme) => [theme.titleFont, theme.font].filter((key, i, all) => key && all.indexOf(key) === i)
    .map((key) => (FONT_LABEL[key] || key).replace(/ \(.*\)$/, '')).join(' + ');

  // One sample per font, shown in that font.
  const SAMPLE = 'Once upon a time, a small fox found a big red kite.';
  function fontSection() {
    const q = view.query.trim().toLowerCase();
    if (view.category !== 'all' && view.category !== 'Fonts') return null;
    const groups = FONT_GROUPS.map((group) => ({
      ...group, keys: group.keys.filter((key) => !q || `${FONT_LABEL[key]} ${group.label} fonts`.toLowerCase().includes(q)),
    })).filter((group) => group.keys.length);
    const count = groups.reduce((n, g) => n + g.keys.length, 0);
    if (!count) return null;
    // Loading only matters for the samples; nothing waits on it.
    loadFonts(groups.flatMap((g) => g.keys)).catch(() => {});
    return h('section', { class: 'templates-section', id: 'templates-fonts' },
      h('h2', {}, 'Fonts', h('span', { class: 'muted templates-count' }, ` ${count}`)),
      h('p', { class: 'muted templates-lede' }, 'Pick any of these for page words or text boxes in the Designer. The free fonts come with Storyloom and travel inside your PDFs and e-books.'),
      ...groups.map((group) => h('div', { class: 'templates-font-group' },
        h('h3', {}, group.label),
        h('div', { class: 'templates-font-grid' }, group.keys.map((key) => h('div', { class: 'templates-font', 'data-font': key },
          h('span', { class: 'templates-font-name' }, FONT_LABEL[key]),
          h('span', { class: 'templates-font-sample', style: { fontFamily: FONTS[key] } }, SAMPLE)))))));
  }

  function matches(item, category) {
    const q = view.query.trim().toLowerCase();
    if (view.category !== 'all' && category !== view.category) return false;
    return !q || `${item.name} ${item.description} ${category}`.toLowerCase().includes(q);
  }

  function render(host) {
    const data = T();
    if (!data) {
      host.replaceChildren(h('section', { class: 'empty' }, h('h1', {}, 'Templates'), h('p', {}, 'The template library could not be loaded.')));
      return;
    }
    const results = h('div', { class: 'templates-results' });
    const chips = h('div', { class: 'templates-chips', role: 'toolbar', 'aria-label': 'Categories' });
    const drawChips = () => chips.replaceChildren(...['all', ...data.categories, 'Fonts'].map((c) => h('button', {
      class: `templates-chip${view.category === c ? ' active' : ''}`, 'data-category': c, 'aria-pressed': String(view.category === c),
      onclick: () => { view.category = c; drawChips(); drawResults(); },
    }, c === 'all' ? 'All' : c)));

    const drawResults = () => {
      const themeOf = (s) => data.themes.find((t) => t.id === s.themeId);
      const themes = data.themes.filter((t) => matches(t, t.category));
      const starters = data.starters.filter((s) => matches(s, themeOf(s)?.category));
      if (view.category === 'Fonts') {
        results.replaceChildren(fontSection() || h('p', { class: 'muted' }, 'No fonts match.'));
        return;
      }
      results.replaceChildren(...[
        h('section', { class: 'templates-section' },
          h('h2', {}, 'Page themes', h('span', { class: 'muted templates-count' }, ` ${themes.length}`)),
          themes.length ? h('div', { class: 'templates-grid' }, themes.map((theme) => h('button', {
            class: 'templates-card', 'data-theme-id': theme.id, onclick: () => openPreview({ kind: 'theme', item: theme }),
          },
          h('div', { class: 'templates-cover' }, preview(theme.cover, themeBook(theme), 180, 180)),
          h('span', { class: 'templates-name' }, theme.name),
          h('span', { class: 'templates-meta muted' }, theme.category),
          h('span', { class: 'templates-desc muted' }, theme.description),
          h('span', { class: 'templates-fonts muted' }, `Fonts: ${pairing(theme)}`))))
            : h('p', { class: 'muted' }, 'No themes match.')),
        h('section', { class: 'templates-section' },
          h('h2', {}, 'Starter books', h('span', { class: 'muted templates-count' }, ` ${starters.length}`)),
          h('p', { class: 'muted templates-lede' }, 'Short ready-made stories to change and make your own.'),
          starters.length ? h('div', { class: 'templates-grid' }, starters.map((s) => h('button', {
            class: 'templates-card', 'data-starter-id': s.id, onclick: () => openPreview({ kind: 'starter', item: s }),
          },
          h('div', { class: 'templates-cover' }, preview(s.pages[0], starterBook(s), 180, 180)),
          h('span', { class: 'templates-name' }, s.name),
          h('span', { class: 'templates-meta muted' }, `${s.text.length + 1} pages · ${themeOf(s)?.name || ''}`),
          h('span', { class: 'templates-desc muted' }, s.description))))
            : h('p', { class: 'muted' }, 'No starter books match.')),
        fontSection(),
      ].filter(Boolean));
    };

    const search = h('input', {
      id: 'templates-search', type: 'search', class: 'templates-search', placeholder: 'Search templates', 'aria-label': 'Search templates',
      value: view.query, oninput: (e) => { view.query = e.target.value; drawResults(); },
    });
    drawChips();
    drawResults();
    host.replaceChildren(h('div', { class: 'templates-main' },
      h('header', { class: 'templates-head' },
        h('div', {}, h('h1', {}, 'Templates'),
          h('p', { class: 'muted' }, 'Pick a look for your pages, or start from a short story.')),
        search),
      chips, results));
  }

  function openPreview({ kind, item }) {
    const data = T();
    const book = kind === 'theme' ? themeBook(item) : starterBook(item);
    const pages = kind === 'theme' ? [item.cover, item.page] : item.pages;
    const themeId = kind === 'theme' ? item.id : item.themeId;
    let index = 0;
    const stage = h('div', { class: 'templates-stage' });
    const counter = h('span', { class: 'templates-counter muted', 'aria-live': 'polite' });
    const prev = h('button', { class: 'btn ghost', 'data-flip': 'prev', 'aria-label': 'Previous page', onclick: () => flip(-1) }, '‹ Back');
    const next = h('button', { class: 'btn ghost', 'data-flip': 'next', 'aria-label': 'Next page', onclick: () => flip(1) }, 'Next ›');
    const draw = () => {
      stage.replaceChildren(preview(pages[index], book, 520, 400));
      counter.textContent = `Page ${index + 1} of ${pages.length}`;
      prev.disabled = index === 0;
      next.disabled = index === pages.length - 1;
    };
    const flip = (d) => { index = Math.max(0, Math.min(pages.length - 1, index + d)); draw(); };
    draw();
    // Redraw in the theme's real fonts as soon as they're ready.
    const theme = data.themes.find((t) => t.id === themeId);
    if (theme) loadFonts([theme.font, theme.titleFont]).then(() => { if (stage.isConnected) draw(); });

    const dialog = modal(item.name, (close) => h('div', { class: 'form templates-preview-body' },
      h('p', { class: 'muted' }, item.description),
      theme ? h('p', { class: 'muted small-print', id: 'templates-preview-fonts' }, `Fonts: ${pairing(theme)}`) : null,
      stage,
      h('div', { class: 'templates-flipper' }, prev, counter, next),
      h('div', { class: 'form-actions' },
        h('button', { class: 'btn ghost', 'data-action': 'apply', onclick: () => { close(); run(() => chooseBook(themeId)); } }, 'Apply to a book…'),
        h('button', {
          class: 'btn primary', 'data-action': 'use',
          onclick: () => run(async () => {
            const input = data.bookFromTemplate(item.id);
            const profile = await api.getProfile().catch(() => null);
            if (profile?.authorName) input.author = profile.authorName;
            const created = await api.createBook(input);
            close();
            await openBook(created.id, 'designer');
          }),
        }, 'Use this template'))));
    dialog.classList.add('templates-dialog');
    dialog.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); flip(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); flip(-1); }
    });
  }

  async function chooseBook(themeId) {
    const theme = T().themes.find((t) => t.id === themeId);
    // Called through run(): a failure shows a toast instead of a "no books" list.
    const books = (await api.listBooks()).filter((b) => b.kind !== 'coloring');
    const dialog = modal(`Apply “${theme.name}”`, (close) => h('div', { class: 'form' },
      h('p', { class: 'muted' }, 'Changes the colours, lettering, frame and decorations of every page. Your words, pictures and your own stickers stay as they are.'),
      books.length ? h('div', { class: 'templates-book-list' }, books.map((b) => h('button', {
        class: 'templates-book', 'data-apply-book': b.id,
        onclick: () => run(async () => {
          const book = await api.readBook(b.id);
          T().applyTheme(book, themeId);
          await api.saveBook(book);
          close();
          toast(`“${theme.name}” applied to ${book.title}`);
          await openBook(b.id, 'designer');
        }),
      },
      h('div', { class: 'templates-book-cover' }, scaledPage(b.cover, b, 56, 56)),
      h('span', {}, h('strong', {}, b.title), h('span', { class: 'muted small-print' }, ` · ${b.pageCount} ${b.pageCount === 1 ? 'page' : 'pages'}`)))))
        : h('p', { class: 'muted' }, 'You don’t have any books yet. Use the template to start one.'),
      h('div', { class: 'form-actions' }, h('button', { class: 'btn ghost', onclick: close }, 'Cancel'))));
    dialog.classList.add('templates-dialog-narrow');
  }

  registerScreen('templates', { label: 'Templates', scope: 'app', render });
})();
