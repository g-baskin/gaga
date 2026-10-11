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

  const ui = { host: null, tab: 'narration', recorder: null, preview: null, previewButton: null, busy: false };

  // ---------- audio helpers ----------
  const audioSet = new Set(); // Every Audio the Studio or player started, so leaving can stop them all.
  function makeAudio(bookId, name) {
    const audio = new Audio(mediaUrl(bookId, name));
    audioSet.add(audio);
    return audio;
  }
  function stopAudio(audio) {
    if (!audio) return;
    audio.onended = null;
    audio.onerror = null;
    audio.ontimeupdate = null;
    audio.onloadedmetadata = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
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
  async function startRecording(onTick, isCurrent, onError) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!isCurrent()) { stream.getTracks().forEach((t) => t.stop()); return null; }
    const chunks = [];
    let recorder, ctxA, source, analyser, timer;
    let released = false;
    let stopping = false;
    let finish;
    // Resolve cancellation as null, including cancellation while stop() is collecting the final chunk.
    const result = new Promise((resolve) => { finish = resolve; });
    const release = () => {
      if (released) return;
      released = true;
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
      source?.disconnect();
      analyser?.disconnect();
      ctxA?.close().catch(() => {});
    };
    const cancel = () => {
      if (recorder) {
        recorder.onstop = recorder.ondataavailable = recorder.onerror = null;
        try { if (recorder.state !== 'inactive') recorder.stop(); }
        catch { /* A failed recorder still needs its microphone and pending stop released. */ }
        finally { release(); finish(null); }
      } else { release(); finish(null); }
    };
    const fail = (error) => { cancel(); onError(error); };
    const started = performance.now();
    try {
      recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      recorder.onerror = (e) => fail(e.error || new Error('Recording stopped unexpectedly. Please try again.'));
      recorder.onstop = async () => {
        release();
        try { finish(new Uint8Array(await new Blob(chunks, { type: 'audio/webm' }).arrayBuffer())); }
        catch (error) { fail(error); }
      };
      ctxA = new AudioContext();
      analyser = ctxA.createAnalyser();
      analyser.fftSize = 512;
      source = ctxA.createMediaStreamSource(stream);
      source.connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      recorder.start(250);
      timer = setInterval(() => {
        analyser.getByteTimeDomainData(buf);
        let peak = 0;
        for (const v of buf) peak = Math.max(peak, Math.abs(v - 128) / 128);
        onTick((performance.now() - started) / 1000, peak);
      }, 100);
      return {
        elapsed: () => (performance.now() - started) / 1000,
        stop: () => {
          if (!stopping && recorder.state !== 'inactive') {
            stopping = true;
            try { recorder.stop(); } catch (error) { fail(error); }
          }
          return result;
        },
        cancel,
      };
    } catch (error) { cancel(); throw error; }
  }

  function stopEverything() {
    if (ui.recorder) { ui.recorder.cancel(); ui.recorder = null; }
    stopPreview();
    for (const audio of [...audioSet]) stopAudio(audio);
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
    if (!host || !book() || ui.recorder) return;
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
        h('button', { class: 'btn primary', id: 'studio-readalong', onclick: () => {
          if (ui.recorder) return toast('Stop recording before playing the read-along');
          stopEverything(); draw(); window.openReadAlong(book(), state.pageIndex);
        } }, '▶ Play read-along')));
    const tabs = h('div', { class: 'segmented studio-tabs', role: 'tablist' }, [['narration', 'Narration'], ['music', 'Music'], ['interactive', 'Interactive']].map(([id, label]) =>
      h('button', { class: `studio-tab${ui.tab === id ? ' active' : ''}`, 'data-studio-tab': id, role: 'tab', 'aria-selected': String(ui.tab === id), onclick: () => { if (ui.recorder) return; stopPreview(); ui.tab = id; draw(); } }, label)));
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

  function stopPreview() {
    if (ui.preview) stopAudio(ui.preview);
    if (ui.previewButton) ui.previewButton.textContent = ui.previewButton.dataset.idle;
    ui.preview = null;
    ui.previewButton = null;
  }
  function togglePreview(name, button, { volume = 1, loop = false } = {}) {
    if (ui.preview && ui.preview.dataset.name === name) { stopPreview(); if (button) button.textContent = button.dataset.idle; return; }
    stopPreview();
    const audio = makeAudio(book().id, name);
    audio.dataset.name = name;
    audio.volume = volume;
    audio.loop = loop;
    ui.preview = audio;
    ui.previewButton = button;
    if (button) { button.dataset.idle ||= button.textContent; button.textContent = '❚❚ Pause'; }
    audio.onended = () => { if (ui.preview === audio) stopPreview(); };
    const failed = () => {
      if (ui.preview !== audio) return;
      stopPreview();
      toast('Couldn’t play this audio. Try again or replace the file.');
    };
    audio.onerror = failed;
    audio.play().catch(failed);
    return audio;
  }

  // Records a clip with a live timer/meter inside `slot`, then calls onSaved(name, duration) once it is saved.
  // The session in ui.recorder moves through 'starting' (waiting for the microphone), 'recording', and 'saving'.
  async function recordInto(slot, onSaved) {
    if (ui.recorder || !slot.isConnected) return;
    const b = book();
    const time = h('span', { class: 'studio-rec-time' }, '0:00');
    const level = h('span', { class: 'studio-meter-fill' });
    const stop = h('button', { class: 'btn danger-fill', id: 'studio-stop' }, '■ Stop');
    let rec;
    let cancelled = false;
    const session = { phase: 'starting', saving: null, cancel: () => { cancelled = true; rec?.cancel(); } };
    const isCurrent = () => !cancelled && ui.recorder === session && book() === b && slot.isConnected;
    const failed = (error) => {
      if (!isCurrent()) return;
      session.cancel();
      ui.recorder = null;
      toast(`Couldn’t record audio: ${cleanError(error)}`);
      draw();
    };
    // Reserve the recorder before the permission prompt, so repeated clicks cannot open more streams.
    ui.recorder = session;
    try {
      rec = await startRecording((t, peak) => { time.textContent = fmt(t); level.style.width = `${Math.min(100, Math.round(peak * 160))}%`; }, isCurrent, failed);
    } catch (error) { failed(error); return; }
    if (!rec || !isCurrent()) {
      session.cancel();
      if (ui.recorder === session) ui.recorder = null;
      return;
    }
    slot.replaceChildren(h('div', { class: 'studio-recording', 'data-recording': 'true' },
      h('span', { class: 'studio-rec-dot', 'aria-hidden': 'true' }), time, h('span', { class: 'studio-meter' }, level), stop));
    session.phase = 'recording';
    // Stops and saves the take; repeated calls share one save. `quick` skips reading the file's length
    // (it can take seconds) and uses the timer instead, for when the window is closing.
    session.save = ({ quick = false } = {}) => {
      session.saving ||= (async () => {
        session.phase = 'saving';
        stop.disabled = true;
        stop.textContent = 'Saving…';
        try {
          const elapsed = rec.elapsed();
          const bytes = await rec.stop();
          if (!bytes || !isCurrent()) return;
          const name = await api.saveRecording(b.id, bytes);
          if (!isCurrent()) return;
          const duration = quick ? elapsed : await durationOf(b.id, name, elapsed);
          if (!isCurrent()) return;
          ui.audioNames = [...new Set([...(ui.audioNames || []), name])];
          onSaved(name, duration);
        } catch (error) { failed(error); }
        finally {
          session.cancel();
          if (ui.recorder === session) { ui.recorder = null; draw(); }
        }
      })();
      return session.saving;
    };
    stop.onclick = () => session.save();
  }

  // Runs before any navigation away from Studio (and before the window closes) so a take is never dropped
  // by surprise. Resolves false to stay. Waiting for the microphone is not a take yet, so leaving cancels it.
  let leavePrompt = null;
  async function beforeLeave({ closing = false } = {}) {
    const session = ui.recorder;
    if (!session || session.phase === 'starting') return true;
    // The window gives only a few seconds before it closes, too short for a question: keep the take.
    if (closing) { await session.save({ quick: true }); return true; }
    if (session.phase === 'saving') { await session.saving; return true; }
    leavePrompt ||= askToLeave(session).finally(() => { leavePrompt = null; });
    return leavePrompt;
  }
  async function askToLeave(session) {
    const choice = await new Promise((resolve) => {
      const pick = (value, close) => { resolve(value); close(); };
      const dialog = modal('You’re still recording', (close) => h('div', { class: 'form confirm-dialog', 'data-leave-recording': '' },
        h('p', {}, 'Save this recording before you leave Studio?'),
        h('div', { class: 'form-actions' },
          h('button', { type: 'button', class: 'btn ghost', 'data-leave-choice': 'stay', onclick: () => pick('stay', close) }, 'Keep recording'),
          h('button', { type: 'button', class: 'btn ghost danger', 'data-leave-choice': 'discard', onclick: () => pick('discard', close) }, 'Discard'),
          h('button', { type: 'button', class: 'btn primary', 'data-leave-choice': 'save', onclick: () => pick('save', close) }, 'Save and leave'))),
        () => resolve('stay'));
      dialog.addEventListener('close', () => resolve('stay')); // Esc closes the dialog without calling onClose.
    });
    if (ui.recorder !== session) return true; // It finished or failed while the question was open.
    if (choice === 'stay') return false;
    if (choice === 'save') await session.save();
    return true; // 'discard': leave() cancels the session.
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
      try {
        const name = await withBusy(readPage, 'Reading…', () => api.generateSpeech({ bookId: book().id, text: pageText(page), voice: voice.value }));
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
      h('p', { class: 'muted small-print' }, 'Uses the voice service chosen in Account (OpenRouter or your own service). The page’s words are sent to it.'),
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
        w: SOUND_SIZE, h: SOUND_SIZE, rotation: 0, opacity: 1, locked: false, char, label, sound: null, fill: '#fff4d6', stroke: BOOK_INK,
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

  registerScreen('studio', { label: 'Studio', scope: 'book', render, beforeLeave, leave: () => { stopEverything(); ui.host = null; } });

  // ---------- read-along player ----------
  window.openReadAlong = function openReadAlong(theBook, startIndex = 0) {
    const b = theBook;
    if (!b?.pages?.length) return toast('This book has no pages yet');
    let index = Math.min(Math.max(0, startIndex | 0), b.pages.length - 1);
    let playing = false;
    let narration = null;
    let timer = null;
    let music = null;
    let closed = false;
    let playback = 0;
    let remaining = 4000;
    let timerStarted = 0;
    const sounds = new Set();
    const narr = b.audio?.narration || {};

    const stage = h('div', { class: 'studio-ra-stage' });
    const counter = h('span', { class: 'studio-ra-count' });
    const playBtn = h('button', { class: 'btn primary', id: 'readalong-play', onclick: () => (playing ? pause() : play()) }, '▶ Play');
    const restartBtn = h('button', { class: 'btn ghost studio-ra-restart', id: 'readalong-restart', onclick: () => go(index) }, '↺ Restart page');
    const prev = h('button', { class: 'btn ghost studio-ra-nav', id: 'readalong-prev', 'aria-label': 'Previous page', onclick: () => go(index - 1) }, '‹');
    const next = h('button', { class: 'btn ghost studio-ra-nav', id: 'readalong-next', 'aria-label': 'Next page', onclick: () => go(index + 1) }, '›');
    // Timeline for the page's narration: elapsed time, a slider to jump within it, and its length.
    const seek = h('input', { type: 'range', class: 'studio-ra-seek', id: 'readalong-seek', min: '0', max: '0', step: '0.1', value: '0',
      'aria-label': 'Narration position', oninput: () => seekTo(Number(seek.value)) });
    const elapsedLabel = h('span', { class: 'studio-ra-time', id: 'readalong-elapsed' }, '0:00');
    const totalLabel = h('span', { class: 'studio-ra-time', id: 'readalong-duration' }, '0:00');
    const timeline = h('div', { class: 'studio-ra-timeline' }, elapsedLabel, seek, totalLabel);
    const noNarration = h('span', { class: 'studio-ra-none', id: 'readalong-no-narration' }, 'No narration on this page');
    const dialog = h('dialog', { class: 'studio-readalong', 'data-playing': 'false', 'aria-label': `Read-along: ${b.title}` },
      h('header', { class: 'studio-ra-bar' },
        h('strong', {}, b.title || 'Read-along'), counter,
        h('button', { class: 'icon-btn studio-ra-close', id: 'readalong-close', 'aria-label': 'Close', onclick: () => dialog.close() }, '×')),
      h('div', { class: 'studio-ra-body' }, prev, stage, next),
      h('footer', { class: 'studio-ra-foot' },
        h('div', { class: 'studio-ra-controls' }, playBtn, restartBtn, timeline, noNarration),
        h('span', { class: 'muted small-print' }, 'Arrow keys turn pages · Tap ♪ buttons to hear them · Esc closes')));

    const stopSounds = () => {
      for (const audio of sounds) stopAudio(audio);
      sounds.clear();
    };
    const stopPageAudio = () => {
      ++playback; // Invalidate callbacks from an earlier page or play attempt.
      clearTimeout(timer); timer = null;
      remaining = 4000;
      if (narration) { stopAudio(narration); narration = null; }
      stopSounds();
      updateTimeline();
    };
    // The page's narration audio, made on first use (playing or seeking) and kept until the page changes.
    function pageNarration() {
      const n = narr[b.pages[index].id];
      if (!n) return null;
      if (!narration) {
        narration = makeAudio(b.id, n.file);
        narration.ontimeupdate = updateTimeline;
        narration.onloadedmetadata = updateTimeline;
      }
      return narration;
    }
    function updateTimeline() {
      const n = narr[b.pages[index].id];
      timeline.hidden = !n;
      noNarration.hidden = Boolean(n);
      if (!n) return;
      // Saved durations are measured when the clip is added; recorded WebM files often report no length of their own.
      const total = Number.isFinite(narration?.duration) && narration.duration > 0 ? narration.duration : n.duration || 0;
      const at = Math.min(total, narration?.currentTime || 0);
      seek.max = String(total);
      seek.value = String(at);
      seek.disabled = !total;
      seek.setAttribute('aria-valuetext', `${fmt(at)} of ${fmt(total)}`);
      elapsedLabel.textContent = fmt(at);
      totalLabel.textContent = fmt(total);
    }
    function seekTo(seconds) {
      const audio = pageNarration();
      if (!audio || closed) return;
      audio.currentTime = seconds;
      updateTimeline();
    }
    function draw() {
      const page = b.pages[index];
      dialog.dataset.page = String(index);
      counter.textContent = `Page ${index + 1} of ${b.pages.length}`;
      prev.disabled = index === 0;
      next.disabled = index === b.pages.length - 1;
      const w = Math.max(200, window.innerWidth - 200);
      const hgt = Math.max(200, window.innerHeight - 160);
      stage.replaceChildren(scaledPage(page, b, w, hgt));
      updateTimeline();
    }
    function startPage() {
      if (!playing || closed) return;
      const attempt = ++playback;
      const active = () => !closed && playing && playback === attempt;
      const audio = pageNarration();
      if (audio) {
        const failed = () => {
          if (!active() || narration !== audio) return;
          pause();
          stopAudio(audio); narration = null;
          updateTimeline();
          toast('Couldn’t play this page’s narration. Try Play again or turn the page.');
        };
        audio.onended = () => { if (active() && narration === audio) advance(); };
        audio.onerror = failed;
        audio.play().catch(failed);
      } else {
        timerStarted = performance.now();
        timer = setTimeout(() => { if (active()) advance(); }, remaining);
      }
    }
    function advance() {
      if (closed || !playing) return;
      if (index < b.pages.length - 1) go(index + 1);
      else { pause(); stopPageAudio(); }
    }
    function go(i) {
      if (closed || i < 0 || i >= b.pages.length) return;
      stopPageAudio();
      index = i; draw(); startPage();
    }
    function play() {
      if (closed || playing) return;
      playing = true;
      playBtn.textContent = '❚❚ Pause';
      dialog.dataset.playing = 'true';
      startPage();
      if (b.audio?.music && !music) {
        music = makeAudio(b.id, b.audio.music.file);
        music.volume = b.audio.music.volume;
        music.loop = b.audio.music.loop;
      }
      if (music) {
        const audio = music;
        const failed = () => {
          if (closed || !playing || music !== audio || !audio.onerror) return;
          stopAudio(audio); music = null;
          toast('Couldn’t play the background music. Narration can continue.');
        };
        // Pause clears this handler: an interrupted play request is not a failed file.
        audio.onerror = failed;
        audio.play().catch(() => { if (audio.onerror === failed) failed(); });
      }
    }
    function pause() {
      ++playback;
      playing = false;
      playBtn.textContent = '▶ Play';
      dialog.dataset.playing = 'false';
      if (timer !== null) remaining = Math.max(0, remaining - (performance.now() - timerStarted));
      clearTimeout(timer); timer = null;
      narration?.pause();
      if (music) { music.onerror = null; music.pause(); }
      stopSounds();
    }
    stage.addEventListener('click', (e) => {
      const el = e.target.closest('.el-sound');
      if (!el || !el.dataset.sound) return;
      if (closed) return;
      stopSounds();
      const audio = makeAudio(b.id, el.dataset.sound);
      sounds.add(audio);
      audio.onended = () => { sounds.delete(audio); stopAudio(audio); };
      const failed = () => {
        if (closed || !sounds.has(audio)) return;
        sounds.delete(audio); stopAudio(audio);
        toast('Couldn’t play this sound. Try again or replace its audio in Studio.');
      };
      audio.onerror = failed;
      audio.play().then(() => {
        if (!closed && sounds.has(audio)) dialog.dataset.lastSound = el.dataset.sound;
      }).catch(failed);
    });
    dialog.addEventListener('keydown', (e) => {
      if (e.target === seek) return; // Arrow keys move the slider there, not the page.
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    });
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    dialog.addEventListener('close', () => {
      closed = true;
      pause();
      stopPageAudio();
      if (music) { stopAudio(music); music = null; }
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
