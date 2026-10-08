// Illustrate the whole book: the writing service plans one picture description per page, then the picture
// service draws each page in turn. Character portraits are sent along as reference pictures (OpenRouter and
// fal.ai), so characters look the same on every page. Adds "Illustrate the whole book" to the Designer's
// Pictures drawer, and "Redraw this picture" for a page that already has an AI picture.
(() => {
  'use strict';

  const ASPECT = { square: '1:1', portrait: '3:4', landscape: '4:3' };
  // Pages that can show a layout picture (cover and words-only pages are left to the author).
  const DRAWABLE = new Set(['image-top', 'image-left', 'image-full']);

  // Characters with a portrait in this book become reference pictures (up to 4, main character first).
  function castOf(book) {
    const all = (book.builder?.characters || []).filter((c) => c && c.name);
    const ranked = [...all.filter((c) => c.role === 'Main character'), ...all.filter((c) => c.role !== 'Main character')];
    return { characters: ranked, references: ranked.filter((c) => c.image).map((c) => c.image).slice(0, 4) };
  }
  const styleOf = (book) => book.builder?.illustrationStyle || '';

  // Which pages to draw: every picture page, or only the ones without a picture yet.
  function targets(book, { redrawAll }) {
    return book.pages.map((page, index) => ({ page, index }))
      .filter(({ page }) => DRAWABLE.has(page.layout) && (redrawAll || !page.image));
  }

  function openIllustrateDialog(book) {
    const { characters, references } = castOf(book);
    const missing = targets(book, { redrawAll: false });
    const all = targets(book, { redrawAll: true });
    let running = false;
    let stopRequested = false;

    modal('Illustrate the whole book', (close) => {
      const choice = h('div', { class: 'stack', role: 'radiogroup', 'aria-label': 'Which pages' },
        h('label', { class: 'check' }, h('input', { type: 'radio', name: 'which', value: 'missing', checked: true }),
          `Pages without a picture (${missing.length})`),
        h('label', { class: 'check' }, h('input', { type: 'radio', name: 'which', value: 'all' }),
          `Every picture page (${all.length}), replacing the pictures they have`));
      const status = h('p', { class: 'illustrate-status', id: 'illustrate-status', role: 'status' });
      const bar = h('progress', { class: 'illustrate-progress', id: 'illustrate-progress', max: 1, value: 0, hidden: true, 'aria-label': 'Pictures drawn' });
      const start = h('button', { type: 'button', class: 'btn primary', id: 'illustrate-start' }, 'Draw the pictures');
      const stop = h('button', { type: 'button', class: 'btn ghost', id: 'illustrate-stop', hidden: true }, 'Stop after this picture');
      const cancel = h('button', { type: 'button', class: 'btn ghost', onclick: close }, 'Close');
      stop.onclick = () => { stopRequested = true; stop.disabled = true; stop.textContent = 'Stopping…'; };

      start.onclick = () => run(async () => {
        const which = document.querySelector('dialog[open] input[name="which"]:checked')?.value || 'missing';
        const list = which === 'all' ? all : missing;
        if (!list.length) { status.textContent = 'Every picture page already has a picture.'; return; }
        running = true;
        stopRequested = false;
        start.hidden = true;
        cancel.hidden = true;
        stop.hidden = false;
        bar.hidden = false;
        bar.max = list.length;
        bar.value = 0;
        let drawn = 0;
        const failures = [];
        try {
          status.textContent = 'Planning a picture for each page…';
          const { scenes } = await api.scenePrompts({
            bookTitle: book.title, style: styleOf(book),
            characters: characters.map((c) => ({ name: c.name, description: c.description })),
            pages: list.map(({ page, index }) => ({ index, text: page.text })),
          });
          const prompts = new Map(scenes.map((s) => [s.index, s.prompt]));
          for (const { index } of list) {
            if (stopRequested) break;
            status.textContent = `Drawing page ${index} (${drawn + failures.length + 1} of ${list.length})…`;
            const prompt = prompts.get(index) || book.pages[index].text || book.title;
            try {
              const name = await api.generateImage({ bookId: book.id, prompt, style: styleOf(book), references, aspect: ASPECT[book.size] || '1:1' });
              // The book may have changed while drawing: find the page again by its id.
              const target = state.book?.id === book.id ? state.book.pages.find((p) => p.id === book.pages[index].id) : null;
              if (target) {
                if (typeof checkpoint === 'function') checkpoint();
                target.image = name;
                target.crop = null;
                target.imagePrompt = prompt;
                scheduleSave();
                if (state.screen === 'designer') { refreshPage(); renderInspector(); }
              }
              drawn++;
            } catch (error) {
              failures.push({ index, message: cleanError(error) });
              // A service-wide problem (no key, no credit, not set up) will fail every page: stop now.
              if (/key|credit|balance|set up|sign in|usage limit|not available/i.test(failures.at(-1).message)) break;
            }
            bar.value = drawn + failures.length;
          }
          await saveNow();
        } catch (error) {
          failures.push({ index: null, message: cleanError(error) });
        } finally {
          running = false;
          stop.hidden = true;
          cancel.hidden = false;
          cancel.textContent = 'Done';
        }
        const parts = [`Drew ${drawn} of ${list.length} pictures.`];
        if (stopRequested && drawn + failures.length < list.length) parts.push('Stopped early.');
        if (failures.length) parts.push(`Couldn’t draw ${failures.length}: ${failures[0].message}`);
        status.textContent = parts.join(' ');
        status.classList.toggle('warn', failures.length > 0);
        if (drawn) toast(`Drew ${drawn} picture${drawn === 1 ? '' : 's'}`);
      });

      return h('div', { class: 'form illustrate-dialog', id: 'illustrate-dialog' },
        h('p', {}, 'Storyloom plans a picture for each page from its words, then draws them one at a time. You can keep working while it draws.'),
        references.length
          ? h('p', { class: 'muted small-print', id: 'illustrate-cast' }, `Characters will match their portraits: ${characters.filter((c) => c.image).slice(0, 4).map((c) => c.name).join(', ')}.`)
          : h('p', { class: 'muted small-print', id: 'illustrate-cast' }, 'Tip: give your characters a portrait in the Story builder first, so they look the same on every page.'),
        choice,
        aiPictureNote({ onReady: (ready) => { start.disabled = !ready || !all.length; } }),
        h('p', { class: 'muted small-print' }, `Each picture is one request to your picture service (${all.length ? `up to ${all.length}` : 'none'} for this book).`),
        bar, status,
        h('div', { class: 'form-actions' }, cancel, stop, start));
    });
    // Closing the window while drawing just lets it finish in the background.
    void running;
  }

  // Redraws one page's picture from what it was drawn from (or its words), keeping characters the same.
  async function redrawPage(book, page) {
    const { references } = castOf(book);
    const prompt = page.imagePrompt || page.text || book.title;
    const name = await api.generateImage({ bookId: book.id, prompt, style: styleOf(book), references, aspect: ASPECT[book.size] || '1:1' });
    if (typeof checkpoint === 'function') checkpoint();
    page.image = name;
    page.crop = null;
    page.imagePrompt = prompt;
    scheduleSave();
    refreshPage();
    renderInspector();
  }

  window.picturesDrawerExtras = window.picturesDrawerExtras || [];
  window.picturesDrawerExtras.unshift((book) => h('button', {
    class: 'btn primary block', 'data-action': 'illustrate-book', id: 'illustrate-book',
    onclick: () => openIllustrateDialog(book),
  }, 'Illustrate the whole book'));

  // "Redraw this picture" in the page panel, for pages whose picture was drawn by AI.
  window.pagePictureExtras = window.pagePictureExtras || [];
  window.pagePictureExtras.push((book, page) => (page.image && page.imagePrompt && DRAWABLE.has(page.layout)
    ? h('button', {
      class: 'btn ghost', id: 'redraw-picture', title: page.imagePrompt,
      onclick: (e) => {
        const button = e.currentTarget;
        button.disabled = true;
        button.textContent = 'Redrawing…';
        run(() => redrawPage(book, page)).finally(() => { if (button.isConnected) { button.disabled = false; button.textContent = 'Redraw this picture'; } });
      },
    }, 'Redraw this picture')
    : null));

  Object.assign(window, { openIllustrateDialog });
})();
