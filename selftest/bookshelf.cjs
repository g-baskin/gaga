'use strict';
// Bookshelf: search, sort, shelves, book menu (rename, duplicate, add to shelf, trash), coloring filter, custom order drag.

module.exports = async function bookshelf(ctx) {
  const { js, store, pause } = ctx;
  const checks = {};
  const a = await store.create({ title: 'Apple Orchard Adventure', author: 'Mira Holt' });
  const z = await store.create({ title: 'Zebra Sleeps Tonight', author: 'Ola Penn' });
  const c = await store.create({ title: 'Moon Garden Colors', kind: 'coloring' });
  const ours = new Set([a.id, z.id, c.id]);

  await ctx.navigate('bookshelf');
  await ctx.assertNoMissing();
  const titles = () => js(`[...document.querySelectorAll('.bs-card .bs-card-title')].map((e) => e.textContent)`);
  const ids = () => js(`[...document.querySelectorAll('.bs-card')].map((e) => e.dataset.bookId)`);
  const mine = async () => (await ids()).filter((id) => ours.has(id));
  const select = (value) => js(`(() => { const s = $must('#bs-sort'); s.value = ${JSON.stringify(value)}; s.dispatchEvent(new Event('change', { bubbles: true })); return $settle(); })()`);
  const openMenuFor = async (id) => { await ctx.click(`.bs-card[data-book-id="${id}"] .bs-more`); await ctx.waitFor('.bs-menu'); };
  const countBooks = async () => (await store.list()).length;
  checks.cardsShown = (await ids()).length >= 3;
  checks.coloringBadge = await js(`!!document.querySelector('.bs-card[data-book-id="${c.id}"] .bs-badge')`);

  // Live search by title, then by author.
  await ctx.click('#bs-search');
  await ctx.type('zebra');
  await js('$settle()');
  checks.searchFilters = JSON.stringify(await ids()) === JSON.stringify([z.id]);
  await js(`(() => { const s = $must('#bs-search'); s.value = 'holt'; s.dispatchEvent(new Event('input', { bubbles: true })); return $settle(); })()`);
  checks.searchByAuthor = JSON.stringify(await ids()) === JSON.stringify([a.id]);
  await js(`(() => { const s = $must('#bs-search'); s.value = 'nothing-like-this'; s.dispatchEvent(new Event('input', { bubbles: true })); return $settle(); })()`);
  checks.noResultsEmpty = await js(`!!document.querySelector('[data-empty="no-results"]')`);
  await js(`(() => { const s = $must('#bs-search'); s.value = ''; s.dispatchEvent(new Event('input', { bubbles: true })); return $settle(); })()`);

  // Sorting.
  await select('az');
  const az = await titles();
  checks.sortAZ = JSON.stringify(az) === JSON.stringify([...az].sort((x, y) => x.localeCompare(y))) && az[0] === 'Apple Orchard Adventure';
  await select('za');
  const za = await titles();
  checks.sortZA = za[0] === 'Zebra Sleeps Tonight' && JSON.stringify(za) === JSON.stringify([...az].reverse());

  // Share online shows the not-available card.
  await ctx.click('#bs-share');
  checks.shareUnavailable = await js(`!!document.querySelector('[data-unavailable="public-bookshelf"]')`);
  await ctx.click('#bs-share');

  // Create a shelf through the UI.
  await ctx.click('#bs-new-shelf');
  await ctx.waitFor('dialog[open] #bs-name-input');
  await ctx.type('Bedtime');
  await ctx.click('dialog[open] [data-modal-submit]');
  await pause(150);
  const shelf = (await store.listShelves()).find((s) => s.name === 'Bedtime');
  checks.shelfCreated = !!shelf;
  checks.emptyShelfState = await js(`!!document.querySelector('[data-empty="empty-shelf"]')`);
  await ctx.click('.bs-shelf[data-shelf="all"] .bs-shelf-btn');

  // Add Zebra to the shelf via the ⋯ menu.
  await openMenuFor(z.id);
  checks.menuInWindow = await js(`(() => { const r = $must('.bs-menu').getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; })()`);
  await ctx.click('.bs-menu [data-action="add-to-shelf"]');
  await ctx.click(`.bs-menu [data-shelf-id="${shelf.id}"]`);
  await pause(150);
  checks.addedToShelf = (await store.listShelves()).find((s) => s.id === shelf.id).bookIds.includes(z.id);
  await ctx.click(`.bs-shelf[data-shelf="${shelf.id}"] .bs-shelf-btn`);
  checks.shelfFilters = JSON.stringify(await ids()) === JSON.stringify([z.id]);
  checks.shelfCount = await js(`$must('.bs-shelf[data-shelf="${shelf.id}"] .bs-shelf-count').textContent === '1'`);

  // Escape closes the menu.
  await openMenuFor(z.id);
  await ctx.key('Escape');
  checks.escapeCloses = await js(`!document.querySelector('.bs-menu')`);

  // Rename via the menu.
  await openMenuFor(z.id);
  await ctx.click('.bs-menu [data-action="rename"]');
  await ctx.waitFor('dialog[open] #bs-name-input');
  await js(`$must('#bs-name-input').select(); true`);
  await ctx.type('Zebra Dreams');
  await ctx.click('dialog[open] [data-modal-submit]');
  await pause(200);
  checks.renamed = (await store.read(z.id)).title === 'Zebra Dreams';
  checks.renamedOnCard = (await titles()).includes('Zebra Dreams');

  // Back to all books; duplicate Apple via right-click.
  await ctx.click('.bs-shelf[data-shelf="all"] .bs-shelf-btn');
  const before = await countBooks();
  await ctx.click(`.bs-card[data-book-id="${a.id}"] .bs-cover`, { button: 'right' });
  await ctx.waitFor('.bs-menu');
  await ctx.click('.bs-menu [data-action="duplicate"]');
  await pause(300);
  const afterDup = await store.list();
  checks.duplicated = afterDup.length === before + 1 && afterDup.some((b) => b.title === 'Apple Orchard Adventure (copy)');
  const copy = afterDup.find((b) => b.title === 'Apple Orchard Adventure (copy)');
  if (copy) ours.add(copy.id);

  // Coloring filter.
  await ctx.click('.bs-shelf[data-shelf="coloring"] .bs-shelf-btn');
  checks.coloringFilter = JSON.stringify(await ids()) === JSON.stringify([c.id]);
  await ctx.click('.bs-shelf[data-shelf="all"] .bs-shelf-btn');

  // Custom order: drag the last card before the first.
  await select('custom');
  const startOrder = await mine();
  const last = startOrder[startOrder.length - 1];
  const from = await ctx.centerOf(`.bs-card[data-book-id="${last}"] .bs-cover`);
  const toBox = await js(`(() => { const r = $must('.bs-card[data-book-id="${startOrder[0]}"] .bs-cover').getBoundingClientRect(); return { x: Math.round(r.left + 15), y: Math.round(r.top + r.height / 2) }; })()`);
  await ctx.drag(from, toBox, 14);
  await pause(300);
  const newOrder = await mine();
  checks.dragReordered = newOrder[0] === last;
  checks.stillOnShelf = await js(`window.__storyloom.current() === 'bookshelf'`);
  const saved = (await store.getProfile()).bookOrder.filter((id) => ours.has(id));
  checks.orderPersisted = JSON.stringify(saved) === JSON.stringify(newOrder);
  await ctx.navigate('bookshelf');
  checks.orderSurvivesReload = JSON.stringify(await mine()) === JSON.stringify(newOrder);

  // Keyboard alternative to dragging: Move later / Move earlier in the book menu.
  const beforeMove = await ids();
  const first = beforeMove[0];
  await openMenuFor(first);
  checks.noMoveEarlierForFirst = !(await js(`!!document.querySelector('.bs-menu [data-action="move-earlier"]')`));
  await ctx.click('.bs-menu [data-action="move-later"]');
  await pause(300);
  const movedLater = await ids();
  checks.movedLater = movedLater[1] === first && movedLater[0] === beforeMove[1];
  checks.moveFocusKept = await js(`document.activeElement?.closest('.bs-card')?.dataset.bookId === ${JSON.stringify(first)}`);
  await openMenuFor(first);
  await ctx.click('.bs-menu [data-action="move-earlier"]');
  await pause(300);
  checks.movedBack = JSON.stringify(await ids()) === JSON.stringify(beforeMove);
  const savedAfterMove = (await store.getProfile()).bookOrder.filter((id) => ours.has(id));
  checks.moveOrderPersisted = JSON.stringify(savedAfterMove) === JSON.stringify(newOrder);
  // Focus is visible: menu items and text fields keep the shared ring.
  checks.focusRingKept = await js(`(() => {
    const ok = (sel) => !Array.from(document.styleSheets).some((sheet) => { try { return Array.from(sheet.cssRules).some((r) => r.selectorText && r.selectorText.includes(sel) && /:focus/.test(r.selectorText) && r.style.outline === 'none'); } catch { return false; } });
    return ['.bs-menu-item', '.bs-search', 'textarea', '.home-prompt', '.title-input', '.templates-search', '.ai-key-input', '.ms-book-title'].every(ok);
  })()`);

  await ctx.screenshot();

  // Move the copy to the Trash.
  const beforeTrash = await countBooks();
  await openMenuFor(copy.id);
  await ctx.click('.bs-menu [data-action="trash"]');
  await pause(300);
  checks.trashed = (await countBooks()) === beforeTrash - 1 && !(await ids()).includes(copy.id);

  // Delete the shelf; books stay.
  await ctx.click(`.bs-shelf[data-shelf="${shelf.id}"] .bs-shelf-btn`);
  await ctx.click(`[data-shelf-delete="${shelf.id}"]`);
  await ctx.confirm('ok');
  await pause(200);
  checks.shelfDeleted = !(await store.listShelves()).some((s) => s.id === shelf.id);
  checks.booksKept = !!(await store.read(z.id));
  checks.backToAll = await js(`!!document.querySelector('.bs-shelf[data-shelf="all"].active')`);

  await select('recent');

  // A library that can't be read shows an error with Try again, not a blank screen or "no books".
  const booksDir = require('node:path').join(ctx.userData, 'books');
  const fsp = require('node:fs/promises');
  await fsp.chmod(booksDir, 0o000);
  try {
    await ctx.navigate('bookshelf');
    checks.loadErrorShown = await js(`!!document.querySelector('#screen [data-load-error] [data-retry]') && !document.querySelector('.screen-loading')`);
    await ctx.navigate('home');
    checks.homeLoadErrorShown = await js(`!!document.querySelector('#home-recent-error') && !document.querySelector('#home-recent-empty')`);
    await ctx.navigate('bookshelf');
  } finally {
    await fsp.chmod(booksDir, 0o755);
  }
  // Once the library is readable again, Try again brings the books back.
  await ctx.click('#screen [data-retry]');
  await ctx.waitFor('.bs-card');
  checks.retryRecovers = await js(`!document.querySelector('[data-load-error]') && document.querySelectorAll('.bs-card').length > 0`);
  return checks;
};
