'use strict';
// Live checks against the real OpenRouter, run only by `npm run test:live` (not `npm test`).
// Needs OPENROUTER_TEST_API, read from scrively/.env.local or the environment. Skips without it.
// Costs a fraction of a cent per run: one short chat on the thrifty budget. Everything else is free.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createOpenRouter } = require('../../ai/openrouter.cjs');

const key = process.env.OPENROUTER_TEST_API?.trim();
const live = { skip: key ? false : 'set OPENROUTER_TEST_API in scrively/.env.local to run live OpenRouter checks' };
const client = () => createOpenRouter({ getKey: async () => key });

test('live OpenRouter: picks a model for every job from the real catalogues', live, async () => {
  const recs = await client().recommendations({ tier: 'thrifty', language: 'English' });
  const jobs = recs.map((r) => r.job);
  for (const job of ['Whole stories', 'Chapters', 'Coloring captions']) assert.ok(jobs.includes(job), `no model picked for ${job}`);
  for (const r of recs) assert.match(r.model, /^[\w.-]+\/[\w.:-]+$/, `odd model id for ${r.job}: ${r.model}`);
});

test('live OpenRouter: a thrifty chat returns JSON from a real model', live, async () => {
  const { content, model } = await client().chat({
    system: 'Reply with JSON only.',
    user: 'Return {"ok": true}.',
    maxTokens: 200,
    task: 'captions',
    tier: 'thrifty',
  });
  assert.equal(typeof model, 'string');
  assert.equal(JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, '')).ok, true);
});

test('live OpenRouter: a wrong key gets the friendly error', live, async () => {
  const bad = createOpenRouter({ getKey: async () => 'sk-or-v1-not-a-real-key' });
  await assert.rejects(bad.chat({ system: 'x', user: 'x', maxTokens: 1, model: 'openai/gpt-4o-mini' }), /didn’t accept the key/);
});
