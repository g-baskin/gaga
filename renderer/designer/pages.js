'use strict';
// The Designer's page operations: thumbnails, adding, duplicating, deleting, and moving pages, and printing to PDF.
// Part of the Designer (renderer/editor.js); loaded before it by index.html, sharing its top-level names.

// ---------- page-level operations ----------
function refreshThumb() {
  const thumb = document.querySelectorAll('#page-list .thumb')[state.pageIndex];
  thumb?.firstChild.replaceWith(scaledPage(currentPage(), state.book, 190, 150));
}
// Tells the author when the page's words were shrunk to fit, or still don't fit.
function updateFitNote() {
  const note = document.getElementById('page-fit-note');
  const page = currentPage();
  if (!note || !page || page.layout === 'blank') return;
  const fit = fitPageText(page, state.book);
  note.classList.toggle('warn', !fit.fits);
  note.textContent = !fit.fits
    ? `These words don’t fit the page, even at ${fit.size} pt. Shorten them, or pick the Text only layout for more room.`
    : fit.shrunk ? `Shrunk to ${fit.size} pt so all the words fit.` : '';
}
function refreshPage() {
  renderCanvas();
  refreshThumb();
  updateHistoryButtons();
}
function goToPage(index) {
  stopEditing();
  state.pageIndex = index;
  editor.selected = null;
  renderEditor();
}
function blankPage(previous) {
  return {
    id: newId(), layout: 'image-top', text: '', image: null, background: previous.background, color: previous.color,
    font: previous.font, fontSize: previous.layout === 'cover' ? 24 : previous.fontSize, align: previous.align,
    frame: previous.frame, frameColor: previous.frameColor, elements: [],
  };
}
function addPage() {
  checkpoint();
  state.book.pages.splice(state.pageIndex + 1, 0, blankPage(currentPage()));
  state.pageIndex += 1;
  editor.selected = null;
  renderEditor();
  scheduleSave();
  document.getElementById('page-text')?.focus();
}
function duplicatePage() {
  checkpoint();
  const copy = structuredClone(currentPage());
  copy.id = newId();
  copy.elements = copy.elements.map((el) => ({ ...el, id: newId() }));
  state.book.pages.splice(state.pageIndex + 1, 0, copy);
  state.pageIndex += 1;
  editor.selected = null;
  renderEditor();
  scheduleSave();
}
function deletePage() {
  if (state.book.pages.length === 1) return;
  checkpoint();
  state.book.pages.splice(state.pageIndex, 1);
  state.pageIndex = Math.min(state.pageIndex, state.book.pages.length - 1);
  editor.selected = null;
  renderEditor();
  scheduleSave();
}
function movePage(offset) {
  const target = state.pageIndex + offset;
  if (target < 0 || target >= state.book.pages.length) return;
  checkpoint();
  const [page] = state.book.pages.splice(state.pageIndex, 1);
  state.book.pages.splice(target, 0, page);
  state.pageIndex = target;
  renderEditor();
  scheduleSave();
}
async function choosePagePicture() {
  const page = currentPage();
  const name = await api.importImage(state.book.id);
  if (!name) return;
  checkpoint();
  page.image = name;
  page.imagePrompt = '';
  refreshPage();
  renderInspector();
  scheduleSave();
}

// Prints the open book to PDF. mode: 'digital' | 'print' (print adds trim bleed).
async function exportPdf({ mode = 'digital' } = {}) {
  if (state.screen === 'designer') stopEditing();
  await saveNow();
  // Fonts first: pages measure their words to fit, and that needs the real fonts.
  await loadFonts(bookFontKeys(state.book));
  const printRoot = document.getElementById('print-root');
  printRoot.className = mode === 'print' ? 'print-bleed' : '';
  printRoot.replaceChildren(...state.book.pages.map((page) => {
    const sheet = renderPage(page, state.book, { print: true });
    if (mode !== 'print') return sheet;
    // Print services trim 0.125 in from every edge, so the page colour runs out past the trim line.
    sheet.classList.remove('print-page');
    return h('div', { class: `print-page bleed-sheet size-${state.book.size}-bleed`, style: { backgroundColor: page.background } }, sheet);
  }));
  await Promise.all([...printRoot.querySelectorAll('img')].map((img) => img.decode().catch(() => {})));
  try {
    const name = await api.exportPdf({ title: state.book.title, size: state.book.size, mode });
    if (name) toast(`Exported “${name}”`, { label: 'Show in Finder', run: () => api.revealExport() });
  } finally {
    printRoot.replaceChildren();
    printRoot.className = '';
  }
}
