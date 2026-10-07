(() => {
  'use strict';
  // Manuscript: chapters on the left, a rich-text editor (stored as structured blocks, never HTML) on the right.

  const WORD_LIMITS = { 'first-words': 40, 'early-reader': 80, 'growing-reader': 150, 'confident-reader': 300 };
  window.STORYLOOM_WORD_LIMITS = WORD_LIMITS;
  const PAGE_FONT = { 'first-words': 32, 'early-reader': 28, 'growing-reader': 22, 'confident-reader': 18 };
  const BLOCKS = [['p', 'Paragraph'], ['h2', 'Heading'], ['h3', 'Subheading'], ['quote', 'Quote'], ['li', 'List item']];
  const TAG_OF = { p: 'p', h2: 'h2', h3: 'h3', quote: 'blockquote', li: 'li' };
  const TYPE_OF = { P: 'p', DIV: 'p', H1: 'h2', H2: 'h2', H3: 'h3', H4: 'h3', H5: 'h3', H6: 'h3', BLOCKQUOTE: 'quote', LI: 'li' };
  const allowLonger = new Set(); // Book ids, this session only.

  let ui = null; // { host, currentId, editor, ... } for the screen on display.

  // ---------- text helpers ----------
  const countWords = (text) => (text.match(/\S+/g) || []).length;
  const blockText = (block) => block.runs.map((r) => r.text).join('');
  const chapterText = (chapter) => chapter.blocks.map(blockText).filter((t) => t.trim()).join('\n\n');
  const chapterWords = (chapter) => chapter.blocks.reduce((n, b) => n + countWords(blockText(b)), 0);
  const limitFor = (book) => WORD_LIMITS[book.builder?.readingLevel] || WORD_LIMITS['early-reader'];

  function textToBlocks(text) {
    return String(text || '').replace(/\r\n?/g, '\n').split(/\n\s*\n|\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
      let m;
      if ((m = /^#{1,2}\s+(.*)$/.exec(line))) return { type: line.startsWith('##') ? 'h3' : 'h2', runs: [{ text: m[1] }] };
      if ((m = /^[-*]\s+(.*)$/.exec(line))) return { type: 'li', runs: [{ text: m[1] }] };
      if ((m = /^>\s?(.*)$/.exec(line))) return { type: 'quote', runs: [{ text: m[1] }] };
      return { type: 'p', runs: [{ text: line }] };
    });
  }

  // ---------- DOM <-> blocks ----------
  function renderBlock(block) {
    const runs = block.runs.filter((r) => r.text).map((r) => {
      let node = document.createTextNode(r.text);
      if (r.u) node = h('u', {}, node);
      if (r.i) node = h('em', {}, node);
      if (r.b) node = h('strong', {}, node);
      return node;
    });
    return h(TAG_OF[block.type] || 'p', {}, runs.length ? runs : h('br'));
  }

  function collectRuns(node, fmt, runs) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.data.replace(/\u00a0/g, ' ').replace(/[\u200b\n]/g, '');
      if (text) runs.push({ text, ...fmt });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || node.tagName === 'BR') return;
    const next = { ...fmt };
    const tag = node.tagName;
    const st = node.style || {};
    if (tag === 'B' || tag === 'STRONG' || st.fontWeight === 'bold' || Number(st.fontWeight) >= 600) next.b = true;
    if (tag === 'I' || tag === 'EM' || st.fontStyle === 'italic') next.i = true;
    if (tag === 'U' || /underline/.test(st.textDecoration || '') || /underline/.test(st.textDecorationLine || '')) next.u = true;
    for (const child of node.childNodes) collectRuns(child, next, runs);
  }
  function mergeRuns(runs) {
    const out = [];
    for (const r of runs) {
      const last = out[out.length - 1];
      if (last && !!last.b === !!r.b && !!last.i === !!r.i && !!last.u === !!r.u) last.text += r.text;
      else out.push({ text: r.text, ...(r.b ? { b: true } : {}), ...(r.i ? { i: true } : {}), ...(r.u ? { u: true } : {}) });
    }
    return out;
  }
  function parseEditor(editor) {
    const blocks = [];
    let loose = null;
    const flush = () => { if (loose) { blocks.push({ type: 'p', runs: mergeRuns(loose) }); loose = null; } };
    for (const node of editor.childNodes) {
      const tag = node.nodeType === Node.ELEMENT_NODE ? node.tagName : '';
      if (tag === 'UL' || tag === 'OL') {
        flush();
        for (const li of node.children) { const runs = []; collectRuns(li, {}, runs); blocks.push({ type: 'li', runs: mergeRuns(runs) }); }
      } else if (TYPE_OF[tag]) {
        flush();
        const runs = []; collectRuns(node, {}, runs);
        blocks.push({ type: TYPE_OF[tag], runs: mergeRuns(runs) });
      } else {
        loose = loose || [];
        collectRuns(node, {}, loose);
      }
    }
    flush();
    // A lone empty paragraph is an empty chapter.
    return blocks.length === 1 && !blocks[0].runs.length ? [] : blocks;
  }

  // ---------- state helpers ----------
  const chapters = () => state.book.manuscript.chapters;
  const current = () => chapters().find((c) => c.id === ui?.currentId) || null;

  function ensureManuscript() {
    const book = state.book;
    if (!book.manuscript || !Array.isArray(book.manuscript.chapters)) book.manuscript = { chapters: [] };
    if (!book.builder) book.builder = {};
  }

  function changed() { scheduleSave(); updateCounts(); }

  // ---------- render ----------
  async function render(host) {
    ensureManuscript();
    const keep = ui && ui.bookId === state.book.id ? ui.currentId : null;
    if (ui) document.removeEventListener('storyloom:book-meta', ui.onMeta);
    ui = { host, bookId: state.book.id, currentId: keep, onMeta: () => syncMeta() };
    document.addEventListener('storyloom:book-meta', ui.onMeta);
    if (!current()) ui.currentId = chapters()[0]?.id || null;
    draw();
  }

  function draw() {
    const { host } = ui;
    ui.list = h('ol', { class: 'ms-chapter-list', 'aria-label': 'Chapters' });
    const side = h('aside', { class: 'ms-side' },
      h('div', { class: 'ms-side-head' }, h('h2', {}, 'Chapters'), h('span', { class: 'muted ms-book-count', id: 'ms-book-words' })),
      ui.list,
      h('button', { class: 'btn ghost block', id: 'ms-add-chapter', onclick: () => addChapter() }, '+ Add chapter'));
    ui.main = h('section', { class: 'ms-main' });
    host.replaceChildren(h('div', { class: 'ms-layout' }, side, ui.main));
    drawList();
    drawMain();
  }

  function drawList() {
    const list = chapters();
    ui.list.replaceChildren(...list.map((ch, index) => {
      const item = h('li', {
        class: `ms-chapter${ch.id === ui.currentId ? ' active' : ''}`, draggable: 'true', 'data-chapter': ch.id,
        ondragstart: (e) => { e.dataTransfer.setData('text/x-storyloom-chapter', ch.id); e.dataTransfer.effectAllowed = 'move'; item.classList.add('dragging'); },
        ondragend: () => item.classList.remove('dragging'),
        ondragover: (e) => { if (e.dataTransfer.types.includes('text/x-storyloom-chapter')) { e.preventDefault(); item.classList.add('drop-target'); } },
        ondragleave: () => item.classList.remove('drop-target'),
        ondrop: (e) => {
          e.preventDefault(); item.classList.remove('drop-target');
          const id = e.dataTransfer.getData('text/x-storyloom-chapter');
          const from = list.findIndex((c) => c.id === id);
          if (from >= 0 && from !== index) moveChapter(from, index);
        },
      });
      const open = h('button', { class: 'ms-chapter-open', onclick: () => selectChapter(ch.id), ondblclick: () => startRename(ch, item) },
        h('span', { class: 'ms-chapter-num' }, String(index + 1)),
        h('span', { class: 'ms-chapter-title' }, ch.title || 'Untitled chapter'),
        h('span', { class: 'ms-chapter-words muted' }, `${chapterWords(ch)} words`));
      const tools = h('div', { class: 'ms-chapter-tools' },
        h('button', { class: 'icon-btn', 'data-move': 'up', title: 'Move up', 'aria-label': `Move ${ch.title || 'chapter'} up`, disabled: index === 0, onclick: () => moveChapter(index, index - 1) }, '↑'),
        h('button', { class: 'icon-btn', 'data-move': 'down', title: 'Move down', 'aria-label': `Move ${ch.title || 'chapter'} down`, disabled: index === list.length - 1, onclick: () => moveChapter(index, index + 1) }, '↓'),
        h('button', { class: 'icon-btn', 'data-rename': '', title: 'Rename', 'aria-label': `Rename ${ch.title || 'chapter'}`, onclick: () => startRename(ch, item) }, '✎'),
        h('button', { class: 'icon-btn danger', 'data-delete': '', title: 'Delete', 'aria-label': `Delete ${ch.title || 'chapter'}`, onclick: () => deleteChapter(ch) }, '×'));
      item.append(open, tools);
      return item;
    }));
    updateCounts();
  }

  function startRename(ch, item) {
    const input = h('input', { class: 'ms-rename', value: ch.title, maxlength: '200', 'aria-label': 'Chapter title' });
    let done = false;
    const finish = (save) => {
      if (done) return; done = true;
      if (save) { ch.title = input.value.trim(); scheduleSave(); }
      drawList();
      if (save && ch.id === ui.currentId && ui.titleInput) ui.titleInput.value = ch.title;
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); finish(true); } else if (e.key === 'Escape') finish(false); });
    input.addEventListener('blur', () => finish(true));
    item.replaceChildren(input);
    input.focus(); input.select();
  }

  function drawMain() {
    const book = state.book;
    const titleArea = h('input', {
      class: 'ms-book-title', id: 'ms-book-title', value: book.title, maxlength: '200', 'aria-label': 'Book title', placeholder: 'Book title',
      oninput: (e) => { book.title = e.target.value; syncBookBar(); scheduleSave(); },
    });
    const authorArea = h('input', {
      class: 'ms-book-author', id: 'ms-book-author', value: book.author, maxlength: '200', 'aria-label': 'Author', placeholder: 'Author name',
      oninput: (e) => { book.author = e.target.value; syncBookBar(); scheduleSave(); },
    });
    ui.titleArea = titleArea; ui.authorArea = authorArea;
    const head = h('header', { class: 'ms-head' }, titleArea, h('div', { class: 'ms-byline' }, h('span', { class: 'muted' }, 'by'), authorArea));
    const ch = current();
    if (!ch) {
      ui.editor = null;
      ui.main.replaceChildren(head, h('section', { class: 'empty ms-empty' },
        h('h1', {}, 'Your story starts here'),
        h('p', {}, 'Write chapter by chapter. Each chapter becomes a page when you lay out the book.'),
        h('div', { class: 'empty-actions' },
          h('button', { class: 'btn primary large', id: 'ms-first-chapter', onclick: () => addChapter() }, 'Add first chapter'),
          h('button', { class: 'btn ghost large', onclick: () => run(() => navigate('story-builder')) }, 'Plan it in Story builder'))));
      return;
    }
    ui.titleInput = h('input', {
      class: 'ms-chapter-title-input', id: 'ms-chapter-title', value: ch.title, maxlength: '200', placeholder: 'Chapter title', 'aria-label': 'Chapter title',
      oninput: (e) => { ch.title = e.target.value; scheduleSave(); const t = ui.list.querySelector(`[data-chapter="${ch.id}"] .ms-chapter-title`); if (t) t.textContent = ch.title || 'Untitled chapter'; },
    });
    ui.blockSelect = h('select', { id: 'ms-block-type', 'aria-label': 'Block type', onchange: (e) => setBlockType(e.target.value) },
      BLOCKS.map(([v, label]) => h('option', { value: v }, label)));
    const fmtBtn = (cmd, label, title, cls) => h('button', {
      class: `ms-fmt ${cls}`, 'data-format': cmd, title, 'aria-label': title, 'aria-pressed': 'false',
      onmousedown: (e) => e.preventDefault(), onclick: () => format(cmd),
    }, label);
    ui.fmtButtons = [fmtBtn('bold', 'B', 'Bold (⌘B)', 'b'), fmtBtn('italic', 'I', 'Italic (⌘I)', 'i'), fmtBtn('underline', 'U', 'Underline (⌘U)', 'u')];
    ui.instruction = h('input', { class: 'ms-ai-instruction', id: 'ms-ai-instruction', placeholder: 'Optional note for AI, e.g. “add a funny moment”', maxlength: '500' });
    ui.aiButton = h('button', { class: 'btn secondary', id: 'ms-ai', onclick: () => writeWithAi() });
    const toolbar = h('div', { class: 'ms-toolbar', role: 'toolbar', 'aria-label': 'Formatting' },
      ui.blockSelect, h('div', { class: 'ms-fmt-group' }, ui.fmtButtons),
      h('span', { class: 'ms-spacer' }),
      h('button', { class: 'btn primary', id: 'ms-layout', onclick: () => run(layOut) }, 'Lay out into pages'));

    ui.editor = h('div', {
      class: 'ms-editor', id: 'ms-editor', contenteditable: 'true', role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'Chapter text', spellcheck: 'true',
      'data-placeholder': 'Once upon a time…',
    });
    fillEditor(ch);
    wireEditor(ui.editor);

    ui.notice = h('div', { class: 'ms-notice', id: 'ms-limit-notice', role: 'status', hidden: true });
    ui.chapterCount = h('span', { id: 'ms-chapter-words' });
    const limit = limitFor(book);
    const longer = h('label', { class: 'check compact ms-longer' },
      h('input', { type: 'checkbox', id: 'ms-allow-longer', checked: allowLonger.has(book.id), onchange: (e) => { if (e.target.checked) allowLonger.add(book.id); else allowLonger.delete(book.id); updateCounts(); } }),
      'Allow longer chapters');
    const foot = h('div', { class: 'ms-foot' }, ui.chapterCount, h('span', { class: 'muted' }, `Limit ${limit} words per chapter`), h('span', { class: 'ms-spacer' }), longer);
    const ai = h('div', { class: 'ms-ai-wrap' }, h('div', { class: 'ms-ai-row' }, ui.instruction, ui.aiButton), aiWriterNote());

    ui.main.replaceChildren(head, h('div', { class: 'ms-sheet' }, ui.titleInput, toolbar, ui.editor, ui.notice, foot), ai);
    updateCounts();
  }

  function fillEditor(ch) {
    const blocks = ch.blocks.length ? ch.blocks : [{ type: 'p', runs: [] }];
    ui.editor.replaceChildren(...blocks.map(renderBlock));
    ui.editor.classList.toggle('is-empty', !ch.blocks.length);
  }

  function syncMeta() {
    if (!ui || !state.book) return;
    for (const [el, key] of [[ui.titleArea, 'title'], [ui.authorArea, 'author']]) {
      if (el && document.activeElement !== el && el.value !== state.book[key]) el.value = state.book[key];
    }
  }

  function updateCounts() {
    if (!ui || !state.book) return;
    const total = chapters().reduce((n, c) => n + chapterWords(c), 0);
    const bookCount = ui.host.querySelector('#ms-book-words');
    if (bookCount) bookCount.textContent = `${total} ${total === 1 ? 'word' : 'words'} in the book`;
    const ch = current();
    if (ch) {
      const item = ui.list.querySelector(`[data-chapter="${ch.id}"] .ms-chapter-words`);
      if (item) item.textContent = `${chapterWords(ch)} words`;
    }
    if (!ch || !ui.editor) return;
    const words = chapterWords(ch);
    const limit = limitFor(state.book);
    ui.chapterCount.textContent = `${words} / ${limit} words in this chapter`;
    ui.chapterCount.className = words >= limit ? 'ms-count at-limit' : 'ms-count';
    const atLimit = words >= limit && !allowLonger.has(state.book.id);
    ui.notice.hidden = !atLimit;
    if (atLimit) ui.notice.textContent = `This chapter has reached ${limit} words, the length suited to this reading level. Trim a little to add more, or tick “Allow longer chapters”.`;
    ui.aiButton.textContent = words ? 'Rewrite with AI' : 'Write with AI';
  }

  // ---------- editor behaviour ----------
  function wireEditor(editor) {
    editor.addEventListener('input', () => {
      const ch = current();
      if (!ch) return;
      ch.blocks = parseEditor(editor);
      editor.classList.toggle('is-empty', !ch.blocks.length);
      changed();
      reflectSelection();
    });
    editor.addEventListener('beforeinput', (e) => {
      if (!e.inputType.startsWith('insert') || e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak') return;
      const data = e.data ?? e.dataTransfer?.getData('text/plain') ?? '';
      if (wordsAllowed(data) < countWords(data) || (!data && overLimit())) {
        e.preventDefault();
        ui.notice.hidden = false;
      }
    });
    editor.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey) {
        const cmd = { b: 'bold', i: 'italic', u: 'underline' }[e.key.toLowerCase()];
        if (cmd) { e.preventDefault(); format(cmd); }
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.isComposing) {
        e.preventDefault();
        newParagraph();
      }
    });
    editor.addEventListener('paste', (e) => {
      e.preventDefault();
      let text = e.clipboardData?.getData('text/plain') || '';
      if (!text) {
        const html = e.clipboardData?.getData('text/html') || '';
        if (html) text = htmlToText(html);
      }
      insertPlain(text);
    });
    editor.addEventListener('drop', (e) => {
      // Dropped content is treated like pasted plain text.
      e.preventDefault();
      insertPlain(e.dataTransfer?.getData('text/plain') || '');
    });
  }

  // Plain text from clipboard HTML without parsing it into a document (no styles or scripts ever apply).
  function htmlToText(html) {
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    return html.replace(/<(script|style|head)[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<br\s*\/?>|<\/(p|div|h[1-6]|li|blockquote)\s*>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
        if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1)); return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ''; }
        return named[e.toLowerCase()] ?? m;
      });
  }

  function overLimit() {
    const ch = current();
    return ch && !allowLonger.has(state.book.id) && chapterWords(ch) >= limitFor(state.book);
  }
  // How many new words may still be added, accounting for text that joins the word at the caret.
  function wordsAllowed(data) {
    const ch = current();
    if (!ch || allowLonger.has(state.book.id)) return Infinity;
    let room = limitFor(state.book) - chapterWords(ch);
    const sel = getSelection();
    if (sel.rangeCount && data && /^\S/.test(data)) {
      const r = sel.getRangeAt(0);
      if (r.startContainer.nodeType === Node.TEXT_NODE && r.startOffset > 0 && /\S/.test(r.startContainer.data[r.startOffset - 1])) room += 1;
    }
    if (sel.rangeCount && !sel.isCollapsed) room += countWords(sel.toString());
    return room;
  }

  function insertPlain(text) {
    text = text.replace(/\r\n?/g, '\n');
    const room = wordsAllowed(text);
    if (room < countWords(text)) {
      if (room <= 0) { ui.notice.hidden = false; return; }
      let seen = 0;
      text = text.replace(/\S+/g, (w) => (++seen <= room ? w : '')).replace(/\s+$/, '');
      toast(`Pasted the first ${room} ${room === 1 ? 'word' : 'words'} to stay within the chapter limit.`);
    }
    const lines = text.split(/\n+/);
    lines.forEach((line, i) => {
      if (i) newParagraph();
      if (line) insertTextAtCaret(line);
    });
    // execCommand fires input; normalize anything Chromium may have carried over.
    const ch = current();
    if (ch) { ch.blocks = parseEditor(ui.editor); changed(); }
  }

  // Inserts a plain text node at the caret (no execCommand, so no inline styles sneak in).
  function insertTextAtCaret(text) {
    const range = editorRange();
    if (!range) return;
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    const parent = node.parentNode;
    if (parent?.lastChild?.tagName === 'BR' && parent.lastChild !== node && parent.childNodes.length > 1 && parent.lastChild.previousSibling === node) parent.lastChild.remove();
    if (parent === ui.editor) { const p = h('p', {}); node.replaceWith(p); p.append(node); }
    const r = document.createRange(); r.setStartAfter(node); r.collapse(true);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    ui.editor.normalize();
  }

  function editorRange() {
    const sel = getSelection();
    if (!sel.rangeCount || !ui?.editor) return null;
    const r = sel.getRangeAt(0);
    return ui.editor.contains(r.commonAncestorContainer) ? r : null;
  }

  function format(cmd) {
    if (!ui.editor) return;
    if (!editorRange()) { if (ui.lastRange) { const s = getSelection(); s.removeAllRanges(); s.addRange(ui.lastRange); } else return; }
    ui.editor.focus();
    document.execCommand('styleWithCSS', false, false);
    document.execCommand(cmd);
    normalizeInline();
    const ch = current();
    if (ch) { ch.blocks = parseEditor(ui.editor); changed(); }
    reflectSelection();
  }

  // Enter always starts a plain paragraph (list items continue the list).
  function newParagraph() {
    const range = editorRange();
    if (!range) return;
    if (!range.collapsed) range.deleteContents();
    if (range.startContainer === ui.editor) {
      // Caret between blocks: move it to the end of the block before it.
      const prev = ui.editor.childNodes[range.startOffset - 1] || ui.editor.firstChild;
      if (prev) { const atEnd = range.startOffset > 0; range.selectNodeContents(prev); range.collapse(!atEnd); }
    }
    let block = blockOf(range.startContainer);
    if (!block || block === ui.editor || block.nodeType !== Node.ELEMENT_NODE) {
      // Caret sits directly in the editor or in loose text: wrap it first.
      const p = h('p', {}, h('br'));
      if (block && block !== ui.editor) { block.replaceWith(p); p.replaceChildren(block); } else ui.editor.append(p);
      block = p;
    }
    const tail = document.createRange();
    tail.setStart(range.startContainer, range.startOffset);
    tail.setEnd(block, block.childNodes.length);
    const rest = tail.extractContents();
    const fresh = h(block.tagName === 'LI' ? 'li' : 'p', {});
    if (rest.textContent) fresh.append(rest);
    else fresh.append(h('br'));
    if (!block.textContent) block.replaceChildren(h('br'));
    block.after(fresh);
    const r = document.createRange(); r.setStart(fresh, 0); r.collapse(true);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    const ch = current();
    if (ch) { ch.blocks = parseEditor(ui.editor); changed(); }
  }

  // execCommand writes <b>/<i>; keep the editor on <strong>/<em> while preserving the selection.
  function normalizeInline() {
    const sel = getSelection();
    const r = sel.rangeCount ? sel.getRangeAt(0) : null;
    const saved = r && [r.startContainer, r.startOffset, r.endContainer, r.endOffset];
    let touched = false;
    for (const el of ui.editor.querySelectorAll('b, i')) {
      const fresh = h(el.tagName === 'B' ? 'strong' : 'em', {});
      fresh.append(...el.childNodes);
      el.replaceWith(fresh);
      touched = true;
    }
    if (!touched || !saved) return;
    try {
      const nr = document.createRange(); nr.setStart(saved[0], saved[1]); nr.setEnd(saved[2], saved[3]);
      sel.removeAllRanges(); sel.addRange(nr);
    } catch { /* selection container moved out of the editor */ }
  }

  function blockOf(node) {
    if (node === ui.editor) return null;
    while (node && node.parentNode !== ui.editor) {
      if (node.tagName === 'LI' && node.parentNode?.parentNode === ui.editor) return node;
      node = node.parentNode;
    }
    return node;
  }

  function setBlockType(type) {
    const range = editorRange() || ui.lastRange;
    if (!range || !ui.editor.contains(range.startContainer)) { reflectSelection(); return; }
    const saved = [range.startContainer, range.startOffset, range.endContainer, range.endOffset];
    const first = blockOf(range.startContainer);
    const last = blockOf(range.endContainer);
    const targets = [];
    for (let n = first; n; n = n.nextSibling) { targets.push(n); if (n === last) break; }
    for (const node of targets) {
      if (!node || node === ui.editor) continue;
      const fresh = h(TAG_OF[type], {});
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'UL' || node.tagName === 'OL') continue;
        fresh.append(...node.childNodes);
      } else fresh.append(node.cloneNode());
      if (!fresh.firstChild) fresh.append(h('br'));
      if (node.parentNode === ui.editor) node.replaceWith(fresh);
    }
    try {
      const r = document.createRange();
      r.setStart(saved[0], saved[1]); r.setEnd(saved[2], saved[3]);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    } catch { /* selection could not be restored */ }
    ui.editor.focus();
    const ch = current();
    if (ch) { ch.blocks = parseEditor(ui.editor); changed(); }
  }

  function reflectSelection() {
    if (!ui?.editor || !ui.editor.isConnected) return;
    const range = editorRange();
    if (!range) return;
    ui.lastRange = range.cloneRange();
    for (const btn of ui.fmtButtons) {
      let on = false;
      try { on = document.queryCommandState(btn.dataset.format); } catch { /* unsupported */ }
      btn.setAttribute('aria-pressed', String(on));
      btn.classList.toggle('active', on);
    }
    const block = blockOf(range.startContainer);
    const type = block?.nodeType === Node.ELEMENT_NODE ? TYPE_OF[block.tagName] || 'p' : 'p';
    if (ui.blockSelect.value !== type) ui.blockSelect.value = type;
  }
  document.addEventListener('selectionchange', () => { if (ui && state.screen === 'manuscript') reflectSelection(); });

  // ---------- chapters ----------
  function addChapter() {
    const ch = { id: newId(), title: `Chapter ${chapters().length + 1}`, blocks: [] };
    chapters().push(ch);
    ui.currentId = ch.id;
    scheduleSave();
    draw();
    ui.editor?.focus();
  }
  function selectChapter(id) {
    if (id === ui.currentId) return;
    ui.currentId = id;
    drawList();
    drawMain();
  }
  function moveChapter(from, to) {
    const list = chapters();
    if (to < 0 || to >= list.length) return;
    const [ch] = list.splice(from, 1);
    list.splice(to, 0, ch);
    scheduleSave();
    drawList();
  }
  async function deleteChapter(ch) {
    const ok = await confirmDialog(`Delete “${ch.title || 'Untitled chapter'}”?`, { title: 'Delete chapter', confirmLabel: 'Delete', danger: true, detail: chapterWords(ch) ? 'Its text will be removed from the manuscript.' : '' });
    if (!ok || !ui) return;
    const list = chapters();
    const index = list.indexOf(ch);
    if (index < 0) return;
    list.splice(index, 1);
    if (ui.currentId === ch.id) ui.currentId = list[Math.min(index, list.length - 1)]?.id || null;
    scheduleSave();
    draw();
  }

  // ---------- AI ----------
  async function writeWithAi() {
    const ch = current();
    if (!ch) return;
    const book = state.book;
    const existing = chapterText(ch);
    if (existing && !(await confirmDialog('Replace this chapter’s text with a new AI version?', { title: 'Rewrite chapter', confirmLabel: 'Rewrite' }))) return;
    const index = chapters().indexOf(ch);
    const context = chapters().slice(0, index).map((c) => `${c.title}\n${chapterText(c)}`).join('\n\n').slice(-4000);
    const button = ui.aiButton;
    button.disabled = true;
    button.textContent = 'Writing…';
    try {
      const result = await api.generateChapter({
        bookTitle: book.title, chapterTitle: ch.title, readingLevel: book.builder?.readingLevel || 'early-reader', language: book.language || 'en',
        wordLimit: limitFor(book), context, current: existing, instruction: ui.instruction?.value.trim() || '',
      });
      ch.blocks = textToBlocks(result?.text);
      scheduleSave();
      if (ui && ui.currentId === ch.id) { drawList(); drawMain(); }
    } catch (error) {
      toast(cleanError(error), { label: 'Open settings', run: openAiSettings });
    } finally {
      if (button.isConnected) { button.disabled = false; updateCounts(); }
    }
  }

  // ---------- lay out ----------
  async function layOut() {
    const book = state.book;
    const list = chapters();
    if (!list.length) { toast('Add a chapter first'); return; }
    const pages = book.pages.slice();
    if (pages[0]?.layout !== 'cover') pages.unshift({ id: newId(), layout: 'cover', text: '', fontSize: 48 });
    const fontSize = PAGE_FONT[book.builder?.readingLevel] || 24;
    let replacing = 0;
    list.forEach((ch, i) => {
      const text = chapterText(ch);
      const page = pages[i + 1];
      if (page) {
        if (page.text?.trim() && page.text !== text) replacing += 1;
      }
    });
    if (replacing && !(await confirmDialog(`This will change the words on ${replacing} existing ${replacing === 1 ? 'page' : 'pages'}.`, {
      title: 'Lay out into pages', confirmLabel: 'Update pages', detail: 'Pictures, layouts and decorations on those pages stay as they are.',
    }))) return;
    list.forEach((ch, i) => {
      const text = chapterText(ch);
      if (pages[i + 1]) pages[i + 1] = { ...pages[i + 1], text };
      else pages.push({ id: newId(), layout: 'image-top', text, fontSize });
    });
    book.pages = pages;
    await saveNow();
    let saved = await api.saveBook(book);
    if (window.STORYLOOM_TEMPLATES?.applyTheme && saved.builder?.templateId) {
      saved = await api.saveBook(window.STORYLOOM_TEMPLATES.applyTheme(saved, saved.builder.templateId));
    }
    state.book = saved;
    state.pageIndex = 0;
    await navigate('designer');
  }

  function leave() {
    if (!ui) return;
    document.removeEventListener('storyloom:book-meta', ui.onMeta);
    const ch = state.book && current();
    if (ch && ui.editor?.isConnected) ch.blocks = parseEditor(ui.editor);
    if (state.book) { scheduleSave(); saveNow(); }
  }

  registerScreen('manuscript', { label: 'Manuscript', scope: 'book', render, leave });
})();
