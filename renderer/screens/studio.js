(() => {
  'use strict';
  // Studio: per-page narration (microphone, imported file, or AI voice), background music,
  // tap-to-play sound buttons, and the read-along player (window.openReadAlong).

  const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  const SOUND_PALETTE = [
    ['🔔', 'Bell'], ['🐶', 'Dog'], ['🐱', 'Cat'], ['🦁', 'Lion'], ['🚂', 'Train'], ['🥁', 'Drum'], ['⭐', 'Star'],
    ...Array.from({ length: 9 }, (_, i) => [`${i + 1}\uFE0F\u20E3`, String(i + 1)]),
    ...Array.from({ length: 26 }, (_, i) => [String.fromCodePoint(0x1f1e6 + i), String.fromCharCode(65 + i)]),
  ];
  const SOUND_SIZE = 90;

  const ui = { host: null, tab: 'narration', recorder: null, preview: null, busy: false };

  // ---------- audio helpers ----------
  const audioSet = new Set(); // Every Audio the Studio or player started, so leaving can stop them all.
  function makeAudio(bookId, name) {
    const audio = new Audio(mediaUrl(bookId, name));
    audioSet.add(audio);
    return audio;
  }
  function stopAudio(audio) {
    if (!audio) return;
    audio.pause();
    audioSet.delete(audio);
  }
  const playingCount = () => [...audioSet].filter((a) => !a.paused && !a.ended).length;

  // Reads the duration from metadata. MediaRecorder WebM has no duration header, so seek far to force it.
  function durationOf(bookId, name, fallback = 0) {
    return new Promise((resolve) => {
      const audio = new Audio(mediaUrl(bookId, name));
      const done = (value) => { clearTimeout(timer); audio.src = ''; resolve(Number.isFinite(value) && value > 0 ? value : fallback); };
      const timer = setTimeout(() => done(fallback), 5000);
      audio.preload = 'metadata';
      audio.onerror = () => done(fallback);
      audio.onloadedmetadata = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) return done(audio.duration);
        audio.ontimeupdate = () => { audio.ontimeupdate = null; done(audio.duration); };
        audio.currentTime = 1e7;
      };
    });
  }
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  // Microphone recording to WebM with a live level reading.
  async function startRecording(onTick) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const ctxA = new AudioContext();
    const analyser = ctxA.createAnalyser();
    analyser.fftSize = 512;
    ctxA.createMediaStreamSource(stream).connect(analyser);
    const buf = new Uint8Array(analyser.fftSize);
    const started = performance.now();
    const timer = setInterval(() => {
      analyser.getByteTimeDomainData(buf);
      let peak = 0;
      for (const v of buf) peak = Math.max(peak, Math.abs(v - 128) / 128);
      onTick((performance.now() - started) / 1000, peak);
    }, 100);
    const release = () => {
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
      ctxA.close().catch(() => {});
    };
    recorder.start(250);
    return {
      elapsed: () => (performance.now() - started) / 1000,
      stop: () => new Promise((resolve) => {
        recorder.onstop = async () => { release(); resolve(new Uint8Array(await new Blob(chunks, { type: 'audio/webm' }).arrayBuffer())); };
        recorder.stop();
      }),
      cancel: () => { recorder.onstop = null; if (recorder.state !== 'inactive') recorder.stop(); release(); },
    };
  }

  function stopEverything() {
    if (ui.recorder) { ui.recorder.cancel(); ui.recorder = null; }
    for (const audio of [...audioSet]) stopAudio(audio);
    ui.preview = null;
  }

  // ---------- helpers on the book ----------
  const book = () => state.book;
  const audioOf = () => {
    const b = book();
    b.audio ||= { narration: {}, music: null, voice: '' };
    b.audio.narration ||= {};
    return b.audio;
  };
  const currentPage = () => book().pages[Math.min(state.pageIndex, book().pages.length - 1)] || book().pages[0];
  const pageText = (page) => [page.text, ...(page.elements || []).filter((e) => e.type === 'text').map((e) => e.text)]
    .map((t) => (t || '').trim()).filter(Boolean).join('\n\n');
  const aiError = (error) => toast(cleanError(error), { label: 'Open settings', run: openAiSettings });

  // ---------- screen ----------
  async function render(host) {
    stopEverything();
    ui.host = host;
    if (!book().pages.length) {
      host.replaceChildren(h('section', { class: 'studio-empty empty' }, h('h1', {}, 'No pages yet'), h('p', { class: 'muted' }, 'Add pages in the Designer, then come back to narrate them.')));
      return;
    }
    state.pageIndex = Math.min(Math.max(0, state.pageIndex || 0), book().pages.length - 1);
    ui.audioNames = (await run(() => api.listAudio(book().id))) || [];
    draw();
  }

  function draw() {
    const host = ui.host;
    if (!host || !book()) return;
    const b = book();
    const page = currentPage();
    const narr = audioOf().narration;
    const strip = h('div', { class: 'studio-strip', 'aria-label': 'Pages' }, b.pages.map((p, i) =>
      h('button', {
        class: `studio-thumb${i === state.pageIndex ? ' active' : ''}`, 'data-page-index': String(i), title: `Page ${i + 1}`,
        onclick: () => { if (ui.recorder) return; stopPreview(); state.pageIndex = i; draw(); },
      }, scaledPage(p, b, 104, 104),
      h('span', { class: 'studio-thumb-num' }, String(i + 1)),
      narr[p.id] ? h('span', { class: 'studio-thumb-note', 'data-narrated': 'true', title: 'Narrated' }, '♪') : null)));
    const stage = h('div', { class: 'studio-stage' });
    const header = h('div', { class: 'studio-header' },
      h('div', {}, h('h1', {}, 'Studio'), h('p', { class: 'muted' }, `Page ${state.pageIndex + 1} of ${b.pages.length}`)),
      h('div', { class: 'studio-header-actions' },
        h('button', { class: 'btn primary', id: 'studio-readalong', onclick: () => { stopEverything(); draw(); window.openReadAlong(book(), state.pageIndex); } }, '▶ Play read-along')));
    const tabs = h('div', { class: 'segmented studio-tabs', role: 'tablist' }, [['narration', 'Narration'], ['music', 'Music'], ['interactive', 'Interactive']].map(([id, label]) =>
      h('button', { class: `studio-tab${ui.tab === id ? ' active' : ''}`, 'data-studio-tab': id, role: 'tab', 'aria-selected': String(ui.tab === id), onclick: () => { if (ui.recorder) return; ui.tab = id; draw(); } }, label)));
    const panel = ui.tab === 'music' ? musicPanel() : ui.tab === 'interactive' ? interactivePanel(page) : narrationPanel(page);
    host.replaceChildren(h('div', { class: 'studio' },
      strip,
      h('section', { class: 'studio-center' }, header, stage),
      h('aside', { class: 'studio-side' }, tabs, panel)));
    requestAnimationFrame(() => {
      const w = Math.max(200, stage.clientWidth - 48);
      const hgt = Math.max(200, stage.clientHeight - 48);
      stage.replaceChildren(scaledPage(page, b, w, hgt));
    });
  }

  function stopPreview() { if (ui.preview) { stopAudio(ui.preview); ui.preview = null; } }
  function togglePreview(name, button, { volume = 1, loop = false } = {}) {
    if (ui.preview && ui.preview.dataset.name === name) { stopPreview(); if (button) button.textContent = button.dataset.idle; return; }
    stopPreview();
    const audio = makeAudio(book().id, name);
    audio.dataset.name = name;
    audio.volume = volume;
    audio.loop = loop;
    ui.preview = audio;
    if (button) { button.dataset.idle ||= button.textContent; button.textContent = '❚❚ Pause'; }
    audio.onended = () => { if (ui.preview === audio) stopPreview(); if (button) button.textContent = button.dataset.idle; };
    audio.play().catch((e) => { toast(cleanError(e)); stopPreview(); });
    return audio;
  }

  // Records a clip with a live timer/meter inside `slot`; resolves the saved asset name and duration (or null).
  async function recordInto(slot, onSaved) {
    const time = h('span', { class: 'studio-rec-time' }, '0:00');
    const level = h('span', { class: 'studio-meter-fill' });
    const stop = h('button', { class: 'btn danger-fill', id: 'studio-stop' }, '■ Stop');
    let rec;
    try {
      rec = await startRecording((t, peak) => { time.textContent = fmt(t); level.style.width = `${Math.min(100, Math.round(peak * 160))}%`; });
    } catch (error) {
      toast(`Couldn’t use the microphone: ${cleanError(error)}`);
      return;
    }
    ui.recorder = rec;
    slot.replaceChildren(h('div', { class: 'studio-recording', 'data-recording': 'true' },
      h('span', { class: 'studio-rec-dot', 'aria-hidden': 'true' }), time, h('span', { class: 'studio-meter' }, level), stop));
    stop.onclick = async () => {
      stop.disabled = true;
      stop.textContent = 'Saving…';
      const elapsed = rec.elapsed();
      const bytes = await rec.stop();
      ui.recorder = null;
      const name = await run(() => api.saveRecording(book().id, bytes));
      if (name) {
        const duration = await durationOf(book().id, name, elapsed);
        ui.audioNames = [...new Set([...(ui.audioNames || []), name])];
        onSaved(name, duration);
      }
      draw();
    };
  }

  // ---------- narration ----------
  function narrationPanel(page) {
    const audio = audioOf();
    const n = audio.narration[page.id];
    const slot = h('div', { class: 'studio-slot' });
    const setNarration = (file, duration, source) => {
      audio.narration[page.id] = { file, duration: Math.round(duration * 100) / 100, source };
      scheduleSave();
    };
    const record = async () => {
      if (n && !(await confirmDialog('Replace this page’s narration with a new recording?', { confirmLabel: 'Re-record' }))) return;
      stopPreview();
      await recordInto(slot, (name, d) => setNarration(name, d, 'recording'));
    };
    const importFile = async () => {
      const name = await run(() => api.importAudio(book().id));
      if (!name) return;
      setNarration(name, await durationOf(book().id, name), 'import');
      draw();
    };
    const SOURCE = { recording: 'Recorded', import: 'Imported file', ai: 'AI voice' };
    if (n) {
      const play = h('button', { class: 'btn secondary', id: 'studio-play', onclick: () => togglePreview(n.file, play) }, '▶ Play');
      slot.append(h('div', { class: 'studio-take', 'data-narration': n.file },
        h('div', { class: 'studio-take-info' }, h('strong', {}, SOURCE[n.source] || 'Narration'), h('span', { class: 'muted' }, fmt(n.duration || 0))),
        h('div', { class: 'studio-row' }, play,
          h('button', { class: 'btn ghost', id: 'studio-rerecord', onclick: record }, '● Re-record'),
          h('button', { class: 'btn ghost danger', id: 'studio-delete-narration', onclick: async () => {
            if (!(await confirmDialog('Remove the narration from this page?', { confirmLabel: 'Remove', danger: true }))) return;
            stopPreview(); delete audio.narration[page.id]; scheduleSave(); draw();
          } }, 'Delete'))));
    } else {
      slot.append(h('div', { class: 'studio-row' },
        h('button', { class: 'btn primary', id: 'studio-record', onclick: record }, '● Record'),
        h('button', { class: 'btn ghost', id: 'studio-import-narration', onclick: importFile }, 'Import file')));
    }
    if (n) slot.append(h('button', { class: 'btn ghost small', id: 'studio-import-narration', onclick: importFile }, 'Replace with a file…'));

    const voice = h('select', { id: 'studio-voice', onchange: () => { audio.voice = voice.value; scheduleSave(); } },
      VOICES.map((v) => h('option', { value: v, selected: v === (audio.voice || 'alloy') }, v[0].toUpperCase() + v.slice(1))));
    const progress = h('p', { class: 'muted small-print studio-progress', id: 'studio-ai-progress' });
    const readPage = h('button', { class: 'btn secondary', id: 'studio-ai-page', disabled: !pageText(page), onclick: async () => {
      if (n && !(await confirmDialog('Replace this page’s narration with an AI voice?', { confirmLabel: 'Replace' }))) return;
      readPage.disabled = true; readPage.textContent = 'Reading…';
      try {
        const name = await api.generateSpeech({ bookId: book().id, text: pageText(page), voice: voice.value });
        setNarration(name, await durationOf(book().id, name), 'ai');
      } catch (error) { aiError(error); }
      draw();
    } }, 'Read this page with AI');
    const all = h('button', { class: 'btn ghost', id: 'studio-ai-all', onclick: async () => {
      const b = book();
      const todo = b.pages.filter((p) => pageText(p));
      if (!todo.length) return toast('No pages have words to read yet');
      const existing = todo.filter((p) => audio.narration[p.id]).length;
      if (existing && !(await confirmDialog(`Replace narration on ${existing} ${existing === 1 ? 'page' : 'pages'} that already have it?`, { confirmLabel: 'Narrate all' }))) return;
      all.disabled = true; readPage.disabled = true;
      let i = 0;
      for (const p of todo) {
        progress.textContent = `Reading page ${b.pages.indexOf(p) + 1} (${++i} of ${todo.length})…`;
        try {
          const name = await api.generateSpeech({ bookId: b.id, text: pageText(p), voice: voice.value });
          audio.narration[p.id] = { file: name, duration: Math.round((await durationOf(b.id, name)) * 100) / 100, source: 'ai' };
          scheduleSave();
        } catch (error) { aiError(error); break; }
      }
      draw();
    } }, 'Narrate all pages');

    return h('div', { class: 'studio-panel', 'data-panel': 'narration' },
      h('h2', {}, 'Narration'),
      h('p', { class: 'muted' }, 'Read this page aloud, or bring in a recording. It plays when the page opens in the read-along.'),
      slot,
      h('hr', { class: 'studio-rule' }),
      h('h3', {}, 'AI voice'),
      h('p', { class: 'muted small-print' }, 'Uses the voice service you set up in Settings. The page’s words are sent to it.'),
      h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Voice'), voice),
      pageText(page) ? null : h('p', { class: 'muted small-print' }, 'This page has no words to read.'),
      h('div', { class: 'studio-row' }, readPage, all),
      progress,
      h('hr', { class: 'studio-rule' }),
      h('div', { class: 'studio-unavailable', 'data-unavailable': 'publish-online' },
        h('strong', {}, 'Publish to an online bookshelf'),
        h('p', { class: 'muted small-print' }, 'Not available in Storyloom — it needs a hosting service Storyloom doesn’t run. Use Export to make an EPUB or a narrated WAV you can share.'),
        h('button', { class: 'btn ghost small', onclick: () => run(() => navigate('export')) }, 'Go to Export')));
  }

  // ---------- music ----------
  function musicPanel() {
    const audio = audioOf();
    const m = audio.music;
    const choose = async () => {
      const name = await run(() => api.importAudio(book().id));
      if (!name) return;
      stopPreview();
      audio.music = { file: name, volume: m?.volume ?? 0.3, loop: m?.loop ?? true };
      scheduleSave(); draw();
    };
    const body = [];
    if (m) {
      const vol = h('input', { type: 'range', id: 'studio-music-volume', min: '0', max: '1', step: '0.05', value: String(m.volume),
        oninput: () => { m.volume = Number(vol.value); volLabel.textContent = `${Math.round(m.volume * 100)}%`; if (ui.preview) ui.preview.volume = m.volume; scheduleSave(); } });
      const volLabel = h('span', { class: 'muted' }, `${Math.round(m.volume * 100)}%`);
      const play = h('button', { class: 'btn secondary', id: 'studio-music-play', onclick: () => togglePreview(m.file, play, { volume: m.volume, loop: m.loop }) }, '▶ Preview');
      body.push(
        h('div', { class: 'studio-take', 'data-music': m.file }, h('strong', {}, 'Background track'), h('span', { class: 'muted small-print' }, m.file)),
        h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Volume'), h('div', { class: 'studio-row' }, vol, volLabel)),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'studio-music-loop', checked: m.loop, onchange: (e) => { m.loop = e.target.checked; if (ui.preview) ui.preview.loop = m.loop; scheduleSave(); } }), 'Loop the track'),
        h('div', { class: 'studio-row' }, play,
          h('button', { class: 'btn ghost', onclick: choose }, 'Replace…'),
          h('button', { class: 'btn ghost danger', id: 'studio-music-remove', onclick: () => { stopPreview(); audio.music = null; scheduleSave(); draw(); } }, 'Remove')));
    } else {
      body.push(h('button', { class: 'btn primary', id: 'studio-music-import', onclick: choose }, 'Choose a music file…'));
    }
    return h('div', { class: 'studio-panel', 'data-panel': 'music' },
      h('h2', {}, 'Background music'),
      h('p', { class: 'muted' }, 'Storyloom doesn’t include a music library — use your own tracks (WAV, MP3, M4A, OGG, or WebM). Music plays quietly under the narration in the read-along.'),
      ...body);
  }

  // ---------- interactive ----------
  function interactivePanel(page) {
    const b = book();
    const [W, H] = PAGE_PT[b.size];
    const sounds = (page.elements || []).filter((e) => e.type === 'sound');
    const add = (char, label) => {
      const n = (page.elements || []).filter((e) => e.type === 'sound').length;
      page.elements ||= [];
      // Start in the bottom-right corner, stepping left (then up a row), so new buttons don't cover centred text.
      const margin = Math.round(Math.min(W, H) * 0.05);
      const step = SOUND_SIZE + 8;
      const perRow = Math.max(1, Math.floor((W - 2 * margin) / step));
      page.elements.push({
        id: newId(), type: 'sound',
        x: Math.max(0, W - margin - SOUND_SIZE - (n % perRow) * step),
        y: Math.max(0, H - margin - SOUND_SIZE - (Math.floor(n / perRow) % 3) * step),
        w: SOUND_SIZE, h: SOUND_SIZE, rotation: 0, opacity: 1, locked: false, char, label, sound: null, fill: '#fff4d6', stroke: '#2a2433',
      });
      scheduleSave(); draw();
    };
    const palette = h('div', { class: 'studio-palette' }, SOUND_PALETTE.map(([char, label]) =>
      h('button', { class: 'studio-chip', 'data-sound-char': char, title: `Add ${label} button`, 'aria-label': `Add ${label} sound button`, onclick: () => add(char, label) }, char)));
    const list = sounds.map((el) => {
      const slot = h('div', { class: 'studio-slot' });
      const select = h('select', { class: 'studio-sound-select', onchange: () => { el.sound = select.value || null; scheduleSave(); draw(); } },
        h('option', { value: '' }, 'No sound yet'),
        [...new Set([...(ui.audioNames || []), ...(el.sound ? [el.sound] : [])])].map((name, i) => h('option', { value: name, selected: name === el.sound }, `Sound ${i + 1} · ${name.split('.').pop().toUpperCase()}`)));
      const test = h('button', { class: 'btn ghost small studio-sound-test', disabled: !el.sound, onclick: () => togglePreview(el.sound, test) }, '▶ Test');
      slot.append(h('div', { class: 'studio-row' },
        h('button', { class: 'btn ghost small studio-sound-record', onclick: () => { stopPreview(); recordInto(slot, (name) => { el.sound = name; scheduleSave(); }); } }, '● Record'),
        h('button', { class: 'btn ghost small studio-sound-import', onclick: async () => {
          const name = await run(() => api.importAudio(b.id));
          if (!name) return;
          ui.audioNames = [...new Set([...(ui.audioNames || []), name])];
          el.sound = name; scheduleSave(); draw();
        } }, 'Import…'), test));
      return h('li', { class: 'studio-sound-item', 'data-element-id': el.id },
        h('div', { class: 'studio-row' },
          h('span', { class: 'studio-sound-glyph' }, el.char),
          h('input', { class: 'studio-sound-label', value: el.label, maxlength: '80', placeholder: 'Label', 'aria-label': 'Label',
            oninput: (e) => { el.label = e.target.value; scheduleSave(); } }),
          h('button', { class: 'icon-btn danger studio-sound-delete', 'aria-label': 'Delete sound button', onclick: () => {
            stopPreview(); page.elements = page.elements.filter((x) => x.id !== el.id); scheduleSave(); draw();
          } }, '×')),
        select, slot);
    });
    return h('div', { class: 'studio-panel', 'data-panel': 'interactive' },
      h('h2', {}, 'Sound buttons'),
      h('p', { class: 'muted' }, 'Add a button to this page; readers tap it in the read-along to hear its sound. Move or resize it in the Designer.'),
      palette,
      h('h3', {}, sounds.length ? 'On this page' : 'No sound buttons on this page yet'),
      h('ul', { class: 'studio-sound-list' }, list));
  }

  registerScreen('studio', { label: 'Studio', scope: 'book', render, leave: () => { stopEverything(); ui.host = null; } });

  // ---------- read-along player ----------
  window.openReadAlong = function openReadAlong(theBook, startIndex = 0) {
    const b = theBook;
    if (!b?.pages?.length) return toast('This book has no pages yet');
    let index = Math.min(Math.max(0, startIndex | 0), b.pages.length - 1);
    let playing = false;
    let narration = null;
    let timer = null;
    let music = null;
    const sounds = new Set();
    const narr = b.audio?.narration || {};

    const stage = h('div', { class: 'studio-ra-stage' });
    const counter = h('span', { class: 'studio-ra-count' });
    const playBtn = h('button', { class: 'btn primary', id: 'readalong-play', onclick: () => (playing ? pause() : play()) }, '▶ Play');
    const prev = h('button', { class: 'btn ghost studio-ra-nav', id: 'readalong-prev', 'aria-label': 'Previous page', onclick: () => go(index - 1) }, '‹');
    const next = h('button', { class: 'btn ghost studio-ra-nav', id: 'readalong-next', 'aria-label': 'Next page', onclick: () => go(index + 1) }, '›');
    const dialog = h('dialog', { class: 'studio-readalong', 'aria-label': `Read-along: ${b.title}` },
      h('header', { class: 'studio-ra-bar' },
        h('strong', {}, b.title || 'Read-along'), counter,
        h('button', { class: 'icon-btn studio-ra-close', id: 'readalong-close', 'aria-label': 'Close', onclick: () => dialog.close() }, '×')),
      h('div', { class: 'studio-ra-body' }, prev, stage, next),
      h('footer', { class: 'studio-ra-foot' }, playBtn, h('span', { class: 'muted small-print' }, 'Arrow keys turn pages · Tap ♪ buttons to hear them · Esc closes')));

    const stopPageAudio = () => {
      clearTimeout(timer); timer = null;
      if (narration) { stopAudio(narration); narration = null; }
    };
    function draw() {
      const page = b.pages[index];
      dialog.dataset.page = String(index);
      counter.textContent = `Page ${index + 1} of ${b.pages.length}`;
      prev.disabled = index === 0;
      next.disabled = index === b.pages.length - 1;
      const w = Math.max(200, window.innerWidth - 200);
      const hgt = Math.max(200, window.innerHeight - 160);
      stage.replaceChildren(scaledPage(page, b, w, hgt));
    }
    function startPage() {
      stopPageAudio();
      if (!playing) return;
      const n = narr[b.pages[index].id];
      if (n) {
        narration = makeAudio(b.id, n.file);
        narration.onended = () => advance();
        narration.play().catch(() => { timer = setTimeout(advance, 4000); });
      } else timer = setTimeout(advance, 4000);
    }
    function advance() {
      if (index < b.pages.length - 1) go(index + 1);
      else pause();
    }
    function go(i) {
      if (i < 0 || i >= b.pages.length) return;
      index = i; draw(); startPage();
    }
    function play() {
      playing = true;
      playBtn.textContent = '❚❚ Pause';
      dialog.dataset.playing = 'true';
      if (b.audio?.music && !music) {
        music = makeAudio(b.id, b.audio.music.file);
        music.volume = b.audio.music.volume;
        music.loop = b.audio.music.loop;
        music.play().catch(() => {});
      } else music?.play().catch(() => {});
      startPage();
    }
    function pause() {
      playing = false;
      playBtn.textContent = '▶ Play';
      dialog.dataset.playing = 'false';
      stopPageAudio();
      music?.pause();
    }
    stage.addEventListener('click', (e) => {
      const el = e.target.closest('.el-sound');
      if (!el || !el.dataset.sound) return;
      const audio = makeAudio(b.id, el.dataset.sound);
      sounds.add(audio);
      audio.onended = () => { sounds.delete(audio); audioSet.delete(audio); };
      audio.play().then(() => { dialog.dataset.lastSound = el.dataset.sound; }).catch((err) => toast(cleanError(err)));
      dialog.dataset.lastSound = el.dataset.sound;
    });
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    });
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    dialog.addEventListener('close', () => {
      pause();
      if (music) { stopAudio(music); music = null; }
      for (const a of sounds) stopAudio(a);
      window.removeEventListener('resize', onResize);
      dialog.remove();
    });
    document.body.append(dialog);
    dialog.showModal();
    draw();
    playBtn.focus();
    return dialog;
  };
  // Test hook: how many Studio/player audio elements are currently playing.
  window.openReadAlong.playingCount = playingCount;
})();
