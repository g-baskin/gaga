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
  return checks;
};
