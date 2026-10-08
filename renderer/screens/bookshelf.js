(() => {
  'use strict';
  // Bookshelf: every book on this Mac, with search, sorting, custom order, shelves, and a per-book menu.

  const SORT_KEY = 'storyloom.bookshelf.sort';
  const SORTS = [
    ['recent', 'Recently edited'], ['oldest', 'Oldest first'], ['az', 'Title A–Z'], ['za', 'Title Z–A'], ['custom', 'Custom order'],
  ];
  const ui = {
    host: null, books: [], shelves: [], profile: { authorName: '', bookOrder: [] },
    shelf: 'all', query: '', sort: SORTS.some(([k]) => k === localStorage.getItem(SORT_KEY)) ? localStorage.getItem(SORT_KEY) : 'recent',
    showShare: false,
  };
  let menuEl = null;
  let menuCleanup = null;
  let suppressClickUntil = 0;

  const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  async function load() {
    const [books, shelves, profile] = await Promise.all([
      api.listBooks(), api.listShelves().catch(() => []), api.getProfile().catch(() => ({ authorName: '', bookOrder: [] })),
    ]);
    ui.books = books || [];
    ui.shelves = shelves || [];
    ui.profile = { authorName: '', bookOrder: [], ...profile };
    if (!['all', 'coloring'].includes(ui.shelf) && !ui.shelves.some((s) => s.id === ui.shelf)) ui.shelf = 'all';
  }

  function customOrdered(books) {
    const index = new Map((ui.profile.bookOrder || []).map((id, i) => [id, i]));
    // Books not yet placed (new ones) go first, newest first.
    return [...books].sort((a, b) => {
      const ia = index.has(a.id) ? index.get(a.id) : -1;
      const ib = index.has(b.id) ? index.get(b.id) : -1;
      if (ia === -1 && ib === -1) return b.updatedAt - a.updatedAt;
      return ia - ib;
    });
  }

  function sorted(books) {
    const list = [...books];
    switch (ui.sort) {
      case 'oldest': return list.sort((a, b) => a.updatedAt - b.updatedAt);
      case 'az': return list.sort((a, b) => collator.compare(a.title, b.title));
      case 'za': return list.sort((a, b) => collator.compare(b.title, a.title));
      case 'custom': return customOrdered(list);
      default: return list.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  }

  function inShelf(book, shelf = ui.shelf) {
    if (shelf === 'all') return true;
    if (shelf === 'coloring') return book.kind === 'coloring';
    return !!ui.shelves.find((s) => s.id === shelf)?.bookIds.includes(book.id);
  }

  function visibleBooks() {
    const q = ui.query.trim().toLowerCase();
    return sorted(ui.books.filter((b) => inShelf(b)
      && (!q || `${b.title}\n${b.author || ''}`.toLowerCase().includes(q))));
  }

  const currentShelf = () => ui.shelves.find((s) => s.id === ui.shelf) || null;

  // ---------- rendering ----------
  async function render(host) {
    ui.host = host;
    closeMenu();
    await load();
    draw();
  }

  function draw() {
    if (!ui.host?.isConnected) return;
    const focusSearch = document.activeElement?.id === 'bs-search';
    const caret = focusSearch ? document.activeElement.selectionStart : null;
    ui.host.replaceChildren(h('div', { class: 'bs-root' }, drawShelves(), drawMain()));
    if (focusSearch) {
      const input = document.getElementById('bs-search');
      input.focus();
      input.setSelectionRange(caret, caret);
    }
  }

  function shelfRow(id, label, count, extra) {
    return h('li', { class: `bs-shelf${ui.shelf === id ? ' active' : ''}`, 'data-shelf': id },
      h('button', {
        class: 'bs-shelf-btn', 'aria-current': ui.shelf === id ? 'true' : null,
        onclick: () => { ui.shelf = id; ui.showShare = false; draw(); },
      }, h('span', { class: 'bs-shelf-name' }, label), h('span', { class: 'bs-shelf-count' }, String(count))),
      extra || null);
  }

  function drawShelves() {
    const coloring = ui.books.filter((b) => b.kind === 'coloring').length;
    return h('aside', { class: 'bs-shelves', 'aria-label': 'Shelves' },
      h('h2', { class: 'bs-side-title' }, 'Shelves'),
      h('ul', { class: 'bs-shelf-list' },
        shelfRow('all', 'All books', ui.books.length),
        shelfRow('coloring', 'Coloring books', coloring)),
      h('div', { class: 'bs-side-sub' }, 'Your shelves'),
      ui.shelves.length
        ? h('ul', { class: 'bs-shelf-list' }, ui.shelves.map((s) => shelfRow(s.id, s.name,
          s.bookIds.filter((id) => ui.books.some((b) => b.id === id)).length,
          h('span', { class: 'bs-shelf-tools' },
            h('button', { class: 'icon-btn small', title: 'Rename shelf', 'aria-label': `Rename ${s.name}`, 'data-shelf-rename': s.id, onclick: () => renameShelf(s.id) }, '✎'),
            h('button', { class: 'icon-btn small danger', title: 'Delete shelf', 'aria-label': `Delete ${s.name}`, 'data-shelf-delete': s.id, onclick: () => deleteShelf(s.id) }, '×')))))
        : h('p', { class: 'muted bs-side-hint' }, 'Group books into shelves — a series, a class, a gift set.'),
      h('button', { class: 'btn ghost small bs-new-shelf', id: 'bs-new-shelf', onclick: () => createShelf() }, '+ New shelf'));
  }

  function drawMain() {
    const shelf = currentShelf();
    const author = (ui.profile.authorName || '').trim();
    const title = ui.shelf === 'all' ? (author ? `${author}'s bookshelf` : 'Your bookshelf') : ui.shelf === 'coloring' ? 'Coloring books' : shelf?.name || 'Shelf';
    const books = visibleBooks();
    const header = h('header', { class: 'bs-header' },
      h('div', { class: 'bs-title-row' },
        h('h1', {}, title),
        h('span', { class: 'muted bs-count' }, plural(books.length, 'book')),
        h('button', {
          class: 'btn ghost small bs-share', id: 'bs-share', 'aria-expanded': String(ui.showShare),
          onclick: () => { ui.showShare = !ui.showShare; draw(); },
        }, 'Share online')),
      h('div', { class: 'bs-controls' },
        h('input', {
          id: 'bs-search', class: 'bs-search', type: 'search', placeholder: 'Search by title or author', value: ui.query,
          'aria-label': 'Search books', oninput: (e) => { ui.query = e.target.value; draw(); },
        }),
        h('label', { class: 'bs-sort' }, h('span', { class: 'muted' }, 'Sort'),
          h('select', {
            id: 'bs-sort', 'aria-label': 'Sort books',
            onchange: (e) => { ui.sort = e.target.value; localStorage.setItem(SORT_KEY, ui.sort); draw(); },
          }, SORTS.map(([value, label]) => h('option', { value, selected: value === ui.sort }, label))))));
    const share = ui.showShare
      ? h('div', { class: 'bs-unavailable', 'data-unavailable': 'public-bookshelf', role: 'note' },
        h('strong', {}, 'Public bookshelf links aren’t available in Storyloom'),
        h('p', {}, 'Sharing a shelf as a web link needs a Storyloom web service, which doesn’t exist yet. To share a book, open it and export a PDF or an EPUB, then send the file.'),
        h('button', { class: 'btn ghost small', onclick: () => { ui.showShare = false; draw(); } }, 'Got it'))
      : null;
    const hint = ui.sort === 'custom' && books.length > 1 ? h('p', { class: 'muted bs-hint' }, 'Drag books to arrange them, or use Move earlier and Move later in a book’s ⋯ menu.') : null;
    return h('section', { class: 'bs-main' }, header, share, hint, books.length ? drawGrid(books) : drawEmpty());
  }

  function drawEmpty() {
    if (!ui.books.length) {
      return h('div', { class: 'empty bs-empty', 'data-empty': 'no-books' },
        h('h1', {}, 'Your shelf is waiting'),
        h('p', {}, 'Start a picture book and it will live here, ready to open, copy, and arrange.'),
        h('div', { class: 'empty-actions' },
          h('button', { class: 'btn primary large', onclick: () => run(createBlankBook) }, 'New book'),
          h('button', { class: 'btn secondary large', onclick: () => run(() => navigate('home')) }, 'Go to Home')));
    }
    if (ui.query.trim()) {
      return h('div', { class: 'empty bs-empty', 'data-empty': 'no-results' },
        h('h1', {}, 'No matches'),
        h('p', {}, `Nothing here matches “${ui.query.trim()}”.`),
        h('div', { class: 'empty-actions' }, h('button', { class: 'btn ghost', onclick: () => { ui.query = ''; draw(); } }, 'Clear search')));
    }
    return h('div', { class: 'empty bs-empty', 'data-empty': 'empty-shelf' },
      h('h1', {}, 'Nothing on this shelf yet'),
      h('p', {}, ui.shelf === 'coloring'
        ? 'Coloring books you make appear here.'
        : 'Use a book’s ⋯ menu and choose “Add to shelf” to place it here.'),
      h('div', { class: 'empty-actions' }, h('button', { class: 'btn ghost', onclick: () => { ui.shelf = 'all'; draw(); } }, 'Show all books')));
  }

  function drawGrid(books) {
    const grid = h('div', { class: `bs-grid${ui.sort === 'custom' ? ' bs-custom' : ''}`, id: 'bs-grid' }, books.map(card));
    return grid;
  }

  function card(summary) {
    const book = { id: summary.id, title: summary.title, author: summary.author, size: summary.size };
    const el = h('article', {
      class: 'bs-card', 'data-book-id': summary.id,
      oncontextmenu: (e) => { e.preventDefault(); openMenu(summary, { x: e.clientX, y: e.clientY }); },
    },
    h('button', { class: 'bs-open', 'aria-label': `Open ${summary.title}`, onclick: () => { if (Date.now() > suppressClickUntil) run(() => openBook(summary.id)); } },
      h('div', { class: 'bs-cover' }, scaledPage(summary.cover, book, 200, 200),
        summary.kind === 'coloring' ? h('span', { class: 'bs-badge' }, 'Coloring') : null),
      h('h2', { class: 'bs-card-title' }, summary.title || 'Untitled'),
      h('p', { class: 'muted bs-card-meta' }, `${plural(summary.pageCount, 'page')} · ${dateFormat.format(summary.updatedAt)}`)),
    h('button', {
      class: 'bs-more', 'aria-label': `More for ${summary.title}`, 'aria-haspopup': 'menu', title: 'More',
      onclick: (e) => { const r = e.currentTarget.getBoundingClientRect(); openMenu(summary, { x: r.right - 4, y: r.bottom + 4 }, e.currentTarget); },
    }, '⋯'));
    if (ui.sort === 'custom') enableDrag(el);
    return el;
  }

  // ---------- custom order drag ----------
  function enableDrag(el) {
    el.addEventListener('pointerdown', (down) => {
      if (down.button !== 0 || down.target.closest('.bs-more')) return;
      const grid = el.parentElement;
      let dragging = false;
      const move = (e) => {
        if (!dragging) {
          if (Math.hypot(e.clientX - down.clientX, e.clientY - down.clientY) < 6) return;
          dragging = true;
          el.classList.add('bs-dragging');
          el.setPointerCapture?.(down.pointerId);
        }
        const over = document.elementsFromPoint(e.clientX, e.clientY).map((n) => n.closest?.('.bs-card')).find((n) => n && n !== el);
        if (!over || over.parentElement !== grid) return;
        const r = over.getBoundingClientRect();
        const after = e.clientX > r.left + r.width / 2;
        grid.insertBefore(el, after ? over.nextSibling : over);
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        if (!dragging) return;
        el.classList.remove('bs-dragging');
        // Swallow the click that follows the drop.
        suppressClickUntil = Date.now() + 400;
        run(() => persistOrder([...grid.querySelectorAll('.bs-card')].map((c) => c.dataset.bookId)));
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }

  function visibleOrder() {
    return [...document.querySelectorAll('#bs-grid .bs-card')].map((c) => c.dataset.bookId);
  }

  // Moves a book one place earlier (-1) or later (+1) in the custom order, then keeps focus on its ⋯ button.
  async function moveBook(id, delta) {
    const ids = visibleOrder();
    const i = ids.indexOf(id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await persistOrder(ids);
    draw();
    document.querySelector(`#bs-grid .bs-card[data-book-id="${CSS.escape(id)}"] .bs-more`)?.focus();
  }

  async function persistOrder(visibleIds) {
    // Merge the visible arrangement into the full custom order (filtered-out books keep their slots).
    const full = customOrdered(ui.books).map((b) => b.id);
    const visible = new Set(visibleIds);
    let i = 0;
    const bookOrder = full.map((id) => (visible.has(id) ? visibleIds[i++] : id));
    ui.profile = { ...ui.profile, bookOrder };
    const saved = await api.saveProfile({ ...ui.profile, bookOrder });
    if (saved && typeof saved === 'object') ui.profile = { ...ui.profile, ...saved };
  }

  // ---------- book menu ----------
  function closeMenu() {
    menuCleanup?.();
    menuCleanup = null;
    menuEl?.remove();
    menuEl = null;
  }

  function openMenu(summary, at, returnFocus) {
    closeMenu();
    const shelf = currentShelf();
    const act = (fn) => () => { closeMenu(); returnFocus?.focus?.(); run(fn); };
    const shown = visibleOrder();
    const position = shown.indexOf(summary.id);
    const item = (label, action, onclick, extra = {}) => h('button', { class: 'bs-menu-item', role: 'menuitem', 'data-action': action, onclick, ...extra }, label);
    const main = () => [
      item('Open', 'open', act(() => openBook(summary.id))),
      item('Open in Story builder', 'story-builder', act(() => openBook(summary.id, 'story-builder'))),
      item('Rename…', 'rename', act(() => renameBook(summary))),
      item('Duplicate', 'duplicate', act(() => duplicateBook(summary))),
      // The keyboard way to arrange books (dragging needs a pointer).
      ui.sort === 'custom' && position > 0 ? item('Move earlier', 'move-earlier', act(() => moveBook(summary.id, -1))) : null,
      ui.sort === 'custom' && position >= 0 && position < shown.length - 1 ? item('Move later', 'move-later', act(() => moveBook(summary.id, 1))) : null,
      item(h('span', {}, 'Add to shelf'), 'add-to-shelf', () => fill(shelvesPanel()), { 'aria-haspopup': 'menu', 'data-arrow': '▸' }),
      shelf ? item(`Remove from “${shelf.name}”`, 'remove-from-shelf', act(() => toggleShelf(shelf.id, summary.id, false))) : null,
      item('Convert to coloring book', 'convert', act(() => convert(summary))),
      h('hr', { class: 'bs-menu-sep' }),
      item('Move to Trash', 'trash', act(() => trashBook(summary)), { class: 'bs-menu-item danger' }),
    ];
    const shelvesPanel = () => [
      item('‹ Back', 'back', () => fill(main())),
      ...ui.shelves.map((s) => {
        const on = s.bookIds.includes(summary.id);
        return item(h('span', {}, h('span', { class: 'bs-check', 'aria-hidden': 'true' }, on ? '✓' : ''), s.name), 'toggle-shelf',
          act(() => toggleShelf(s.id, summary.id, !on)), { role: 'menuitemcheckbox', 'aria-checked': String(on), 'data-shelf-id': s.id });
      }),
      ui.shelves.length ? h('hr', { class: 'bs-menu-sep' }) : null,
      item('New shelf…', 'new-shelf', act(() => createShelf(summary.id))),
    ];
    menuEl = h('div', { class: 'bs-menu', role: 'menu', 'aria-label': `Actions for ${summary.title}`, 'data-menu-for': summary.id });
    const fill = (items) => {
      menuEl.replaceChildren(...items.filter(Boolean));
      place();
      menuEl.querySelector('.bs-menu-item')?.focus();
    };
    const place = () => {
      const w = menuEl.offsetWidth; const hgt = menuEl.offsetHeight;
      const x = Math.max(8, Math.min(at.x - (returnFocus ? w : 0), window.innerWidth - w - 8));
      const y = Math.max(8, Math.min(at.y, window.innerHeight - hgt - 8));
      menuEl.style.left = `${x}px`;
      menuEl.style.top = `${y}px`;
    };
    document.body.append(menuEl);
    fill(main());
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(); returnFocus?.focus?.(); return; }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const items = [...menuEl.querySelectorAll('.bs-menu-item')];
      const i = items.indexOf(document.activeElement);
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1
        : (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    };
    const onDown = (e) => { if (menuEl && !menuEl.contains(e.target)) closeMenu(); };
    const onBlur = () => closeMenu();
    document.addEventListener('keydown', onKey, true);
    setTimeout(() => document.addEventListener('pointerdown', onDown, true), 0);
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', onBlur);
    menuCleanup = () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onBlur);
    };
  }

  // ---------- actions ----------
  async function refresh() {
    await load();
    draw();
  }

  function promptName(title, { label, value = '', submitLabel }) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => { if (!done) { done = true; resolve(v); } };
      const dialog = modal(title, (close) => {
        const input = h('input', { name: 'name', id: 'bs-name-input', value, maxlength: '200', required: true, autocomplete: 'off' });
        const form = h('form', {
          class: 'form', onsubmit: (e) => {
            e.preventDefault();
            const v = input.value.trim();
            if (!v) return;
            finish(v); close();
          },
        },
        h('label', { class: 'field' }, h('span', { class: 'field-label' }, label), input),
        h('div', { class: 'form-actions' },
          h('button', { type: 'button', class: 'btn ghost', onclick: () => { finish(null); close(); } }, 'Cancel'),
          h('button', { class: 'btn primary', 'data-modal-submit': '' }, submitLabel)));
        return form;
      }, () => finish(null));
      dialog.addEventListener('close', () => finish(null));
      const input = dialog.querySelector('#bs-name-input');
      input.focus();
      input.select();
    });
  }

  async function renameBook(summary) {
    const title = await promptName('Rename book', { label: 'Title', value: summary.title, submitLabel: 'Rename' });
    if (!title || title === summary.title) return;
    await api.renameBook(summary.id, title);
    await refresh();
  }

  async function duplicateBook(summary) {
    const copy = await api.duplicateBook(summary.id, { title: `${summary.title} (copy)` });
    if (ui.shelf !== 'all' && ui.shelf !== 'coloring' && copy?.id) {
      await toggleShelf(ui.shelf, copy.id, true, false);
    }
    await refresh();
    toast(`Made a copy of “${summary.title}”`);
  }

  async function trashBook(summary) {
    if (!(await api.deleteBook(summary.id))) return;
    if (ui.profile.bookOrder?.includes(summary.id)) {
      const bookOrder = ui.profile.bookOrder.filter((id) => id !== summary.id);
      ui.profile = { ...ui.profile, bookOrder };
      await api.saveProfile({ ...ui.profile, bookOrder }).catch(() => {});
    }
    await refresh();
    toast(`Moved “${summary.title}” to the Trash`);
  }

  async function convert(summary) {
    if (typeof window.convertToColoringBook !== 'function') { notBuilt(); return; }
    const newId = await window.convertToColoringBook(summary.id);
    if (newId) await openBook(newId);
    else await refresh();
  }

  async function saveShelves(shelves) {
    const saved = await api.saveShelves(shelves);
    ui.shelves = Array.isArray(saved) ? saved : await api.listShelves();
  }

  async function toggleShelf(shelfId, bookId, on, redraw = true) {
    const shelves = ui.shelves.map((s) => {
      if (s.id !== shelfId) return s;
      const ids = s.bookIds.filter((id) => id !== bookId);
      return { ...s, bookIds: on ? [...ids, bookId] : ids };
    });
    await saveShelves(shelves);
    if (redraw) draw();
  }

  async function createShelf(withBookId) {
    const name = await promptName('New shelf', { label: 'Shelf name', submitLabel: 'Create shelf' });
    if (!name) return;
    const shelf = { id: newId(), name, bookIds: withBookId ? [withBookId] : [], order: ui.shelves.length };
    await saveShelves([...ui.shelves, shelf]);
    if (!withBookId) ui.shelf = shelf.id;
    draw();
    if (withBookId) toast(`Added to “${name}”`);
  }

  async function renameShelf(id) {
    const shelf = ui.shelves.find((s) => s.id === id);
    if (!shelf) return;
    const name = await promptName('Rename shelf', { label: 'Shelf name', value: shelf.name, submitLabel: 'Rename' });
    if (!name || name === shelf.name) return;
    await run(() => saveShelves(ui.shelves.map((s) => (s.id === id ? { ...s, name } : s))));
    draw();
  }

  async function deleteShelf(id) {
    const shelf = ui.shelves.find((s) => s.id === id);
    if (!shelf) return;
    const ok = await confirmDialog(`Delete the shelf “${shelf.name}”?`, {
      title: 'Delete shelf', confirmLabel: 'Delete shelf', danger: true, detail: 'The books on it stay in your library.',
    });
    if (!ok) return;
    await run(() => saveShelves(ui.shelves.filter((s) => s.id !== id)));
    if (ui.shelf === id) ui.shelf = 'all';
    draw();
  }

  registerScreen('bookshelf', { label: 'Bookshelf', scope: 'app', render, leave: closeMenu });
})();
