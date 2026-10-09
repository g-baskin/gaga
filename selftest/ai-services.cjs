'use strict';
// AI services: Claude Code, ChatGPT sign-in, and OpenRouter (with automatic model choice), driven through
// the real Account screen and then used by real writing, picture, and voice jobs.
const fs = require('node:fs/promises');
const path = require('node:path');
const mocks = require('./mock-services.cjs');

module.exports = async function aiServices(ctx) {
  const { js, store, userData, pause } = ctx;
  const checks = {};
  const api = (code) => js(`(async () => { ${code} })()`);
  const settings = () => api('return api.getSettings()');
  const until = async (check, ms = 10000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { if (check(await settings())) return true; await pause(50); }
    throw new Error('Timed out waiting for a setting to save');
  };
  const waitText = (selector, pattern, ms = 10000) => js(`$waitFor(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    return el && ${pattern}.test(el.textContent) ? el : null;
  }, ${ms}).then(() => true)`);

  const openRouter = await mocks.startOpenRouter({ key: 'sk-or-selftest' });
  const chatGpt = await mocks.startChatGpt();
  const fal = await mocks.startFal({ key: 'fal-selftest-key' });
  const fakeClaude = await mocks.makeFakeClaude(path.join(userData, 'fake-claude'));
  ctx.useTestServices({
    STORYLOOM_TEST_OPENROUTER: openRouter.url,
    STORYLOOM_TEST_CHATGPT_AUTH: chatGpt.url,
    STORYLOOM_TEST_CHATGPT_API: `${chatGpt.url}/v1`,
    STORYLOOM_TEST_FAL_RUN: fal.runBase,
    STORYLOOM_TEST_FAL_API: fal.apiBase,
  });

  try {
    // ---------- Claude Code ----------
    // Settings refuse a Claude Code location that isn't a program named claude.
    const refused = await api(`return api.saveSettings({ claudePath: '/bin/bash' }).then(() => '', (error) => error.message)`);
    checks.claudePathOnlyClaude = /claude program/.test(refused) && (await settings()).claudePath !== '/bin/bash';
    await api(`return api.saveSettings({ claudePath: ${JSON.stringify(fakeClaude.program)} })`);
    await ctx.navigate('account');
    await ctx.click('#account-writer-claude');
    await until((s) => s.writer === 'claude');
    await waitText('#account-claude-state', /Connected to your Claude plan/);
    checks.claudeConnected = true;
    checks.claudeWriterSaved = (await settings()).writer === 'claude';

    const claudeStory = await api(`return api.generateStory({ idea: 'A lantern that sings', pages: 4 })`);
    checks.claudeStory = claudeStory.title === 'The Claude Lantern' && claudeStory.chapters.length === 4;
    const claudeChapter = await api(`return api.generateChapter({ bookTitle: 'X', chapterTitle: 'Y', wordLimit: 60 })`);
    checks.claudeChapter = claudeChapter.text === 'Claude wrote this chapter.';
    const args = await fs.readFile(fakeClaude.log, 'utf8');
    const askLine = args.split('\n').find((l) => l.startsWith('-p '));
    // Every tool, setting file, MCP server and slash command is switched off; nothing is saved to history.
    checks.claudeLockedDown = ['--tools', '--setting-sources', '--strict-mcp-config', '--disable-slash-commands', '--no-session-persistence']
      .every((flag) => askLine?.includes(flag));
    checks.claudeBudgetModel = /--model sonnet/.test(askLine || ''); // "balanced" story → sonnet

    // ---------- ChatGPT ----------
    await ctx.click('#account-writer-chatgpt');
    await until((s) => s.writer === 'chatgpt');
    await waitText('#account-chatgpt-state', /Not signed in/);
    await ctx.click('#account-chatgpt-sign-in');
    await ctx.waitFor('#account-chatgpt-welcome', 15000);
    checks.chatGptWelcomeShown = await js(`/using your ChatGPT plan/i.test(document.querySelector('dialog[open]')?.textContent || '')`);
    await ctx.click('#account-chatgpt-welcome-ok');
    await waitText('#account-chatgpt-state', /Connected/);
    checks.chatGptEmail = await js(`document.getElementById('account-chatgpt-email')?.textContent === 'reader@example.com'`);
    checks.chatGptModels = await js(`[...document.querySelectorAll('#account-chatgpt-model option')].map((o) => o.value).join(',') === ',gpt-mock-sol,gpt-mock-mini'`);
    checks.chatGptRegistered = chatGpt.calls.some((c) => c.path === '/api/accounts/authorize' && c.query.client_id === 'dynamic_agent_client');
    // The sign-in is stored encrypted, never as readable tokens.
    const sealed = await fs.readFile(path.join(userData, 'chatgpt.json'), 'utf8');
    checks.chatGptEncrypted = !/at-|rt-|access|refresh/.test(sealed);

    const gptStory = await api(`return api.generateStory({ idea: 'A paper boat', pages: 3 })`);
    checks.chatGptStory = gptStory.chapters.length === 3 && gptStory.model === 'gpt-mock-sol';
    const sent = JSON.parse(chatGpt.calls.filter((c) => c.path === '/v1/responses').at(-1).raw);
    checks.chatGptNoStore = sent.store === false && sent.stream === true;

    // OpenAI asks apps to show "Using ChatGPT plan" + "Manage usage" where AI is used.
    const book = await store.create({ title: 'Plan Book' });
    await ctx.navigate('story-builder', { bookId: book.id });
    await waitText('.ai-writer-note', /Using ChatGPT plan/);
    checks.usingPlanNote = await js(`/Manage usage/.test(document.querySelector('.ai-writer-note').textContent)`);

    // A usage limit is explained, not shown as a crash.
    chatGpt.options.usageLimit = true;
    const limitError = await api(`try { await api.generateChapter({ bookTitle: 'X', chapterTitle: 'Y' }); return ''; } catch (e) { return cleanError(e); }`);
    checks.chatGptUsageLimit = /usage limit/.test(limitError) && /chatgpt\.com\/settings\/usage/.test(limitError);
    chatGpt.options.usageLimit = false;

    await ctx.navigate('account');
    await waitText('#account-chatgpt-state', /Connected/);
    await ctx.click('#account-chatgpt-sign-out');
    await ctx.confirm('ok');
    await waitText('#account-chatgpt-state', /Not signed in/);
    checks.chatGptSignedOut = chatGpt.calls.some((c) => c.path === '/api/accounts/oauth/revoke');

    // ---------- OpenRouter ----------
    await ctx.click('#account-writer-openrouter');
    await until((s) => s.writer === 'openrouter');
    // Wait for the model picks to load, as for fal.ai below: the screen redraws when they arrive, and a click
    // measured before that redraw can miss the key field (the typed key then goes nowhere).
    await ctx.waitFor('#account-openrouter-picks li');
    await ctx.waitFor('#account-openrouter-key');
    await ctx.click('#account-openrouter-key');
    await ctx.type('sk-or-selftest');
    await ctx.click('#account-openrouter-save');
    await waitText('#account-openrouter-state', /Key saved/);
    await until((s) => s.hasOpenrouterKey);
    await ctx.waitFor('#account-openrouter-picks li');
    const keyFile = await fs.readFile(path.join(userData, 'settings.json'), 'utf8');
    checks.openRouterKeyEncrypted = !keyFile.includes('sk-or-selftest') && JSON.parse(keyFile).openrouterKeyEnc.length > 0;

    // Send pictures and voices to OpenRouter as well.
    await js(`(() => { const s = $must('#account-pictures'); s.value = 'openrouter'; s.dispatchEvent(new Event('change')); return true; })()`);
    await until((s) => s.pictures === 'openrouter');
    await ctx.waitFor('#account-voices');
    await js(`(() => { const s = $must('#account-voices'); s.value = 'openrouter'; s.dispatchEvent(new Event('change')); return true; })()`);
    await until((s) => s.voices === 'openrouter');

    // Best quality: the measured quality score beats the priciest model.
    await ctx.click('#account-tier-best');
    await until((s) => s.tier === 'best');
    await waitText('#account-openrouter-picks', /quality score 72/);
    const picks = await js(`[...document.querySelectorAll('#account-openrouter-picks li')].map((li) => li.querySelector('.ai-pick-job').textContent + '=' + li.querySelector('code').textContent)`);
    checks.recommendations = picks.includes('Whole stories=mock/fine-writer') && picks.includes('Pictures=openai/gpt-image-mock')
      && picks.includes('Coloring pages=recraft/recraft-mock') && picks.some((p) => p.startsWith('Narration='));
    await ctx.screenshot('ai-services');

    const orStory = await api(`return api.generateStory({ idea: 'A brave kite', pages: 3 })`);
    checks.openRouterStory = orStory.model === 'mock/fine-writer' && orStory.chapters.length === 3;
    const chatCall = openRouter.calls.filter((c) => c.path === '/chat/completions').at(-1);
    checks.openRouterFallbacks = Array.isArray(chatCall.body.models) && chatCall.body.models.length > 1;

    const picture = await api(`return api.generateImage({ bookId: ${JSON.stringify(book.id)}, prompt: 'A kite over a hill' })`);
    checks.openRouterPicture = typeof picture === 'string' && openRouter.calls.some((c) => c.path === '/images' && c.body.model === 'openai/gpt-image-mock' && c.body.aspect_ratio === '1:1');
    await api(`return api.generateImage({ bookId: ${JSON.stringify(book.id)}, prompt: 'A kite', lineArt: true })`);
    checks.openRouterLineArt = openRouter.calls.some((c) => c.path === '/images' && c.body.model === 'recraft/recraft-mock');
    const audio = await api(`return api.generateSpeech({ bookId: ${JSON.stringify(book.id)}, text: 'The kite flew high.', voice: 'nova' })`);
    const speechCall = openRouter.calls.find((c) => c.path === '/audio/speech');
    checks.openRouterVoice = typeof audio === 'string' && speechCall?.body.voice === 'en-US-Nova:MAI';
    checks.openRouterAttribution = openRouter.calls.every((c) => c.title === 'Storyloom');

    // Lowest cost switches to the cheapest popular writer.
    await ctx.click('#account-tier-thrifty');
    await until((s) => s.tier === 'thrifty');
    await waitText('#account-openrouter-picks', /mock\/popular-writer/);
    checks.thriftyPick = true;

    // Two saves at the same moment must both be kept (saves are queued, not overlapped).
    await api(`await Promise.all([api.saveSettings({ claudeModel: 'haiku' }), api.saveSettings({ chatgptModel: 'gpt-mock-mini' }), api.saveSettings({ voice: 'en-US-Nova:MAI' })]); return true`);
    const both = await settings();
    checks.concurrentSaves = both.claudeModel === 'haiku' && both.chatgptModel === 'gpt-mock-mini' && both.voice === 'en-US-Nova:MAI';

    // A pinned model overrides automatic choice.
    await js(`(() => { $must('details.ai-advanced').open = true; const i = $must('#account-orTextModel'); i.value = 'mock/grand-writer'; i.dispatchEvent(new Event('change')); return true; })()`);
    await until((s) => s.orTextModel === 'mock/grand-writer');
    const pinned = await api(`return api.generateStory({ idea: 'A pinned story', pages: 3 })`);
    checks.pinnedModel = pinned.model === 'mock/grand-writer';
    await api(`return api.saveSettings({ orTextModel: '' })`);

    // ---------- fal.ai pictures ----------
    await ctx.navigate('account');
    await ctx.waitFor('#account-pictures');
    await js(`(() => { const s = $must('#account-pictures'); s.value = 'fal'; s.dispatchEvent(new Event('change')); return true; })()`);
    await until((s) => s.pictures === 'fal');
    // Wait for the model lists to load: the screen redraws (and the fal.ai box moves) when they arrive.
    await ctx.waitFor('#account-fal-picks li');
    await ctx.waitFor('#account-fal-key');
    await ctx.click('#account-fal-key');
    await ctx.type('fal-selftest-key');
    await ctx.click('#account-fal-save');
    await waitText('#account-fal-state', /Key saved/);
    await until((s) => s.hasFalKey);
    const falKeyFile = await fs.readFile(path.join(userData, 'settings.json'), 'utf8');
    checks.falKeyEncrypted = !falKeyFile.includes('fal-selftest-key') && JSON.parse(falKeyFile).falKeyEnc.length > 0;
    // Thrifty budget (still set from above) → FLUX schnell; coloring pages stay on it too.
    await waitText('#account-fal-picks', /fal-ai\/flux\/schnell/);
    checks.falPicks = true;
    // fal.ai's picks show once, in its own panel, not again in OpenRouter's.
    checks.falPicksOnce = await js(`!/fal-ai\\//.test(document.getElementById('account-openrouter-picks')?.textContent || '')`);
    await ctx.screenshot('ai-services-fal');

    const falPicture = await api(`return api.generateImage({ bookId: ${JSON.stringify(book.id)}, prompt: 'A kite over a hill' })`);
    const falCall = fal.calls.find((c) => c.path === '/run/fal-ai/flux/schnell');
    checks.falPicture = typeof falPicture === 'string' && falCall?.auth === 'Key fal-selftest-key' && falCall.body.image_size === 'square_hd' && falCall.body.sync_mode === true;

    // The picture note in the character dialog names fal.ai as the one drawing and billing.
    await ctx.navigate('story-builder', { bookId: book.id });
    await ctx.click('#sb-add-character');
    const falNote = await js(`$waitFor(() => document.querySelector('dialog[open] .ai-picture-note strong') && document.querySelector('dialog[open] .ai-picture-note').textContent, 5000)`);
    checks.falPictureNote = /drawn by fal\.ai and charged to your fal\.ai credit/.test(falNote);
    await js(`document.querySelector('dialog[open]').close(); true`);

    // An empty fal.ai balance is explained, not shown as a crash.
    fal.options.outOfCredit = true;
    const creditError = await api(`try { await api.generateImage({ bookId: ${JSON.stringify(book.id)}, prompt: 'x' }); return ''; } catch (e) { return cleanError(e); }`);
    checks.falOutOfCredit = /out of credit/.test(creditError);
    fal.options.outOfCredit = false;
  } finally {
    // Back to the plain "own service" setup so later modules behave the same.
    await api(`return api.saveSettings({ writer: 'custom', pictures: 'custom', voices: 'custom', tier: 'balanced', clearOpenrouterKey: true, clearFalKey: true, claudePath: '' })`).catch(() => {});
    ctx.useTestServices({ STORYLOOM_TEST_OPENROUTER: undefined, STORYLOOM_TEST_CHATGPT_AUTH: undefined, STORYLOOM_TEST_CHATGPT_API: undefined, STORYLOOM_TEST_FAL_RUN: undefined, STORYLOOM_TEST_FAL_API: undefined });
    openRouter.close();
    chatGpt.close();
    fal.close();
  }
  await pause(10);
  return checks;
};
