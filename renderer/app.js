'use strict';
// App shell: state, saving, navigation between screens, shared dialogs. Loaded after core.js and editor.js.
// Screens live in renderer/screens/*.js (listed after this file in index.html) and call registerScreen().
// The app starts on DOMContentLoaded, after every deferred script has run.

const state = {
  view: 'home', screen: null, params: {}, books: [], book: null, pageIndex: 0,
  settings: { baseUrl: '', model: '', imageModel: '', speechModel: '', hasKey: false },
};
const root = document.getElementById('app');

// ---------- saving ----------
let saveTimer = null;
let saveChain = Promise.resolve();
let pendingSave = false;
function setStatus(text) {
  const el = document.getElementById('save-status');
  if (el) el.textContent = text;
}
function scheduleSave() {
  pendingSave = true;
  setStatus('Editing…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 500);
}
function saveNow() {
  clearTimeout(saveTimer);
  if (!pendingSave || !state.book) return saveChain;
  pendingSave = false;
  const snapshot = structuredClone(state.book);
  setStatus('Saving…');
  saveChain = saveChain
    .then(() => api.saveBook(snapshot))
    .then(() => { if (!pendingSave) setStatus('All changes saved'); },
      (error) => { pendingSave = true; setStatus('Not saved'); toast(cleanError(error)); });
  return saveChain;
}
api.onBeforeClose(async () => {
  try {
    if (state.screen === 'designer') stopEditing();
    await saveNow();
  } finally {
    api.closeReady();
  }
});

// ---------- screens and navigation ----------
const screens = new Map();
const APP_NAV = [
  ['home', 'Home', '⌂'], ['bookshelf', 'Bookshelf', '▥'], ['templates', 'Templates', '❖'],
  ['coloring', 'Coloring', '✎'], ['orders', 'Print orders', '⎙'], ['account', 'Account', '◉'],
];
const BOOK_TABS = [
  ['story-builder', 'Story builder'], ['manuscript', 'Manuscript'], ['designer', 'Designer'], ['studio', 'Studio'], ['export', 'Export'],
];
const SCREEN_SCOPE = Object.fromEntries([...APP_NAV.map(([n]) => [n, 'app']), ...BOOK_TABS.map(([n]) => [n, 'book'])]);
const NOT_BUILT = 'This part of Storyloom isn’t built yet.';

// def: { label?, scope?: 'app' | 'book', render(root, params), leave?() }
function registerScreen(name, def) {
  if (typeof name !== 'string' || !def || typeof def.render !== 'function') throw new Error('registerScreen needs a name and a render function');
  screens.set(name, { label: def.label || name, scope: def.scope || SCREEN_SCOPE[name] || 'app', render: def.render, leave: def.leave });
  // A screen that registers late (or is replaced) shows up immediately if it is the one on display.
  if (state.screen === name && document.getElementById('screen')) navigate(name, state.params);
}
const screenScope = (name) => screens.get(name)?.scope || SCREEN_SCOPE[name] || (state.book ? 'book' : 'app');

let navSeq = 0;
// Shows a screen. params.bookId opens that book first (book screens need an open book).
async function navigate(name, params = {}) {
  const seq = ++navSeq;
  const previous = screens.get(state.screen);
  if (state.screen === 'designer') stopEditing();
  try { previous?.leave?.(); } catch (error) { console.error(error); }
  await saveNow();
  if (params.bookId && params.bookId !== state.book?.id) {
    state.book = await api.readBook(params.bookId);
    resetDesigner();
  }
  let scope = screenScope(name);
  if (scope === 'book' && !state.book) {
    toast('Open a book first');
    name = 'bookshelf';
    scope = 'app';
  }
  if (scope === 'app') state.book = null;
  if (seq !== navSeq) return; // A newer navigation started meanwhile.
  state.screen = name;
  state.view = name === 'designer' ? 'editor' : name;
  state.params = params;
  renderShell(scope, name);
  const host = document.getElementById('screen');
  const def = screens.get(name);
  if (!def) {
    host.replaceChildren(h('section', { class: 'screen-missing', 'data-missing-screen': name }, NOT_BUILT));
    return;
  }
  try {
    await def.render(host, params);
  } catch (error) {
    console.error(error);
    toast(cleanError(error));
  }
}

function renderShell(scope, name) {
  const host = h('main', { class: `screen-host screen-${name}`, id: 'screen', 'data-screen': name });
  if (scope === 'book') {
    const { book } = state;
    const bar = h('header', { class: 'topbar book-bar' },
      h('button', { class: 'btn ghost', id: 'back-to-shelf', onclick: () => run(() => navigate('bookshelf')) }, '← Bookshelf'),
      h('div', { class: 'title-fields' },
        h('input', {
          id: 'book-title', class: 'title-input', value: book.title, 'aria-label': 'Book title', maxlength: '200',
          oninput: (e) => { onBookMetaInput('title', e.target.value); },
        }),
        h('input', {
          id: 'book-author', class: 'author-input', value: book.author, placeholder: 'Author name', 'aria-label': 'Author', maxlength: '200',
          oninput: (e) => { onBookMetaInput('author', e.target.value); },
        })),
      h('nav', { class: 'book-tabs', 'aria-label': 'Book sections' }, BOOK_TABS.map(([tab, label]) =>
        h('button', {
          class: `book-tab${tab === name ? ' active' : ''}`, 'data-tab': tab, 'aria-current': tab === name ? 'page' : null,
          onclick: () => run(() => navigate(tab)),
        }, label))),
      h('span', { id: 'save-status', class: 'muted save-status' }, pendingSave ? 'Editing…' : 'All changes saved'));
    root.replaceChildren(bar, host);
  } else {
    const nav = h('nav', { class: 'app-nav', 'aria-label': 'Storyloom' },
      h('div', { class: 'brand' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }), 'Storyloom'),
      h('button', { class: 'btn primary block', id: 'new-book', onclick: () => run(createBlankBook) }, '+ New book'),
      h('div', { class: 'app-nav-list' }, APP_NAV.map(([item, label, icon]) =>
        h('button', {
          class: `app-nav-item${item === name ? ' active' : ''}`, 'data-nav': item, 'aria-current': item === name ? 'page' : null,
          onclick: () => run(() => navigate(item)),
        }, h('span', { class: 'app-nav-icon', 'aria-hidden': 'true' }, icon), label))));
    root.replaceChildren(h('div', { class: 'app-shell' }, nav, host));
  }
}

