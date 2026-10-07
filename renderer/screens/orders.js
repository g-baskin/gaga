(() => {
  'use strict';
  // Print orders: not available yet (needs a print partner and payments); guides the user to a print-ready PDF instead.

  async function pickBook() {
    const books = (await run(() => api.listBooks())) || [];
    modal('Choose a book to export', (close) => h('div', { class: 'form' },
      books.length === 0
        ? h('p', { class: 'muted' }, 'You don’t have any books yet. Make one first, then come back here.')
        : h('ul', { class: 'export-book-list' }, books.map((b) => h('li', {},
          h('button', {
            class: 'export-book-pick', 'data-book-id': b.id,
            onclick: () => { close(); run(() => navigate('export', { bookId: b.id })); },
          }, h('strong', {}, b.title), h('span', { class: 'muted' }, ` · ${b.pageCount} ${b.pageCount === 1 ? 'page' : 'pages'}`))))),
      h('div', { class: 'form-actions' }, h('button', { type: 'button', class: 'btn ghost', onclick: close }, 'Cancel'))));
  }

  const CHECKS = [
    ['Page size', 'Pick the size your printer offers (square 8.5 in, portrait 8.5 × 11 in, or landscape 11 × 8.5 in) before you design.'],
    ['Bleed', 'Use “PDF for printing” — it adds 0.125 in on every edge so colour runs past the trim.'],
    ['24 pages or more', 'Most print-on-demand services need at least 24 pages, often in multiples of 2 or 4.'],
    ['300-dpi pictures', 'A full-page picture should be about 2550 × 2550 pixels for crisp printing.'],
  ];

  registerScreen('orders', {
    label: 'Print orders', scope: 'app',
    render(host) {
      host.replaceChildren(h('div', { class: 'export-main' },
        h('header', { class: 'export-head' }, h('h1', {}, 'Print orders')),
        h('div', { class: 'export-unavailable export-unavailable-large', 'data-unavailable': 'print-ordering' },
          h('h2', {}, 'Print ordering isn’t available in Storyloom'),
          h('p', {}, 'Ordering printed copies needs a print partner and payments, which Storyloom doesn’t have yet. You can still get beautiful printed books: export a print-ready PDF and upload it to any print-on-demand service.')),
        h('section', { class: 'export-details' },
          h('h3', {}, 'Before you upload'),
          h('ul', { class: 'export-checklist' }, CHECKS.map(([title, text]) =>
            h('li', {}, h('strong', {}, title), h('span', { class: 'muted' }, text)))),
          h('div', { class: 'form-actions export-start' },
            h('button', { class: 'btn primary', id: 'orders-export', onclick: () => run(pickBook) }, 'Export a print-ready PDF')))));
    },
  });
})();
