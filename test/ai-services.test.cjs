'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createChatGpt } = require('../ai/chatgpt.cjs');
const { createOpenRouter } = require('../ai/openrouter.cjs');
const { createClaudeCode } = require('../ai/claude-code.cjs');
const mocks = require('../selftest/mock-services.cjs');

const STORY_SYSTEM = 'You write original picture-book stories. Reply with JSON only.';
const CHAPTER_SYSTEM = 'You help write one chapter of a picture book. Reply with JSON only.';

// ---------------- ChatGPT ----------------
async function chatGptHarness(options) {
  const server = await mocks.startChatGpt(options);
  let record = null;
  const opened = [];
  const client = createChatGpt({
    authBase: server.url,
    apiBase: `${server.url}/v1`,
    callbackPort: 0,
    loadRecord: async () => (record ? structuredClone(record) : null),
    saveRecord: async (next) => { record = structuredClone(next); },
    // Stands in for the browser: the fake server redirects straight back to Storyloom's callback.
    openBrowser: async (url) => { opened.push(url); await fetch(url); },
  });
  return { server, client, opened, record: () => record, setRecord: (r) => { record = r; } };
}

test('ChatGPT: first sign-in registers Storyloom, verifies identity, and uses the plan', async (t) => {
  const h = await chatGptHarness();
  t.after(() => h.server.close());
  const result = await h.client.signIn();
  assert.deepEqual(result, { signedIn: true, planEnabled: true, email: 'reader@example.com', firstTime: true });

  const authorize = new URL(h.opened[0]);
  assert.equal(authorize.searchParams.get('client_id'), 'dynamic_agent_client');
  assert.equal(authorize.searchParams.get('agent_name_hint'), 'Storyloom');
  assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(authorize.searchParams.get('resource'), 'https://api.openai.com/v1');
  assert.match(authorize.searchParams.get('scope'), /chatgpt\.tokens\.use\.direct/);
  assert.match(authorize.searchParams.get('redirect_uri'), /^http:\/\/127\.0\.0\.1:\d+\/auth\/callback$/);
  assert.match(h.record().clientId, /^oaiapp_mock_/);

  const text = await h.client.respond({ instructions: CHAPTER_SYSTEM, user: 'Write it', model: 'gpt-mock-sol' });
  assert.equal(JSON.parse(text).text.startsWith('The moon hummed'), true);
  const sent = JSON.parse(h.server.calls.find((c) => c.path === '/v1/responses').raw);
  assert.equal(sent.store, false);
  assert.equal(sent.stream, true);
  assert.equal(sent.instructions, CHAPTER_SYSTEM);

  const models = await h.client.models();
  assert.deepEqual(models.map((m) => m.slug), ['gpt-mock-sol', 'gpt-mock-mini']); // hidden models are left out
});

test('ChatGPT: returning sign-in reuses the registration; sign-out revokes and forgets tokens', async (t) => {
  const h = await chatGptHarness();
  t.after(() => h.server.close());
  await h.client.signIn();
  const clientId = h.record().clientId;
  await h.client.markWelcomed();

  const out = await h.client.signOut();
  assert.equal(out.revoked, true);
  assert.equal(h.record().accessToken, undefined);
  assert.equal(h.record().clientId, clientId);
  assert.equal((await h.client.status()).signedIn, false);
  await assert.rejects(h.client.respond({ instructions: 'x', user: 'y', model: 'm' }), /Sign in with ChatGPT/);

  const again = await h.client.signIn();
  assert.equal(again.firstTime, false); // the welcome is shown only once
  const second = new URL(h.opened[1]);
  assert.equal(second.searchParams.get('client_id'), clientId);
  assert.equal(second.searchParams.get('agent_name_hint'), null);
});

test('ChatGPT: expired access tokens refresh once, with rotation', async (t) => {
  const h = await chatGptHarness();
  t.after(() => h.server.close());
  await h.client.signIn();
  const oldRefresh = h.record().refreshToken;
  h.setRecord({ ...h.record(), expiresAt: Date.now() - 1000 });
  // Two requests at once must share one refresh (a refresh token works only once).
  await Promise.all([
    h.client.respond({ instructions: CHAPTER_SYSTEM, user: 'a', model: 'gpt-mock-sol' }),
    h.client.respond({ instructions: CHAPTER_SYSTEM, user: 'b', model: 'gpt-mock-sol' }),
  ]);
  const refreshes = h.server.calls.filter((c) => c.path === '/api/accounts/oauth/token' && c.raw.includes('grant_type=refresh_token'));
  assert.equal(refreshes.length, 1);
  assert.notEqual(h.record().refreshToken, oldRefresh);
  assert.ok(h.record().expiresAt > Date.now());
});

test('ChatGPT: an unusable refresh token asks the user to sign in again', async (t) => {
  const h = await chatGptHarness();
  t.after(() => h.server.close());
  await h.client.signIn();
  h.setRecord({ ...h.record(), expiresAt: 0, refreshToken: 'rt-revoked' });
  await assert.rejects(h.client.respond({ instructions: 'x', user: 'y', model: 'm' }), /sign in with ChatGPT again/i);
  assert.equal((await h.client.status()).signedIn, false);
});

test('ChatGPT: declining plan use, denying sign-in, and usage limits are explained', async (t) => {
  const declined = await chatGptHarness({ declinePlan: true });
  t.after(() => declined.server.close());
  const result = await declined.client.signIn();
  assert.equal(result.signedIn, true);
  assert.equal(result.planEnabled, false);
  await assert.rejects(declined.client.respond({ instructions: 'x', user: 'y', model: 'm' }), /Allow Storyloom to use your ChatGPT plan/);

  const denied = await chatGptHarness({ deny: true });
  t.after(() => denied.server.close());
  assert.deepEqual(await denied.client.signIn(), { signedIn: false, declined: true });

  const limited = await chatGptHarness();
  t.after(() => limited.server.close());
  await limited.client.signIn();
  limited.server.options.usageLimit = true;
  await assert.rejects(limited.client.respond({ instructions: 'x', user: 'y', model: 'm' }), /usage limit/);
});