// Title/author live in the book bar on every book screen.
function onBookMetaInput(key, value) {
  if (!state.book) return;
  if (state.screen === 'designer') checkpoint(key);
  state.book[key] = value;
  if (state.screen === 'designer') refreshPage();
  document.dispatchEvent(new CustomEvent('storyloom:book-meta', { detail: { key } }));
  scheduleSave();
}
function syncBookBar() {
  for (const [id, key] of [['book-title', 'title'], ['book-author', 'author']]) {
    const input = document.getElementById(id);
    if (input && state.book && input.value !== state.book[key] && document.activeElement !== input) input.value = state.book[key];
  }
}

// Opens a book on one of its screens (the designer by default).
async function openBook(id, screen = 'designer') {
  await navigate(screen, { bookId: id });
}

async function createBlankBook() {
  const profile = await api.getProfile().catch(() => ({ authorName: '' }));
  const book = await api.createBook({ title: 'Untitled story', author: profile.authorName || '', pages: [{ layout: 'cover', text: '', fontSize: 48 }] });
  await openBook(book.id);
}

window.__storyloom = { screens: () => [...screens.keys()], current: () => state.screen };

// ---------- dialogs ----------
function modal(title, body, onClose) {
  const close = () => { dialog.close(); dialog.remove(); onClose?.(); };
  const dialog = h('dialog', { class: 'modal', onclose: () => dialog.remove() },
    h('header', {}, h('h2', {}, title), h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: close }, '×')),
    body(close));
  document.body.append(dialog);
  dialog.showModal();
  return dialog;
}

// In-app yes/no question. Resolves true only when the confirm button is pressed.
function confirmDialog(message, { title = 'Are you sure?', confirmLabel = 'Continue', danger = false, detail = '' } = {}) {
  return new Promise((resolve) => {
    let answered = false;
    const finish = (value) => { if (!answered) { answered = true; resolve(value); } };
    modal(title, (close) => h('div', { class: 'form confirm-dialog' },
      h('p', {}, message),
      detail ? h('p', { class: 'muted small-print' }, detail) : null,
      h('div', { class: 'form-actions' },
        h('button', { type: 'button', class: 'btn ghost', 'data-confirm': 'cancel', onclick: () => { finish(false); close(); } }, 'Cancel'),
        h('button', { type: 'button', class: `btn ${danger ? 'danger-fill' : 'primary'}`, 'data-confirm': 'ok', onclick: () => { finish(true); close(); } }, confirmLabel))),
    () => finish(false));
  });
}

const notBuilt = () => toast(NOT_BUILT);

// AI service settings live on the Account screen.
function openAiSettings() {
  return run(() => navigate('account'));
}

// A small line naming the service that will write, e.g. "Writing with your ChatGPT plan · Manage usage".
// OpenAI asks apps to show "Using ChatGPT plan" near where AI is used, with a Manage usage link.
const WRITER_LABEL = {
  claude: 'Writing with your Claude plan (Claude Code)',
  chatgpt: 'Using ChatGPT plan',
  openrouter: 'Writing with OpenRouter',
  custom: 'Writing with your own AI service',
};
function aiWriterNote(extra = '') {
  const note = h('span', { class: 'muted small-print ai-writer-note' }, 'AI writing uses the service in Settings.', extra ? ` ${extra}` : '');
  api.getSettings().then((s) => {
    state.settings = s;
    const label = WRITER_LABEL[s.writer];
    if (!label) return;
    note.replaceChildren(label, ' · ',
      s.writer === 'chatgpt'
        ? h('button', { type: 'button', class: 'link-btn', onclick: () => api.openLink('chatgpt-usage') }, 'Manage usage')
        : h('button', { type: 'button', class: 'link-btn', onclick: () => openAiSettings() }, 'Change'),
      extra ? `. ${extra}` : '');
  }, () => {});
  return note;
}

// ---------- the designer is a book screen ----------
registerScreen('designer', { label: 'Designer', scope: 'book', render: () => renderEditor() });

// Deferred scripts (including every screen) have all run by DOMContentLoaded.
document.addEventListener('DOMContentLoaded', () => {
  run(() => navigate('home'));
});
