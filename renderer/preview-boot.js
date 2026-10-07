/* Browser stand-in for window.storyloom.
   The preview server injects this before core.js. Electron never loads it:
   the desktop app still uses preload.cjs. Books here live in this tab only. */
(() => {
  'use strict';
  document.documentElement.dataset.preview = '1';

  const uid = () => crypto.randomUUID();
  const previewNote = 'This browser preview shows the look of Storyloom. Writing, pictures, and export run in the desktop app.';

  function shape(kind, x, y, w, h, fill) {
    return {
      id: uid(), type: 'shape', shape: kind, x, y, w, h, fill,
      stroke: '#ffffff', strokeWidth: 0, rotation: 0, opacity: 1,
    };
  }

  function page(input = {}) {
    const layout = input.layout || 'text-only';
    return {
      id: input.id || uid(),
      layout,
      text: input.text || '',
      image: input.image || null,
      crop: input.crop || null,
      background: input.background || '#fff7fb',
      color: input.color || '#2c2458',
      font: input.font || 'rounded',
      fontSize: input.fontSize || (layout === 'cover' || layout === 'text-only' ? 40 : 22),
      align: input.align || 'center',
      frame: input.frame || 'none',
      frameColor: input.frameColor || '#2c2458',
      elements: Array.isArray(input.elements) ? input.elements : [],
    };
  }

  function makeBook(input = {}) {
    const now = Date.now();
    const title = String(input.title || 'Untitled story').slice(0, 200);
    const pages = Array.isArray(input.pages) && input.pages.length
      ? input.pages.map((item) => page(item))
      : [page({ layout: 'text-only', text: title, background: '#7c5cff', color: '#fff', elements: [shape('star', 36, 36, 90, 90, '#ffe27a'), shape('cloud', 400, 40, 160, 100, '#ffffff')] })];
    return {
      id: input.id || uid(),
      kind: input.kind === 'coloring' ? 'coloring' : 'story',
      title,
      author: input.author || '',
      size: input.size || 'square',
      isbn: '',
      language: input.language || 'English',
      builder: input.builder || { idea: '', characters: [] },
      manuscript: input.manuscript || { chapters: [] },
      audio: input.audio || { narration: {}, music: null, voice: '' },
      createdAt: input.createdAt || now,
      updatedAt: now,
      pages,
    };
  }

  function story(title, background, ink, elements, blurb, when) {
    return makeBook({
      title,
      author: 'Kelly Bass',
      createdAt: when,
      updatedAt: when,
      builder: { idea: blurb, characters: [] },
      manuscript: {
        chapters: [{ id: uid(), title: 'Chapter 1', blocks: [{ type: 'p', runs: [{ text: blurb }] }] }],
      },
      pages: [
        page({ layout: 'text-only', text: title, background, color: ink, font: 'rounded', fontSize: 36, elements }),
        page({ layout: 'text-only', text: blurb, background: '#fffdf8', color: '#2c2458', font: 'rounded', fontSize: 22, align: 'left' }),
      ],
    });
  }

  const now = Date.now();
  const books = [
    story('Otto and the Low Tide', '#2e6f8e', '#fff8e8', [shape('ellipse', 430, 40, 120, 120, '#ffd27a'), shape('rounded', 40, 480, 520, 70, '#9fd3e0')], 'An otter has one evening to find his way back before the sea returns.', now - 1000),
    story('The Button Jar Kingdom', '#c8553d', '#fff8e8', [shape('ellipse', 60, 50, 90, 90, '#f2c14e'), shape('ellipse', 440, 440, 110, 110, '#88b04b')], 'Every button in Grandma’s jar was once a crown.', now - 2000),
    story('Mabel Plants a Moon', '#3d4a6b', '#f6eedc', [shape('ellipse', 400, 40, 130, 130, '#f6eedc'), shape('star', 60, 470, 80, 80, '#f2c14e')], 'A girl plants a silver seed and waits all winter.', now - 3000),
    story('Pip’s Paper Boat', '#f2c14e', '#3d2a14', [shape('triangle', 60, 420, 140, 120, '#c8553d'), shape('cloud', 380, 40, 170, 100, '#fff8e8')], 'A boat folded from a spelling test sails the whole gutter river.', now - 4000),
    story('Ten Snails to Supper', '#88b04b', '#24331a', [shape('ellipse', 40, 40, 100, 100, '#f6eedc'), shape('ellipse', 450, 450, 90, 90, '#c8553d')], 'A counting book where nobody is in a hurry.', now - 5000),
    story('The Quiet Lighthouse', '#26304a', '#f6eedc', [shape('star', 60, 50, 80, 80, '#f2c14e'), shape('star', 460, 420, 90, 90, '#f6eedc')], 'The lighthouse keeper’s cat keeps the light on alone.', now - 6000),
  ];

  let shelves = [{ id: uid(), name: 'Bedtime', bookIds: books.slice(0, 2).map((book) => book.id), order: 0 }];
  let characters = [];
  let profile = { authorName: 'Kelly Bass', bookOrder: books.map((book) => book.id) };
  let settings = {
    baseUrl: '', model: '', imageModel: '', speechModel: '', voice: '', hasKey: false,
    writer: 'custom', pictures: 'custom', voices: 'custom', tier: 'balanced', hasOpenrouterKey: false,
    orTextModel: '', orImageModel: '', orSpeechModel: '',
    chatgptModel: '', claudeModel: '', claudePath: '',
  };
  let onClose = () => {};
  let onMenu = () => {};

  const summary = (book) => ({
    id: book.id, kind: book.kind, title: book.title, author: book.author, size: book.size,
    createdAt: book.createdAt, updatedAt: book.updatedAt, pageCount: book.pages.length, cover: book.pages[0],
  });
  const must = (id) => {
    const book = books.find((item) => item.id === id);
    if (!book) throw new Error('That book is not in this preview');
    return book;
  };

  const ok = (value) => Promise.resolve(value);
  const unsupported = () => Promise.reject(new Error(previewNote));

  window.storyloom = {
    listBooks: () => ok(books.map(summary)),
    createBook: (input) => {
      const book = makeBook(input);
      books.unshift(book);
      return ok(structuredClone(book));
    },
    readBook: (id) => ok(structuredClone(must(id))),
    saveBook: (input) => {
      const book = must(input.id);
      Object.assign(book, input, { updatedAt: Date.now() });
      return ok(structuredClone(book));
    },
    renameBook: (id, title) => {
      const book = must(id);
      book.title = String(title || 'Untitled story').slice(0, 200);
      book.updatedAt = Date.now();
      return ok(structuredClone(book));
    },
    duplicateBook: (id) => {
      const book = structuredClone(must(id));
      book.id = uid();
      book.title = `${book.title} copy`;
      book.createdAt = Date.now();
      book.updatedAt = book.createdAt;
      books.unshift(book);
      return ok(structuredClone(book));
    },
    deleteBook: (id) => {
      const index = books.findIndex((book) => book.id === id);
      if (index >= 0) books.splice(index, 1);
      return ok(true);
    },
    importImage: () => ok(null),
    listImages: () => ok([]),
    saveImage: () => unsupported(),
    importAudio: () => ok(null),
    listAudio: () => ok([]),
    saveRecording: () => unsupported(),
    importStoryText: () => new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.txt,.md,.markdown,text/plain';
      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (!file) { resolve(null); return; }
        file.text().then((text) => resolve({ name: file.name, text })).catch(() => resolve(null));
      });
      input.click();
    }),
    listShelves: () => ok(structuredClone(shelves)),
    saveShelves: (next) => { shelves = Array.isArray(next) ? structuredClone(next) : []; return ok(structuredClone(shelves)); },
    listCharacters: () => ok(structuredClone(characters)),
    saveCharacter: (character) => {
      const saved = { ...character, id: character.id || uid() };
      const index = characters.findIndex((item) => item.id === saved.id);
      if (index >= 0) characters[index] = saved;
      else characters.push(saved);
      return ok(structuredClone(saved));
    },
    deleteCharacter: (id) => { characters = characters.filter((item) => item.id !== id); return ok(true); },
    insertCharacter: (_bookId, characterId) => ok(structuredClone(characters.find((item) => item.id === characterId) || null)),
    getProfile: () => ok(structuredClone(profile)),
    saveProfile: (input) => { profile = { ...profile, ...input }; return ok(structuredClone(profile)); },
    exportPdf: unsupported,
    exportEpub: unsupported,
    exportWav: unsupported,
    revealExport: unsupported,
    openDataFolder: unsupported,
    appInfo: () => ok({ version: 'preview', dataFolder: 'This browser tab (preview only)' }),
    getSettings: () => ok(structuredClone(settings)),
    saveSettings: (input) => { settings = { ...settings, ...input, hasKey: settings.hasKey }; return ok(structuredClone(settings)); },
    generateStory: unsupported,
    generateChapter: unsupported,
    generateImage: unsupported,
    generateSpeech: unsupported,
    aiRecommendations: () => ok([]),
    chatGptStatus: () => ok({ signedIn: false, planEnabled: false, email: '', signingIn: false }),
    chatGptSignIn: unsupported,
    chatGptCancel: () => ok(null),
    chatGptWelcomed: () => ok(null),
    chatGptSignOut: () => ok({ revoked: false }),
    chatGptModels: () => ok([]),
    claudeStatus: () => ok({ installed: false, signedIn: false, method: '', version: '', message: previewNote }),
    openLink: () => ok(null),
    onBeforeClose: (fn) => { onClose = fn; },
    onMenuAction: (fn) => { onMenu = fn; },
    closeReady: () => {}, // nothing to flush in a browser tab
  };
})();
