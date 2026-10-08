'use strict';
// Home: quick idea → story builder book, import a markdown story, unavailable cards, validation.
module.exports = async function home(ctx) {
  const { js } = ctx;
  const checks = {};
  await ctx.navigate('home');
  await ctx.assertNoMissing();
  await ctx.waitFor('#home-prompt');

  // Empty prompt validation.
  const before = (await ctx.store.list()).length;
  await ctx.click('#home-start');
  await ctx.pause(300);
  checks.emptyPromptMessage = await js(`!document.querySelector('#home-error').hidden && window.__storyloom.current() === 'home'`);
  checks.emptyPromptNoBook = (await ctx.store.list()).length === before;

  checks.unavailableCards = await js(`!!document.querySelector('[data-unavailable="drawing-to-story"]') && !!document.querySelector('[data-unavailable="photo-avatar"]')`);
  checks.chipCount = await js(`document.querySelectorAll('.home-chip').length >= 8`);

  await ctx.click('.home-chip', { index: 2 });
  const chipText = await js(`document.querySelectorAll('.home-chip')[2].textContent`);
  checks.chipFills = (await js(`document.querySelector('#home-prompt').value`)) === chipText;
  await ctx.click('#home-star');
  await ctx.type('Maya');
  await ctx.click('#home-start');
  await js(`$waitFor(() => window.__storyloom.current() === 'story-builder', 5000).then(() => true)`);
  checks.onStoryBuilder = (await js('window.__storyloom.current()')) === 'story-builder';
  const builtId = await js('state.book && state.book.id');
  const built = await ctx.store.read(builtId);
  checks.builderIdea = built.builder.idea === chipText;
  checks.builderStar = built.builder.characters.length === 1 && built.builder.characters[0].name === 'Maya'
    && built.builder.characters[0].role === 'Main character';

  // Import.
  await ctx.navigate('home');
  await ctx.assertNoMissing();
  await ctx.waitFor('#home-import');
  await ctx.setOpenFile(await ctx.fixture('tale.md', '# The Owl\n\nOnce upon a time.\n\n- one\n\n# The Moon\n\nThe end.'));
  await ctx.click('#home-import');
  await js(`$waitFor(() => window.__storyloom.current() === 'manuscript', 5000).then(() => true)`);
  checks.onManuscript = (await js('window.__storyloom.current()')) === 'manuscript';
  const imported = await ctx.store.read(await js('state.book && state.book.id'));
  const ch = imported.manuscript.chapters;
  checks.importChapters = ch.length === 2 && ch[0].title === 'The Owl' && ch[1].title === 'The Moon';
  checks.importLi = ch[0].blocks.some((b) => b.type === 'li' && b.runs[0].text === 'one');
  checks.importTitle = imported.title === 'tale';

  // One text → blocks parser (core.js) for imports and AI chapters: headings at every level, wrapped lines joined.
  const parsed = await js(`JSON.stringify(textToBlocks('# Big Day\\n## Morning\\nPip woke up early\\nand ran outside.\\n\\n### A surprise\\n- a kite\\n> said Mum\\r\\n\\r\\nThe end.'))`);
  checks.parserShared = parsed === JSON.stringify([
    { type: 'h2', runs: [{ text: 'Big Day' }] },
    { type: 'h3', runs: [{ text: 'Morning' }] },
    { type: 'p', runs: [{ text: 'Pip woke up early and ran outside.' }] },
    { type: 'h3', runs: [{ text: 'A surprise' }] },
    { type: 'li', runs: [{ text: 'a kite' }] },
    { type: 'quote', runs: [{ text: 'said Mum' }] },
    { type: 'p', runs: [{ text: 'The end.' }] },
  ]);

  // Screenshot with recent books present.
  await ctx.navigate('home');
  await ctx.assertNoMissing();
  await ctx.waitFor('.home-recent-card');
  checks.recentShown = await js(`document.querySelectorAll('.home-recent-card').length >= 2`);
  await ctx.pause(200);
  await ctx.screenshot();
  return checks;
};
