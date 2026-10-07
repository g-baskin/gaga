(() => {
  'use strict';
  // Story builder: plan a book (idea, characters, details, reader level, look) and turn it into a manuscript.

  const WORD_LIMITS_FALLBACK = { 'first-words': 40, 'early-reader': 80, 'growing-reader': 150, 'confident-reader': 300 };
  const wordLimits = () => window.STORYLOOM_WORD_LIMITS || WORD_LIMITS_FALLBACK;
  const LEVELS = [
    ['first-words', 'First words', 'Ages 2–4', 'Lap reading, a sentence or two'],
    ['early-reader', 'Early reader', 'Ages 4–6', 'Short, bouncy sentences'],
    ['growing-reader', 'Growing reader', 'Ages 6–8', 'A full paragraph per page'],
    ['confident-reader', 'Confident reader', 'Ages 8–10', 'Rich scenes and dialogue'],
  ];
  const LENGTHS = [['tiny', 'Tiny', 8], ['short', 'Short', 12], ['medium', 'Medium', 18], ['long', 'Long', 24]];
  const LENGTH_PAGES = Object.fromEntries(LENGTHS.map(([id, , n]) => [id, n]));
  const ROLES = ['Main character', 'Friend', 'Family', 'Pet', 'Helper', 'Villain', 'Other'];
  const GENRES = ['Adventure', 'Bedtime', 'Friendship', 'Animals', 'Fantasy', 'Mystery', 'Silly', 'Nature', 'Feelings', 'Space', 'Holiday', 'Learning'];
  const STYLES = ['Rhyming', 'Funny', 'Gentle', 'Adventurous', 'Repetitive', 'Lyrical', 'Playful', 'Cozy', 'Spooky-lite', 'Heartfelt'];
  const MAX_STYLES = 3;
  const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Polish', 'Turkish', 'Greek', 'Japanese', 'Chinese', 'Korean', 'Hindi', 'Arabic'];
  const ILLUSTRATION = ['Watercolor', 'Crayon', 'Paper cut-out', 'Soft pencil', 'Bold flat', 'Gouache', 'Ink and wash', 'Collage', 'Pastel chalk'];
  const BEATS = ['Meet the hero', 'An ordinary day', 'Something changes', 'Setting off', 'A first try', 'A new friend', 'Trouble grows', 'A setback',
    'Thinking hard', 'A brave choice', 'The big moment', 'Coming home'];
  const FALLBACK_THEMES = [
    { id: 'meadow', name: 'Meadow', palette: { background: '#f3f7ec', ink: '#2f4a2c', accent: '#6aa84f' }, font: 'serif', frame: 'none' },
    { id: 'sunset', name: 'Sunset', palette: { background: '#fff1e4', ink: '#5a2a1c', accent: '#e07a3f' }, font: 'rounded', frame: 'rounded' },
    { id: 'night-sky', name: 'Night sky', palette: { background: '#22284a', ink: '#f6f1dc', accent: '#f2c94c' }, font: 'serif', frame: 'thin' },
    { id: 'notebook', name: 'Notebook', palette: { background: '#ffffff', ink: '#2a2433', accent: '#2f7f75' }, font: 'hand', frame: 'dashed' },
  ];
  const themes = () => {
    const list = window.STORYLOOM_TEMPLATES?.themes;
    return Array.isArray(list) && list.length ? list : FALLBACK_THEMES;
  };

  let view = null; // { host, left, preview, errors }

  function builder() {
    const b = state.book.builder ||= {};
    b.idea ??= ''; b.genre ??= ''; b.location ??= ''; b.era ??= ''; b.extras ??= '';
    b.writingStyle ||= []; b.characters ||= [];
    b.readingLevel ||= 'early-reader'; b.length ||= 'short'; b.illustrationStyle ??= ''; b.templateId ??= null;
    return b;
  }
  const changed = (rerender = false) => { scheduleSave(); if (rerender) renderLeft(); updatePreview(); };

  // ---------- small building blocks ----------
  const card = (id, title, hint, ...body) => h('section', { class: 'sb-card', id: `sb-${id}` },
    h('header', { class: 'sb-card-head' }, h('h2', {}, title), hint ? h('p', { class: 'muted' }, hint) : null), ...body);

  function field(label, input, errorKey) {
    const error = errorKey && view.errors[errorKey];
    return h('label', { class: `field${error ? ' sb-invalid' : ''}`, 'data-field': errorKey || null },
      h('span', { class: 'field-label' }, label), input,
      error ? h('span', { class: 'sb-error', role: 'alert' }, error) : null);
  }
  const textInput = (key, placeholder, max = 200) => h('input', {
    type: 'text', value: builder()[key], placeholder, maxlength: String(max), 'data-sb': key,
    oninput: (e) => { builder()[key] = e.target.value; changed(); },
  });
  const chip = (label, active, onclick, attrs = {}) => h('button', {
    type: 'button', class: `sb-chip${active ? ' active' : ''}`, 'aria-pressed': active ? 'true' : 'false', onclick, ...attrs,
  }, label);

  // ---------- sections ----------
  function basicsCard() {
    const b = builder();
    const title = h('input', {
      type: 'text', id: 'sb-title', value: state.book.title, maxlength: '200', placeholder: 'What is your book called?',
      oninput: (e) => { state.book.title = e.target.value; clearError('title'); syncBookBar(); changed(); },
    });
    const author = h('input', {
      type: 'text', id: 'sb-author', value: state.book.author, maxlength: '200', placeholder: 'Your name',
      oninput: (e) => { state.book.author = e.target.value; syncBookBar(); changed(); },
    });
    const idea = h('textarea', {
      id: 'sb-idea', rows: '4', maxlength: '4000', value: b.idea,
      placeholder: 'A little otter is scared of deep water until a storm leaves her friend stranded on the far bank.',
      oninput: (e) => { b.idea = e.target.value; clearError('idea'); },
    });
    idea.addEventListener('input', () => changed());
    return card('basics', 'The big idea', 'Name your book and describe what happens in a few sentences.',
      h('div', { class: 'sb-two' }, field('Title', title, 'title'), field('Author', author)),
      field('Story idea', idea, 'idea'));
  }

  function charactersCard() {
    const b = builder();
    const list = b.characters.length
      ? h('ul', { class: 'sb-characters' }, b.characters.map((c) => h('li', { class: 'sb-character', 'data-character': c.id },
        avatar(c.image ? mediaUrl(state.book.id, c.image) : null, c.name),
        h('div', { class: 'sb-character-text' },
          h('strong', {}, c.name), h('span', { class: 'muted' }, c.role || 'Character'),
          c.description ? h('p', { class: 'muted' }, c.description) : null),
        h('div', { class: 'sb-character-actions' },
          h('button', { type: 'button', class: 'btn ghost small', 'data-action': 'edit-character', onclick: () => editCharacter(c) }, 'Edit'),
          h('button', { type: 'button', class: 'btn ghost small', 'data-action': 'save-to-library', onclick: () => saveToLibrary(c) }, 'Save to library'),
          h('button', {
            type: 'button', class: 'icon-btn danger', 'aria-label': `Remove ${c.name}`, 'data-action': 'remove-character',
            onclick: async () => {
              if (!(await confirmDialog(`Remove ${c.name} from this book?`, { confirmLabel: 'Remove', danger: true }))) return;
              b.characters = b.characters.filter((x) => x !== c); changed(true);
            },
          }, '×')))))
      : h('p', { class: 'muted sb-empty-line' }, 'No characters yet. Add the hero of your story, or bring one in from your library.');
    return card('characters', 'Characters', 'Who is in the story? Descriptions help the writer and the illustrator.',
      list,
      h('div', { class: 'sb-row' },
        h('button', { type: 'button', class: 'btn secondary', id: 'sb-add-character', onclick: () => editCharacter(null) }, '+ Add character'),
        h('button', { type: 'button', class: 'btn ghost', id: 'sb-insert-character', onclick: openLibrary }, 'Insert from library')));
  }

  function avatar(src, name) {
    return h('span', { class: 'sb-avatar' }, src ? h('img', { src, alt: '' }) : (name || '?').trim().charAt(0).toUpperCase());
  }

  function detailsCard() {
    const b = builder();
    const styles = new Set(b.writingStyle);
    return card('details', 'Story details', 'All optional — skip anything you don’t mind.',
      h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Genre'),
        h('div', { class: 'sb-chips', id: 'sb-genres' }, GENRES.map((g) => chip(g, b.genre === g, () => {
          b.genre = b.genre === g ? '' : g; changed(true);
        }, { 'data-genre': g })))),
      h('div', { class: 'field' }, h('span', { class: 'field-label' }, `Writing style (up to ${MAX_STYLES})`),
        h('div', { class: 'sb-chips', id: 'sb-styles' }, STYLES.map((s) => chip(s, styles.has(s), () => {
          if (styles.has(s)) b.writingStyle = b.writingStyle.filter((x) => x !== s);
          else if (b.writingStyle.length >= MAX_STYLES) { toast(`Pick up to ${MAX_STYLES} styles — remove one first`); return; }
          else b.writingStyle = [...b.writingStyle, s];
          changed(true);
        }, { 'data-style': s, disabled: !styles.has(s) && styles.size >= MAX_STYLES })))),
      h('div', { class: 'sb-two' },
        field('Where it happens', textInput('location', 'A seaside village')),
        field('When it happens', textInput('era', 'Long ago, today, the far future…'))),
      h('div', { class: 'sb-two' },
        field('Language', h('select', {
          id: 'sb-language', onchange: (e) => { state.book.language = e.target.value; changed(); },
        }, LANGUAGES.map((l) => h('option', { value: l, selected: (state.book.language || 'English') === l }, l)))),
        h('div')),
      field('Anything else', h('textarea', {
        rows: '3', maxlength: '2000', value: b.extras, 'data-sb': 'extras',
        placeholder: 'A lesson to weave in, words to avoid, a favourite food to mention…',
        oninput: (e) => { b.extras = e.target.value; changed(); },
      })));
  }

  function readingCard() {
    const b = builder();
    const limits = wordLimits();
    return card('reading', 'Reader and length', 'This sets how many words go on each page and how many pages to write.',
      h('div', { class: 'sb-options four', id: 'sb-levels' }, LEVELS.map(([id, name, ages, hint]) => h('button', {
        type: 'button', class: `sb-option${b.readingLevel === id ? ' active' : ''}`, 'data-level': id, 'aria-pressed': String(b.readingLevel === id),
        onclick: () => { b.readingLevel = id; changed(true); },
      }, h('strong', {}, name), h('span', {}, ages), h('span', { class: 'muted' }, `Up to ${limits[id]} words a page`), h('span', { class: 'muted' }, hint)))),
      h('div', { class: 'sb-options four', id: 'sb-lengths' }, LENGTHS.map(([id, name, pages]) => h('button', {
        type: 'button', class: `sb-option${b.length === id ? ' active' : ''}`, 'data-length': id, 'aria-pressed': String(b.length === id),
        onclick: () => { b.length = id; changed(true); },
      }, h('strong', {}, name), h('span', {}, `${pages} pages`)))));
  }

  function lookCard() {
    const b = builder();
    return card('look', 'The look', 'Choose a design, a picture style, and a page shape. You can change all of it later.',
      h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Design'),
        h('div', { class: 'sb-themes', id: 'sb-themes' }, themes().map((t) => {
          const p = t.palette || {};
          return h('button', {
            type: 'button', class: `sb-theme${b.templateId === t.id ? ' active' : ''}`, 'data-theme': t.id,
            onclick: () => { b.templateId = b.templateId === t.id ? null : t.id; changed(true); },
          }, h('span', { class: 'sb-swatch', style: { backgroundColor: p.background || '#fff', color: p.ink || '#2a2433', borderColor: p.accent || '#ccc' } },
            h('span', { style: { backgroundColor: p.accent || '#ccc' } })), t.name);
        }))),
      h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Illustration style'),
        h('div', { class: 'sb-chips', id: 'sb-illustration' }, ILLUSTRATION.map((s) => chip(s, b.illustrationStyle === s, () => {
          b.illustrationStyle = b.illustrationStyle === s ? '' : s; changed(true);
        }, { 'data-illustration': s })))),
      h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Page size'),
        h('div', { class: 'sb-options three', id: 'sb-sizes' }, Object.keys(PAGE_PT).map((size) => {
          const [w, hgt] = PAGE_PT[size];
          return h('button', {
            type: 'button', class: `sb-option${state.book.size === size ? ' active' : ''}`, 'data-size': size,
            onclick: () => { state.book.size = size; changed(true); },
          }, h('span', { class: 'sb-size-shape', style: { width: `${w / 22}px`, height: `${hgt / 22}px` } }), h('span', {}, SIZE_LABEL[size]));
        }))));
  }

  // ---------- preview ----------
  function coverPage() {
    const b = builder();
    const first = state.book.pages?.[0];
    const theme = themes().find((t) => t.id === b.templateId);
    const designed = first && (first.image || first.elements?.length || first.layout !== 'cover');
    if (first && designed && !theme) return first;
    const p = theme?.palette || {};
    const hero = b.characters.find((c) => c.image);
    return {
      id: 'sb-preview', layout: 'cover', text: '', image: first?.image || hero?.image || null, crop: first?.image ? first.crop : null,
      background: p.background || first?.background || '#ffffff', color: p.ink || first?.color || '#2a2433',
      font: theme?.font || first?.font || 'serif', fontSize: 44, align: 'center',
      frame: theme?.frame || first?.frame || 'none', frameColor: p.accent || theme?.frameColor || '#2a2433', elements: [],
    };
  }
  function updatePreview() {
    if (!view?.preview || !state.book) return;
    const b = builder();
    const book = { id: state.book.id, title: state.book.title || 'Untitled story', author: state.book.author, size: state.book.size };
    const level = LEVELS.find(([id]) => id === b.readingLevel);
    const facts = [b.genre, level?.[1], `${LENGTH_PAGES[b.length]} pages`, b.illustrationStyle, state.book.language].filter(Boolean);
    view.preview.replaceChildren(
      h('div', { class: 'sb-cover', id: 'sb-cover' }, scaledPage(coverPage(), book, 300, 340)),
      h('p', { class: 'sb-facts muted' }, facts.join(' · ')),
      b.writingStyle.length ? h('p', { class: 'sb-facts muted' }, `Told in a ${b.writingStyle.join(', ').toLowerCase()} voice`) : null);
  }

  // ---------- character modal ----------
  function editCharacter(existing) {
    const draft = existing ? { ...existing } : { id: newId(), name: '', role: 'Main character', description: '', image: null };
    modal(existing ? `Edit ${existing.name}` : 'New character', (close) => {
      const picture = h('div', { class: 'sb-picture' });
      const drawBtn = h('button', { type: 'button', class: 'btn ghost small', 'data-action': 'draw-portrait' }, 'Draw a portrait with AI');
      const showPicture = () => picture.replaceChildren(
        draft.image ? h('img', { src: mediaUrl(state.book.id, draft.image), alt: '', class: 'sb-picture-img' }) : h('span', { class: 'muted' }, 'No picture'),
        h('div', { class: 'sb-picture-actions' },
          h('button', {
            type: 'button', class: 'btn ghost small', 'data-action': 'choose-picture',
            onclick: async () => { const name = await run(() => api.importImage(state.book.id)); if (name) { draft.image = name; showPicture(); } },
          }, 'Choose from Mac…'),
          drawBtn,
          draft.image ? h('button', { type: 'button', class: 'btn ghost small danger', onclick: () => { draft.image = null; showPicture(); } }, 'Remove') : null));
      drawBtn.onclick = async () => {
        const prompt = `${form.elements.name.value}: ${form.elements.description.value}`.trim();
        if (!form.elements.description.value.trim()) { toast('Describe the character first so the artist knows what to draw'); return; }
        drawBtn.disabled = true; drawBtn.textContent = 'Drawing…';
        try {
          draft.image = await api.generateImage({ bookId: state.book.id, prompt, style: builder().illustrationStyle || undefined });
        } catch (error) {
          toast(cleanError(error), { label: 'Open settings', run: openAiSettings });
        }
        drawBtn.disabled = false; drawBtn.textContent = 'Draw a portrait with AI';
        showPicture();
      };
      const form = h('form', { class: 'form sb-character-form', onsubmit: (e) => {
        e.preventDefault();
        const name = form.elements.name.value.trim();
        if (!name) { form.elements.name.focus(); toast('Give the character a name'); return; }
        Object.assign(draft, { name, role: form.elements.role.value, description: form.elements.description.value.trim() });
        const b = builder();
        if (existing) Object.assign(existing, draft); else b.characters.push(draft);
        close(); changed(true);
      } },
      field('Name', h('input', { name: 'name', id: 'sb-character-name', value: draft.name, maxlength: '80', required: true, placeholder: 'Pip' })),
      field('Role', h('select', { name: 'role', id: 'sb-character-role' },
        [...new Set([...ROLES, draft.role].filter(Boolean))].map((r) => h('option', { value: r, selected: r === draft.role }, r)))),
      field('Description', h('textarea', {
        name: 'description', id: 'sb-character-description', rows: '3', maxlength: '1000', value: draft.description,
        placeholder: 'A round little hedgehog with a red scarf who hums when nervous',
      })),
      h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Picture'), picture),
      h('div', { class: 'form-actions' },
        h('button', { type: 'button', class: 'btn ghost', onclick: close }, 'Cancel'),
        h('button', { class: 'btn primary', id: 'sb-character-save' }, existing ? 'Save' : 'Add character')));
      showPicture();
      return form;
    });
  }

  async function saveToLibrary(c) {
    const saved = await run(() => api.saveCharacter({ name: c.name, role: c.role, description: c.description, image: c.image }, state.book.id));
    if (saved) toast(`${c.name} is in your character library`);
  }

  function openLibrary() {
    const dialog = modal('Character library', (close) => {
      const body = h('div', { class: 'form sb-library' }, h('p', { class: 'muted' }, 'Loading…'));
      const load = async () => {
        const all = (await run(() => api.listCharacters())) || [];
        body.replaceChildren(all.length
          ? h('ul', { class: 'sb-characters' }, all.map((c) => h('li', { class: 'sb-character', 'data-library': c.id },
            avatar(c.image ? mediaUrl('_characters', c.image) : null, c.name),
            h('div', { class: 'sb-character-text' }, h('strong', {}, c.name), h('span', { class: 'muted' }, c.role || 'Character')),
            h('div', { class: 'sb-character-actions' },
              h('button', {
                type: 'button', class: 'btn secondary small', 'data-action': 'insert',
                onclick: async () => {
                  const copy = await run(() => api.insertCharacter(state.book.id, c.id));
                  if (!copy) return;
                  builder().characters.push(copy); close(); changed(true);
                  toast(`${copy.name} joined the story`);
                },
              }, 'Add to book'),
              h('button', {
                type: 'button', class: 'icon-btn danger', 'aria-label': `Delete ${c.name} from library`, 'data-action': 'delete-library',
                onclick: async () => {
                  if (!(await confirmDialog(`Delete ${c.name} from your library? Books that already use this character keep it.`, { confirmLabel: 'Delete', danger: true }))) return;
                  await run(() => api.deleteCharacter(c.id)); load();
                },
              }, '×')))))
          : h('p', { class: 'muted' }, 'Your library is empty. Use “Save to library” on a character to reuse it in other books.'),
        h('div', { class: 'form-actions' }, h('button', { type: 'button', class: 'btn ghost', onclick: close }, 'Done')));
      };
      load();
      return body;
    });
    dialog.classList.add('sb-library-modal');
  }

  // ---------- validation + actions ----------
  function clearError(key) {
    if (!view?.errors[key]) return;
    delete view.errors[key];
    const wrap = view.left.querySelector(`[data-field="${key}"]`);
    wrap?.classList.remove('sb-invalid');
    wrap?.querySelector('.sb-error')?.remove();
  }
  function validate() {
    const b = builder();
    const errors = {};
    if (!b.idea.trim()) errors.idea = 'Describe your story idea so there is something to write about.';
    const untitled = !state.book.title.trim() || /^untitled/i.test(state.book.title.trim());
    if (untitled && !b.idea.trim()) errors.title = 'Give the book a title or an idea.';
    view.errors = errors;
    if (!Object.keys(errors).length) return true;
    renderLeft();
    const first = view.left.querySelector('.sb-invalid');
    first?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    first?.querySelector('input, textarea')?.focus({ preventScroll: true });
    return false;
  }
  const hasManuscriptText = () => (state.book.manuscript?.chapters || [])
    .some((ch) => (ch.blocks || []).some((bl) => (bl.runs || []).some((r) => r.text?.trim())));
  const toBlocks = (text) => String(text || '').split(/\n\s*\n|\n/).map((t) => t.trim()).filter(Boolean)
    .map((t) => ({ type: 'p', runs: [{ text: t }] }));

  async function confirmReplace() {
    if (!hasManuscriptText()) return true;
    return confirmDialog('This book already has a manuscript. Replace it with the new one?', {
      title: 'Replace the manuscript?', confirmLabel: 'Replace', danger: true, detail: 'The current chapters will be removed.',
    });
  }

  async function writeWithAi(button) {
    if (!validate()) return;
    if (!(await confirmReplace())) return;
    const b = builder();
    const progress = view.host.querySelector('#sb-progress');
    button.disabled = true; button.textContent = 'Writing your story…';
    progress.hidden = false;
    try {
      const story = await api.generateStory({
        idea: b.idea, title: state.book.title, genre: b.genre, writingStyle: b.writingStyle, location: b.location, era: b.era,
        extras: b.extras, language: state.book.language || 'English', readingLevel: b.readingLevel, length: b.length,
        characters: b.characters.map(({ name, role, description }) => ({ name, role, description })),
      });
      const chapters = (story.chapters?.length ? story.chapters : (story.pages || []).map((text, i) => ({ title: `Page ${i + 1}`, text })))
        .map((ch, i) => ({ id: newId(), title: ch.title || `Page ${i + 1}`, blocks: toBlocks(ch.text) }));
      if (!chapters.length) throw new Error('The writer sent back an empty story. Try again.');
      state.book.manuscript = { ...(state.book.manuscript || {}), chapters };
      if ((!state.book.title.trim() || /^untitled/i.test(state.book.title.trim())) && story.title) { state.book.title = story.title; syncBookBar(); }
      scheduleSave();
      await navigate('manuscript');
    } catch (error) {
      toast(cleanError(error), { label: 'Open settings', run: openAiSettings });
      if (button.isConnected) { button.disabled = false; button.textContent = 'Write the story with AI'; progress.hidden = true; }
    }
  }

  async function startOutline() {
    if (!(await confirmReplace())) return;
    const n = LENGTH_PAGES[builder().length] || 12;
    const chapters = Array.from({ length: n }, (_v, i) => ({
      id: newId(), title: n <= BEATS.length ? `Page ${i + 1}: ${BEATS[Math.floor((i * BEATS.length) / n)]}` : `Page ${i + 1}`, blocks: [],
    }));
    state.book.manuscript = { ...(state.book.manuscript || {}), chapters };
    scheduleSave();
    await navigate('manuscript');
  }

  // ---------- screen ----------
  function renderLeft() {
    const top = view.left.scrollTop;
    view.left.replaceChildren(h('div', { class: 'sb-cards' }, basicsCard(), charactersCard(), detailsCard(), readingCard(), lookCard()));
    view.left.scrollTop = top;
  }

  function onMeta() {
    if (!view) return;
    const t = view.left.querySelector('#sb-title');
    const a = view.left.querySelector('#sb-author');
    if (t && document.activeElement !== t) t.value = state.book.title;
    if (a && document.activeElement !== a) a.value = state.book.author;
    updatePreview();
  }

  function render(host) {
    builder();
    const writeBtn = h('button', { type: 'button', class: 'btn primary large', id: 'sb-write', onclick: () => writeWithAi(writeBtn) }, 'Write the story with AI');
    view = { host, errors: {}, left: h('div', { class: 'sb-left' }), preview: h('div', { class: 'sb-preview-body' }) };
    renderLeft();
    host.replaceChildren(h('div', { class: 'sb-screen' },
      h('div', { class: 'sb-main' }, view.left,
        h('aside', { class: 'sb-preview' }, h('h3', {}, 'Cover preview'), view.preview)),
      h('footer', { class: 'sb-footer' },
        h('span', { class: 'sb-progress muted', id: 'sb-progress', hidden: true }, h('span', { class: 'sb-spinner' }), 'Writing — this can take a minute…'),
        h('span', { class: 'muted small-print sb-footer-note' }, 'AI writing uses the service in Settings. An outline works offline.'),
        h('button', { type: 'button', class: 'btn ghost large', id: 'sb-outline', onclick: () => run(startOutline) }, 'Start with an outline'),
        writeBtn)));
    updatePreview();
    document.removeEventListener('storyloom:book-meta', onMeta);
    document.addEventListener('storyloom:book-meta', onMeta);
  }

  registerScreen('story-builder', {
    label: 'Story builder', scope: 'book', render,
    leave() { document.removeEventListener('storyloom:book-meta', onMeta); view = null; },
  });
})();
