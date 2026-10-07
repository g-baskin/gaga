(() => {
  'use strict';
  // Home: start a story from an idea, import a manuscript, jump back into recent books.

  const IDEAS = [
    'A lighthouse keeper’s cat who is afraid of the dark',
    'Two snails racing to the end of the garden before winter',
    'A cloud that wants to be a mountain',
    'A grandmother who knits maps that come to life',
    'The night the town’s streetlights went on holiday',
    'A little tugboat that guides a lost whale home',
    'A kid who finds a door inside the library’s oldest book',
    'A dragon who opens a bakery but can’t stop toasting the bread',
    'A pebble’s long journey from the mountains to the sea',
  ];

  // ---------- plain text → manuscript ----------
  const block = (type, text) => ({ type, runs: [{ text }] });

  function textToBlocks(text) {
    const blocks = [];
    for (const para of text.split(/\n\s*\n/)) {
      const lines = para.split('\n').map((l) => l.trim()).filter(Boolean);
      if (!lines.length) continue;
      let buffer = [];
      const flush = () => { if (buffer.length) blocks.push(block('p', buffer.join(' '))); buffer = []; };
      for (const line of lines) {
        let m;
        if ((m = /^[-*]\s+(.*)$/.exec(line))) { flush(); blocks.push(block('li', m[1])); }
        else if ((m = /^>\s?(.*)$/.exec(line))) { flush(); blocks.push(block('quote', m[1])); }
        else if ((m = /^###\s+(.*)$/.exec(line))) { flush(); blocks.push(block('h3', m[1])); }
        else buffer.push(line);
      }
      flush();
    }
    return blocks;
  }

  function splitStory(raw) {
    const text = String(raw || '').replace(/\r\n?/g, '\n');
    const chapters = [];
    const lines = text.split('\n');
    if (lines.some((l) => /^#{1,2}\s+\S/.test(l))) {
      let current = null;
      let intro = [];
      for (const line of lines) {
        const m = /^#{1,2}\s+(.*)$/.exec(line);
        if (m) { current = { title: m[1].trim(), lines: [] }; chapters.push(current); }
        else if (current) current.lines.push(line);
        else intro.push(line);
      }
      if (intro.join('').trim()) chapters.unshift({ title: 'Opening', lines: intro });
      return chapters.map((c) => ({ id: newId(), title: c.title, blocks: textToBlocks(c.lines.join('\n')) }));
    }
    const parts = text.split(/\n\s*\n\s*\n+/).filter((p) => p.trim());
    if (parts.length > 1) return parts.map((p, i) => ({ id: newId(), title: `Chapter ${i + 1}`, blocks: textToBlocks(p) }));
    return [{ id: newId(), title: 'Chapter 1', blocks: textToBlocks(text) }];
  }

  async function importStory() {
    const file = await api.importStoryText();
    if (!file) return;
    const chapters = splitStory(file.text);
    const profile = await api.getProfile().catch(() => ({ authorName: '' }));
    const title = String(file.name || 'Imported story').replace(/\.(txt|md|markdown)$/i, '') || 'Imported story';
    const book = await api.createBook({ title, author: profile.authorName || '', manuscript: { chapters } });
    await openBook(book.id, 'manuscript');
  }

  // ---------- hero ----------
  function hero() {
    const prompt = h('textarea', {
      id: 'home-prompt', class: 'home-prompt', rows: '3', maxlength: '2000',
      placeholder: 'A shy hedgehog who learns to sing at the forest festival…', 'aria-label': 'What’s your story about?',
    });
    const star = h('input', { id: 'home-star', class: 'home-star', maxlength: '80', placeholder: 'e.g. Maya', 'aria-label': 'Star of the story' });
    const error = h('p', { class: 'home-error', id: 'home-error', role: 'alert', hidden: true }, 'Tell us a little about your story first.');
    prompt.addEventListener('input', () => { error.hidden = true; });

    const start = async () => {
      const idea = prompt.value.trim();
      if (!idea) { error.hidden = false; prompt.focus(); return; }
      const name = star.value.trim();
      const profile = await api.getProfile().catch(() => ({ authorName: '' }));
      const book = await api.createBook({
        title: 'Untitled story', author: profile.authorName || '',
        builder: { idea, characters: name ? [{ id: newId(), name, role: 'Main character', description: '', image: null }] : [] },
      });
      await openBook(book.id, 'story-builder');
    };

    return h('section', { class: 'home-hero' },
      h('h1', {}, 'What’s your story about?'),
      h('p', { class: 'muted home-sub' }, 'Start with a sentence. You’ll shape characters, style, and pages next.'),
      prompt,
      h('div', { class: 'home-chips', role: 'list', 'aria-label': 'Quick ideas' }, IDEAS.map((idea) =>
        h('button', { class: 'home-chip', type: 'button', role: 'listitem', onclick: () => { prompt.value = idea; error.hidden = true; prompt.focus(); } }, idea))),
      h('div', { class: 'home-hero-row' },
        h('label', { class: 'home-star-field' }, h('span', { class: 'field-label' }, 'Star of the story (optional)'), star),
        h('button', { class: 'btn primary large', id: 'home-start', onclick: () => run(start) }, 'Start building')),
      error,
      h('div', { class: 'home-alt' },
        h('button', { class: 'btn ghost', id: 'home-import', onclick: () => run(importStory) }, 'Import a story (.txt, .md)'),
        h('button', { class: 'btn ghost', id: 'home-blank', onclick: () => run(createBlankBook) }, 'Blank book')));
  }

  // ---------- recent ----------
  function recent(books) {
    const sorted = [...books].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 6);
    const head = h('div', { class: 'home-section-head' }, h('h2', {}, 'Recent books'),
      books.length ? h('button', { class: 'btn ghost small', id: 'home-see-all', onclick: () => run(() => navigate('bookshelf')) }, 'See all') : null);
    if (!sorted.length) {
      return h('section', { class: 'home-section' }, head,
        h('div', { class: 'home-empty', id: 'home-recent-empty' }, 'No books yet. Start one above — it will show up here.'));
    }
    return h('section', { class: 'home-section' }, head,
      h('div', { class: 'home-recent', id: 'home-recent' }, sorted.map((s) => {
        const book = { id: s.id, title: s.title, author: s.author, size: s.size };
        return h('button', { class: 'home-recent-card', 'data-book': s.id, 'aria-label': `Open ${s.title}`, onclick: () => run(() => openBook(s.id)) },
          h('div', { class: 'home-recent-cover' }, s.cover ? scaledPage(s.cover, book, 150, 150) : null),
          h('span', { class: 'home-recent-title' }, s.title || 'Untitled'),
          h('span', { class: 'muted home-recent-date' }, s.updatedAt ? dateFormat.format(s.updatedAt) : ''));
      })));
  }

  // ---------- templates ----------
  function templates() {
    const themes = window.STORYLOOM_TEMPLATES?.themes;
    const go = () => run(() => navigate('templates'));
    const body = Array.isArray(themes) && themes.length
      ? h('div', { class: 'home-themes' }, themes.slice(0, 6).map((t) => {
        const p = t.palette || {};
        return h('button', { class: 'home-theme', 'data-theme': t.id, onclick: go },
          h('span', { class: 'home-swatches' }, [p.background, p.ink, p.accent].filter(Boolean).map((c) =>
            h('span', { class: 'home-swatch', style: { background: c } }))),
          h('span', { class: 'home-theme-name' }, t.name));
      }))
      : h('button', { class: 'home-theme home-theme-browse', id: 'home-browse-templates', onclick: go },
        h('span', { class: 'home-theme-name' }, 'Browse templates'),
        h('span', { class: 'muted' }, 'Ready-made looks for covers and pages'));
    return h('section', { class: 'home-section' },
      h('div', { class: 'home-section-head' }, h('h2', {}, 'Templates'),
        h('button', { class: 'btn ghost small', onclick: go }, 'All templates')),
      body);
  }

  // ---------- not available ----------
  function unavailable() {
    const card = (slug, title, why, alt) => h('div', { class: 'home-unavailable', 'data-unavailable': slug },
      h('h3', {}, title),
      h('p', {}, why),
      h('p', { class: 'muted' }, alt));
    return h('section', { class: 'home-section' },
      h('div', { class: 'home-section-head' }, h('h2', {}, 'Not available in Storyloom')),
      h('div', { class: 'home-unavailable-grid' },
        card('drawing-to-story', 'Story from a drawing',
          'Reading a child’s drawing needs a hosted vision AI service, which Storyloom doesn’t run.',
          'Instead: add the drawing as a picture in the Designer, or attach it to a character in the Story builder, and describe it in your idea.'),
        card('photo-avatar', 'Turn a photo into a character avatar',
          'Restyling a photo into an illustrated avatar needs a hosted vision AI service, which Storyloom doesn’t run.',
          'Instead: add the photo as the character’s picture in the Story builder, or place it on a page in the Designer.')));
  }

  async function render(host) {
    const books = (await run(() => api.listBooks())) || [];
    host.replaceChildren(h('div', { class: 'home-main' },
      h('div', { class: 'home-inner' }, hero(), recent(books), templates(), unavailable())));
  }

  window.storyloomSplitStory = splitStory;
  registerScreen('home', { label: 'Home', scope: 'app', render });
})();