test('ChatGPT: identity tokens with the wrong audience, nonce, issuer, or signature are rejected', async (t) => {
  for (const [tamper, message] of [
    [{ aud: 'someone-else' }, /different app/],
    [{ nonce: 'not-this-sign-in' }, /did not match/],
    [{ iss: 'https://evil.example' }, /wrong issuer/],
    [{ exp: 1000 }, /expired/],
  ]) {
    const h = await chatGptHarness();
    t.after(() => h.server.close());
    h.server.options.idTokenTamper = tamper;
    await assert.rejects(h.client.signIn(), message);
    assert.equal(h.record(), null, 'nothing is saved when verification fails');
  }
});

// ---------------- OpenRouter ----------------
test('OpenRouter: picks models from live lists, sends fallbacks, and uses quality scores with a key', async (t) => {
  const server = await mocks.startOpenRouter({ key: 'sk-or-test' });
  t.after(() => server.close());
  let key = 'sk-or-test';
  const client = createOpenRouter({ baseUrl: server.url, getKey: async () => key });

  const best = await client.chat({ system: STORY_SYSTEM, user: 'Number of pages: 3', task: 'story', tier: 'best' });
  assert.equal(best.model, 'mock/fine-writer'); // highest benchmark score beats the priciest model
  const chatCall = server.calls.find((c) => c.path === '/chat/completions');
  assert.deepEqual(chatCall.body.models.slice(0, 1), ['mock/fine-writer']);
  assert.ok(chatCall.body.models.length > 1, 'fallback models are sent');
  assert.equal(chatCall.body.response_format.type, 'json_object');
  assert.equal(chatCall.auth, 'Bearer sk-or-test');
  assert.equal(chatCall.title, 'Storyloom');
  assert.ok(!chatCall.body.models.includes('openrouter/auto'));

  const balanced = await client.chat({ system: STORY_SYSTEM, user: 'x', task: 'story', tier: 'balanced' });
  assert.equal(balanced.model, 'mock/fine-writer');
  const thrifty = await client.chat({ system: STORY_SYSTEM, user: 'x', task: 'story', tier: 'thrifty' });
  assert.equal(thrifty.model, 'mock/popular-writer');

  const picture = await client.image({ prompt: 'a fox', tier: 'best', lineArt: false });
  assert.equal(picture.model, 'openai/gpt-image-mock');
  const imageCall = server.calls.find((c) => c.path === '/images');
  assert.equal(imageCall.body.aspect_ratio, '1:1');
  assert.equal(imageCall.body.output_format, 'png');
  const lineArt = await client.image({ prompt: 'line art fox', tier: 'balanced', lineArt: true });
  assert.equal(lineArt.model, 'recraft/recraft-mock');
  assert.equal(server.calls.filter((c) => c.path === '/images').at(-1).body.aspect_ratio, undefined, 'unsupported options are not sent');

  const voice = await client.speech({ text: 'Hello', tier: 'balanced', voice: 'nova' });
  assert.equal(voice.model, 'microsoft/mai-voice-2.1-flash');
  assert.equal(voice.voice, 'en-US-Nova:MAI');
  assert.ok(voice.bytes.length > 44);

  const picks = await client.recommendations({ tier: 'balanced', language: 'English' });
  assert.deepEqual(picks.map((p) => p.job), ['Whole stories', 'Chapters', 'Coloring captions', 'Pictures', 'Coloring pages', 'Narration']);

  key = '';
  await assert.rejects(client.chat({ system: STORY_SYSTEM, user: 'x', task: 'story', tier: 'best', model: 'mock/fine-writer' }), /OpenRouter key/);
});

// ---------------- Claude Code ----------------
test('Claude Code: runs the installed program with every tool and setting switched off', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'storyloom-claude-test-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const fake = await mocks.makeFakeClaude(dir);
  const client = createClaudeCode({ getPath: async () => fake.program, home: dir });

  const status = await client.status();
  assert.deepEqual({ installed: status.installed, signedIn: status.signedIn, method: status.method, version: status.version },
    { installed: true, signedIn: true, method: 'subscription', version: '9.9.9' });

  const story = await client.ask({ system: STORY_SYSTEM, user: 'A fox', model: 'sonnet' });
  assert.equal(JSON.parse(story.content).title, 'The Claude Lantern');
  const chapter = await client.ask({ system: CHAPTER_SYSTEM, user: 'Next' });
  assert.equal(JSON.parse(chapter.content).text, 'Claude wrote this chapter.');

  const args = (await fs.readFile(fake.log, 'utf8')).trim().split('\n').at(-2);
  for (const flag of ['-p', '--output-format json', '--no-session-persistence', '--tools', '--setting-sources', '--strict-mcp-config', '--disable-slash-commands', '--model sonnet']) {
    assert.ok(args.includes(flag), `missing ${flag}`);
  }

  const missing = createClaudeCode({ getPath: async () => path.join(dir, 'nope'), home: dir });
  await assert.rejects(missing.ask({ system: 'x', user: 'y' }), /isn’t a program/);
  const relative = createClaudeCode({ getPath: async () => 'claude', home: dir });
  await assert.rejects(relative.ask({ system: 'x', user: 'y' }), /isn’t a program/);
});
