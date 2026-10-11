'use strict';
// Studio: record / import / AI narration, music, sound buttons, and the read-along player.
const { makeWav } = require('./mock-ai.cjs');

module.exports = async function studio(ctx) {
  const { js, pause } = ctx;
  const checks = {};
  const created = await ctx.store.create({
    title: 'Night Owl Songs', author: 'Test',
    pages: [
      { layout: 'text-only', text: 'The owl woke up when the moon came out.' },
      { layout: 'text-only', text: 'She hooted a soft hello to the stars.' },
      { layout: 'text-only', text: 'Then she flew home for breakfast.' },
    ],
  });
  const id = created.id;
  const saved = async () => { await js('saveNow()'); return ctx.store.read(id); };
  const pageIds = created.pages.map((p) => p.id);

  await ctx.navigate('studio', { bookId: id });
  await ctx.assertNoMissing();
  checks.rendered = await js(`Boolean(document.querySelector('.studio-stage .page')) && document.querySelectorAll('.studio-thumb').length === 3`);

  // Record narration for page 1.
  await ctx.click('#studio-record');
  await ctx.waitFor('[data-recording]');
  await pause(1200);
  await ctx.click('#studio-stop');
  await ctx.waitFor('[data-narration]');
  let book = await saved();
  const n0 = book.audio.narration[pageIds[0]];
  checks.recorded = Boolean(n0 && n0.file.endsWith('.webm') && n0.duration > 0 && n0.source === 'recording');
  checks.thumbMarked = await js(`Boolean(document.querySelector('.studio-thumb[data-page-index="0"] [data-narrated]'))`);
  await ctx.click('#studio-play');
  await pause(300);
  checks.played = await js('window.openReadAlong.playingCount() > 0');
  await ctx.click('#studio-play'); // pause

  // Import narration for page 2.
  await ctx.click('.studio-thumb', { index: 1 });
  await ctx.setOpenFile(await ctx.fixture('n.wav', makeWav(1)));
  await ctx.click('#studio-import-narration');
  await ctx.waitFor('[data-narration]');
  book = await saved();
  const n1 = book.audio.narration[pageIds[1]];
  checks.imported = Boolean(n1 && n1.source === 'import' && n1.duration > 0.9);

  // AI voice for page 3.
  await ctx.click('.studio-thumb', { index: 2 });
  await ctx.waitFor('#studio-ai-page');
  await js(`(() => { const s = $must('#studio-voice'); s.value = 'nova'; s.dispatchEvent(new Event('change')); return true; })()`);
  await ctx.click('#studio-ai-page');
  await ctx.waitFor('[data-narration]');
  book = await saved();
  const n2 = book.audio.narration[pageIds[2]];
  checks.aiVoice = Boolean(n2 && n2.source === 'ai') && book.audio.voice === 'nova';
  checks.publishUnavailable = await js(`Boolean(document.querySelector('[data-unavailable="publish-online"]'))`);

  // Music.
  await ctx.click('[data-studio-tab="music"]');
  await ctx.setOpenFile(await ctx.fixture('music.wav', makeWav(2)));
  await ctx.click('#studio-music-import');
  await ctx.waitFor('#studio-music-volume');
  await js(`(() => { const r = $must('#studio-music-volume'); r.value = '0.6'; r.dispatchEvent(new Event('input')); return true; })()`);
  book = await saved();
  checks.music = Boolean(book.audio.music && book.audio.music.file.endsWith('.wav') && Math.abs(book.audio.music.volume - 0.6) < 0.01 && book.audio.music.loop);

  // Interactive sound button on page 1.
  await ctx.click('.studio-thumb', { index: 0 });
  await ctx.click('[data-studio-tab="interactive"]');
  await ctx.click('[data-sound-char="🐶"]');
  await ctx.waitFor('.studio-sound-item');
  await ctx.setOpenFile(await ctx.fixture('woof.wav', makeWav(0.5)));
  await ctx.click('.studio-sound-import');
  await js(`$waitFor(() => !document.querySelector('.studio-sound-test')?.disabled && document.querySelector('.studio-sound-test')).then(() => true)`);
  book = await saved();
  const soundEl = book.pages[0].elements.find((e) => e.type === 'sound');
  checks.soundElement = Boolean(soundEl && soundEl.char === '🐶' && soundEl.sound && soundEl.sound.endsWith('.wav'));
  await ctx.screenshot();

  // Read-along player.
  await ctx.click('#studio-readalong');
  await ctx.waitFor('dialog.studio-readalong[open]');
  await ctx.screenshot('studio-readalong');
  checks.playerStart = (await js(`document.querySelector('dialog.studio-readalong').dataset.page`)) === '0';
  await ctx.click('dialog[open] .el-sound');
  await pause(300);
  checks.soundTapped = (await js(`document.querySelector('dialog.studio-readalong').dataset.lastSound`)) === soundEl.sound;
  checks.soundPlaying = await js('window.openReadAlong.playingCount() > 0');
  await ctx.click('#readalong-play');
  await pause(200);
  await ctx.key('Right');
  await pause(200);
  checks.nextPage = (await js(`document.querySelector('dialog.studio-readalong').dataset.page`)) === '1';
  await ctx.key('Escape');
  await pause(200);
  checks.closed = await js(`!document.querySelector('dialog.studio-readalong')`);
  checks.silent = await js('window.openReadAlong.playingCount() === 0 && [...document.querySelectorAll("audio")].every((a) => a.paused)');
  // Deterministic media lifecycle checks alongside the real recording/playback checks above.
  Object.assign(checks, await js(`(async () => {
    const NativeAudio = window.Audio;
    const made = [];
    const result = {};
    class TestAudio {
      constructor() { this.dataset = {}; this.paused = true; this.ended = false; this.currentTime = 0; made.push(this); }
      play() { this.paused = false; return new Promise((resolve, reject) => { this.resolve = resolve; this.reject = reject; }); }
      pause() { this.paused = true; }
      removeAttribute() {}
      load() {}
    }
    let dialog;
    const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
    try {
      window.Audio = TestAudio;
      const fixture = structuredClone(state.book);
      fixture.audio.music = null;
      dialog = window.openReadAlong(fixture);
      const click = (id) => dialog.querySelector(id).click();
      click('#readalong-play');
      const first = made.at(-1);
      const oldEnded = first.onended;
      const oldReject = first.reject;
      first.currentTime = 0.4;
      click('#readalong-play');
      result.pauseKeepsPosition = first.paused && first.currentTime === 0.4;
      click('#readalong-play');
      result.resumeSameAudio = made.at(-1) === first && !first.paused && first.currentTime === 0.4;
      oldReject(new Error('Interrupted old play'));
      await settle();
      result.oldPauseErrorIgnored = dialog.dataset.playing === 'true';
      click('#readalong-next');
      const second = made.at(-1);
      oldEnded();
      result.oldEndedIgnored = dialog.dataset.page === '1' && second !== first && first.paused;
      second.reject(new Error('Missing narration'));
      await settle();
      result.playFailurePauses = dialog.dataset.playing === 'false' && dialog.dataset.page === '1' && second.paused;
      await new Promise((resolve) => setTimeout(resolve, 4100));
      result.failedNarrationDoesNotSkipPage = dialog.dataset.page === '1';
      click('#readalong-play');
      const retry = made.at(-1);
      result.failedNarrationCanRetry = retry !== second && dialog.dataset.playing === 'true';
      retry.onended();
      result.narrationAdvances = dialog.dataset.page === '2';
      made.at(-1).onended();
      result.lastPageStops = dialog.dataset.playing === 'false';
      click('#readalong-prev');
      click('#readalong-prev');
      dialog.querySelector('.el-sound').click();
      const sound = made.at(-1);
      sound.resolve();
      await settle();
      dialog.querySelector('.el-sound').click();
      result.soundRetriggerStopsPrevious = sound.paused;
      const replacement = made.at(-1);
      click('#readalong-next');
      result.pageTurnStopsSounds = replacement.paused;
      replacement.reject(new Error('Interrupted sound'));
      click('#readalong-play');
      const closing = made.at(-1);
      const closingEnded = closing.onended;
      const closedPage = dialog.dataset.page;
      dialog.close();
      await new Promise((resolve) => dialog.addEventListener('close', resolve, { once: true }));
      closing.reject(new Error('Interrupted close'));
      closingEnded();
      await settle();
      await new Promise((resolve) => setTimeout(resolve, 4100));
      result.closedCallbacksIgnored = !dialog.isConnected && closing.paused && dialog.dataset.page === closedPage && window.openReadAlong.playingCount() === 0;

      fixture.audio.music = { file: 'music.wav', volume: 0.3, loop: true };
      dialog = window.openReadAlong(fixture);
      dialog.querySelector('#readalong-play').click();
      const background = made.at(-1);
      const voice = made.at(-2);
      background.reject(new Error('Missing music'));
      await settle();
      result.musicFailureKeepsNarration = background.paused && !voice.paused && dialog.dataset.playing === 'true';
      dialog.close();
      await new Promise((resolve) => dialog.addEventListener('close', resolve, { once: true }));

      // Timeline: length, seeking while paused, following playback, slider keys, Restart page, and a page without narration.
      fixture.audio.music = null;
      const firstNarration = fixture.audio.narration[fixture.pages[0].id];
      delete fixture.audio.narration[fixture.pages[1].id];
      dialog = window.openReadAlong(fixture);
      const seek = dialog.querySelector('#readalong-seek');
      const clock = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
      result.timelineShowsLength = !seek.disabled && Number(seek.max) === firstNarration.duration
        && dialog.querySelector('#readalong-duration').textContent === clock(firstNarration.duration);
      seek.value = String(firstNarration.duration / 2);
      seek.dispatchEvent(new Event('input'));
      const sought = made.at(-1);
      const target = Number(seek.value);
      result.seekWhilePaused = target > 0 && sought.currentTime === target && sought.paused && dialog.dataset.playing === 'false';
      dialog.querySelector('#readalong-play').click();
      result.playsFromSeek = made.at(-1) === sought && !sought.paused && sought.currentTime === target;
      sought.currentTime = 0.5;
      sought.ontimeupdate();
      result.timelineFollowsAudio = Number(seek.value) === 0.5
        && seek.getAttribute('aria-valuetext') === clock(0.5) + ' of ' + clock(firstNarration.duration);
      seek.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      result.sliderKeysStayOnPage = dialog.dataset.page === '0';
      dialog.querySelector('#readalong-restart').click();
      const restarted = made.at(-1);
      result.restartPage = restarted !== sought && sought.paused && !restarted.paused && restarted.currentTime === 0
        && Number(seek.value) === 0 && dialog.dataset.page === '0';
      dialog.querySelector('#readalong-next').click();
      result.noNarrationTimeline = seek.closest('.studio-ra-timeline').hidden && !dialog.querySelector('#readalong-no-narration').hidden;
      dialog.close();
      await new Promise((resolve) => dialog.addEventListener('close', resolve, { once: true }));

      // An older preview rejection must not stop the replacement or leave its button saying Pause.
      document.querySelector('[data-studio-tab="narration"]').click();
      const previewButton = document.querySelector('#studio-play');
      previewButton.click();
      const preview = made.at(-1);
      previewButton.click();
      previewButton.click();
      const replacementPreview = made.at(-1);
      preview.reject(new Error('Interrupted preview'));
      await settle();
      result.oldPreviewErrorIgnored = !replacementPreview.paused && previewButton.textContent.includes('Pause');
      replacementPreview.reject(new Error('Missing preview'));
      await settle();
      result.previewFailureResetsButton = replacementPreview.paused && previewButton.textContent.includes('Play');
    } finally {
      if (dialog?.open) {
        dialog.close();
        await new Promise((resolve) => dialog.addEventListener('close', resolve, { once: true }));
      }
      window.Audio = NativeAudio;
    }
    return result;
  })()`));

  const lifecycleBook = await ctx.store.create({ title: 'Recording lifecycle', pages: [{ text: 'One.' }, { text: 'Two.' }, { text: 'Three.' }] });
  await ctx.navigate('studio', { bookId: lifecycleBook.id });
  Object.assign(checks, await js(`(async () => {
    const devices = navigator.mediaDevices;
    const nativeGetUserMedia = devices.getUserMedia;
    const NativeRecorder = window.MediaRecorder;
    const NativeContext = window.AudioContext;
    const result = {};
    let requests = 0;
    let stoppedTracks = 0;
    let closedContexts = 0;
    let disconnected = 0;
    const stream = { getTracks: () => [{ stop: () => { stoppedTracks++; } }] };
    let grant;
    let recorder;
    class TestRecorder {
      constructor() { this.state = 'inactive'; recorder = this; }
      start() { this.state = 'recording'; }
      stop() { this.state = 'inactive'; } // Hold final data/stop events until the test chooses to release them.
    }
    class TestContext {
      createAnalyser() { return { fftSize: 512, getByteTimeDomainData: (buf) => buf.fill(128), disconnect: () => { disconnected++; } }; }
      createMediaStreamSource() { return { connect() {}, disconnect: () => { disconnected++; } }; }
      close() { closedContexts++; return Promise.resolve(); }
    }
    try {
      devices.getUserMedia = () => { requests++; return new Promise((resolve) => { grant = resolve; }); };
      const record = document.querySelector('#studio-record');
      record.click();
      record.click();
      await navigate('bookshelf');
      grant(stream);
      await $waitFor(() => stoppedTracks === 1);
      result.pendingPermissionCancelled = requests === 1 && stoppedTracks === 1 && !document.querySelector('[data-recording]');

      await navigate('studio', { bookId: ${JSON.stringify(lifecycleBook.id)} });
      devices.getUserMedia = async () => stream;
      window.MediaRecorder = class { constructor() { throw new Error('Recorder unavailable'); } };
      document.querySelector('#studio-record').click();
      await $waitFor(() => stoppedTracks === 2);
      result.failedSetupReleasesMic = stoppedTracks === 2 && Boolean(document.querySelector('#studio-record'));

      window.MediaRecorder = TestRecorder;
      window.AudioContext = TestContext;
      document.querySelector('#studio-record').click();
      await $waitFor('[data-recording]');
      recorder.onerror({ error: new Error('Microphone disconnected') });
      result.recorderErrorCleansUp = stoppedTracks === 3 && closedContexts === 1 && disconnected === 2 && Boolean(document.querySelector('#studio-record'));

      // Leaving mid-take: the test recorder holds its final data until finishTake() releases it.
      const bookId = ${JSON.stringify(lifecycleBook.id)};
      const finishTake = async () => {
        await $waitFor(() => recorder.state === 'inactive');
        recorder.ondataavailable({ data: new Blob([new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0])]) }); // WebM header
        recorder.onstop();
      };
      const savedTakes = async () => { await saveNow(); return Object.keys((await api.readBook(bookId)).audio?.narration || {}).length; };
      const startTake = async (page) => {
        document.querySelector('.studio-thumb[data-page-index="' + page + '"]').click();
        document.querySelector('#studio-record').click();
        await $waitFor('[data-recording]');
      };
      const answer = async (choice) => {
        await $waitFor('[data-leave-choice="' + choice + '"]');
        document.querySelector('[data-leave-choice="' + choice + '"]').click();
      };

      await startTake(0);
      const tracksBefore = stoppedTracks;
      let leaving = navigate('bookshelf');
      await answer('stay');
      await leaving;
      result.keepRecordingStays = state.screen === 'studio' && Boolean(document.querySelector('[data-recording]')) && stoppedTracks === tracksBefore;

      leaving = navigate('bookshelf');
      await $waitFor('[data-leave-recording]');
      document.querySelector('[data-leave-recording]').closest('dialog').close();
      await leaving;
      result.escapeKeepsRecording = state.screen === 'studio' && Boolean(document.querySelector('[data-recording]'));

      document.querySelector('#studio-readalong').click();
      result.readAlongWaitsForRecording = !document.querySelector('dialog.studio-readalong') && Boolean(document.querySelector('[data-recording]'));

      leaving = navigate('bookshelf');
      await answer('discard');
      await leaving;
      result.discardLeaves = state.screen === 'bookshelf' && stoppedTracks === tracksBefore + 1 && (await savedTakes()) === 0;

      await navigate('studio', { bookId });
      await startTake(0);
      leaving = navigate('bookshelf');
      await answer('save');
      await finishTake();
      await leaving;
      result.saveAndLeave = state.screen === 'bookshelf' && (await savedTakes()) === 1;

      await navigate('studio', { bookId });
      await startTake(1);
      const saving = document.querySelector('#studio-stop').onclick();
      leaving = navigate('bookshelf');
      await finishTake();
      await saving;
      await leaving;
      result.leaveWhileSavingKeepsTake = state.screen === 'bookshelf' && (await savedTakes()) === 2;

      await navigate('studio', { bookId });
      await startTake(2);
      const closing = screens.get('studio').beforeLeave({ closing: true });
      await finishTake();
      await closing;
      result.closeSavesTake = !document.querySelector('[data-leave-recording]') && (await savedTakes()) === 3;
    } finally {
      // If a check failed mid-take, drop it so the navigation below doesn't stop to ask.
      document.querySelector('[data-leave-recording]')?.closest('dialog')?.close();
      screens.get(state.screen)?.leave?.();
      await navigate('bookshelf');
      devices.getUserMedia = nativeGetUserMedia;
      window.MediaRecorder = NativeRecorder;
      window.AudioContext = NativeContext;
    }
    return result;
  })()`));
  await ctx.navigate('studio', { bookId: id });
  return checks;
};
