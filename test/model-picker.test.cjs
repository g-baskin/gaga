'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const picker = require('../ai/model-picker.cjs');

const NOW = Date.parse('2026-10-06T00:00:00Z');
const text = (id, completionPerMillion, extra = {}) => ({
  id,
  name: id,
  context_length: 128000,
  architecture: { input_modalities: ['text'], output_modalities: ['text'] },
  pricing: { prompt: String(completionPerMillion / 4 / 1e6), completion: String(completionPerMillion / 1e6) },
  supported_parameters: ['response_format', 'max_tokens'],
  ...extra,
});

// Usage order (OpenRouter's creative-writing category): cheap-popular first, premium later.
const catalog = [
  text('cheap/popular', 0.4),
  text('mid/writer', 3),
  text('premium/star', 15),
  text('free/thing:free', 0),
  text('tiny/context', 0.2, { context_length: 4000 }),
  text('image/maker', 5, { architecture: { input_modalities: ['text'], output_modalities: ['text', 'image'] } }),
  text('retiring/soon', 1, { expiration_date: '2026-10-10' }),
  text('openrouter/auto', 1),
  text('nojson/writer', 2, { supported_parameters: ['max_tokens'] }),
  text('translate/pro', 2.5),
];
const creative = ['free/thing:free', 'tiny/context', 'image/maker', 'retiring/soon', 'openrouter/auto', 'cheap/popular', 'mid/writer', 'nojson/writer', 'premium/star', 'translate/pro']
  .map((id) => ({ id }));

test('balanced budget picks the most-used affordable writing model, with fallbacks', () => {
  const plan = picker.pickTextModels({ catalog, creativeRanking: creative, task: 'story', tier: 'balanced', now: NOW });
  assert.equal(plan.models[0], 'cheap/popular');
  assert.ok(plan.models.length >= 2 && plan.models.length <= 3);
  assert.ok(plan.json);
  // Never routers, image models, models about to be retired, tiny-context or free (rate-limited) models.
  for (const bad of ['openrouter/auto', 'image/maker', 'retiring/soon', 'tiny/context', 'free/thing:free', 'nojson/writer']) {
    assert.ok(!plan.models.includes(bad), `should skip ${bad}`);
  }
  assert.match(plan.reason, /whole stories/);
});

test('best budget prefers the strongest model; measured quality scores win over price', () => {
  const byPrice = picker.pickTextModels({ catalog, creativeRanking: creative, task: 'story', tier: 'best', now: NOW });
  assert.equal(byPrice.models[0], 'premium/star');

  const benchmarks = [
    { model_permaslug: 'mid/writer', intelligence_index: 71 },
    { model_permaslug: 'premium/star', intelligence_index: 64 },
  ];
  const byScore = picker.pickTextModels({ catalog, creativeRanking: creative, benchmarks, task: 'story', tier: 'best', now: NOW });
  assert.equal(byScore.models[0], 'mid/writer');
  assert.match(byScore.reason, /quality score 71/);
});

test('thrifty budget and simple jobs stay cheap', () => {
  const thrifty = picker.pickTextModels({ catalog, creativeRanking: creative, task: 'story', tier: 'thrifty', now: NOW });
  assert.equal(thrifty.models[0], 'cheap/popular');
  assert.ok(thrifty.models.every((id) => Number(catalog.find((m) => m.id === id).pricing.completion) * 1e6 <= 1.2));
  // Captions drop one budget step: "best" behaves like "balanced".
  const captions = picker.pickTextModels({ catalog, creativeRanking: creative, task: 'captions', tier: 'best', now: NOW });
  assert.equal(captions.tier, 'balanced');
  // Even with quality scores, a simple job takes the popular affordable model rather than the top scorer.
  const scoredCaptions = picker.pickTextModels({
    catalog, creativeRanking: creative, benchmarks: [{ model_permaslug: 'mid/writer', intelligence_index: 80 }], task: 'captions', tier: 'best', now: NOW,
  });
  assert.equal(scoredCaptions.models[0], 'cheap/popular');
});

test('non-English books favour models that are also popular for translation', () => {
  const plan = picker.pickTextModels({
    catalog, creativeRanking: creative, translationRanking: [{ id: 'translate/pro' }], task: 'story', tier: 'balanced', language: 'Spanish', now: NOW,
  });
  assert.equal(plan.models[0], 'translate/pro');
  assert.match(plan.reason, /Spanish/);
});

test('falls back to the full catalogue when the usage ranking is unavailable, and returns null when nothing fits', () => {
  const plan = picker.pickTextModels({ catalog, creativeRanking: [], task: 'chapter', tier: 'balanced', now: NOW });
  assert.ok(plan && plan.models.length);
  assert.equal(picker.pickTextModels({ catalog: [text('pricey/only', 90)], task: 'story', tier: 'thrifty', now: NOW }), null);
});

test('picture models: per-budget preferences, line art for coloring pages, never vector output', () => {
  const models = [
    { id: 'recraft/recraft-v4.1-vector' },
    { id: 'recraft/recraft-v4.1-flash', supported_parameters: { aspect_ratio: { values: ['1:1'] } } },
    { id: 'openai/gpt-image-2.5' },
    { id: 'google/gemini-nano-banana-2.1' },
    { id: 'google/gemini-3.1-flash-lite-image' },
  ];
  assert.equal(picker.pickImageModel({ models, tier: 'best' }).model, 'openai/gpt-image-2.5');
  assert.equal(picker.pickImageModel({ models, tier: 'balanced' }).model, 'google/gemini-nano-banana-2.1');
  assert.equal(picker.pickImageModel({ models, tier: 'thrifty' }).model, 'google/gemini-3.1-flash-lite-image');
  const lineArt = picker.pickImageModel({ models, tier: 'balanced', lineArt: true });
  assert.equal(lineArt.model, 'recraft/recraft-v4.1-flash');
  assert.deepEqual(lineArt.params.aspect_ratio.values, ['1:1']);
  assert.equal(picker.pickImageModel({ models: [{ id: 'x/only-vector' }], tier: 'best' }), null);
});

test('voices: picks a voice the model really has', () => {
  const models = [
    { id: 'hexgrad/kokoro-82m', supported_voices: ['af_bella', 'am_fenrir'] },
    { id: 'microsoft/mai-voice-2.1-flash', supported_voices: ['en-GB-Ada:MAI', 'en-US-Ethan:MAI', 'en-US-Nova:MAI'] },
  ];
  const balanced = picker.pickSpeechModel({ models, tier: 'balanced', voice: 'nova' });
  assert.equal(balanced.model, 'microsoft/mai-voice-2.1-flash');
  assert.equal(balanced.voice, 'en-US-Nova:MAI');
  const thrifty = picker.pickSpeechModel({ models, tier: 'thrifty', voice: 'alloy' });
  assert.equal(thrifty.model, 'hexgrad/kokoro-82m');
  assert.equal(thrifty.voice, 'af_bella');
  assert.equal(picker.pickVoice([], 'nova'), 'nova');
  assert.equal(picker.pickVoice(['en-GB-Ada:X', 'en-US-Ethan:X'], ''), 'en-US-Ethan:X');
});

test('Claude and ChatGPT plan models follow the budget', () => {
  assert.equal(picker.pickClaudeModel({ task: 'story', tier: 'best' }), 'opus');
  assert.equal(picker.pickClaudeModel({ task: 'captions', tier: 'best' }), 'sonnet');
  assert.equal(picker.pickClaudeModel({ task: 'chapter', tier: 'thrifty' }), 'haiku');
  const models = [{ slug: 'gpt-6.1-sol', display_name: 'GPT-6.1' }, { slug: 'gpt-6.1-mini', display_name: 'GPT-6.1 mini' }];
  assert.equal(picker.pickChatGptModel({ models, task: 'story', tier: 'balanced' }), 'gpt-6.1-sol');
  assert.equal(picker.pickChatGptModel({ models, task: 'story', tier: 'thrifty' }), 'gpt-6.1-mini');
  assert.equal(picker.pickChatGptModel({ models: [], tier: 'best' }), null);
});

test('fal.ai picture models: per-budget choice, newest line-art model for coloring pages, no vector/LoRA', () => {
  const m = (endpoint_id, status = 'active') => ({ endpoint_id, metadata: { display_name: endpoint_id, status } });
  const models = [
    m('fal-ai/flux/schnell'), m('fal-ai/flux-lora'), m('fal-ai/nano-banana-2'), m('fal-ai/recraft/v4.1/text-to-vector'),
    m('fal-ai/recraft/v3/text-to-image'), m('fal-ai/recraft/v4.1/text-to-image'), m('openai/gpt-image-2.5/sunburst/text-to-image'),
    m('fal-ai/nano-banana-pro', 'deprecated'),
  ];
  assert.equal(picker.pickFalModel({ models, tier: 'best' }).model, 'openai/gpt-image-2.5/sunburst/text-to-image');
  assert.equal(picker.pickFalModel({ models, tier: 'balanced' }).model, 'fal-ai/nano-banana-2');
  assert.equal(picker.pickFalModel({ models, tier: 'thrifty' }).model, 'fal-ai/flux/schnell');
  const lineArt = picker.pickFalModel({ models, tier: 'balanced', lineArt: true });
  assert.equal(lineArt.model, 'fal-ai/recraft/v4.1/text-to-image');
  assert.match(lineArt.reason, /^Coloring pages: .* on fal\.ai\.$/);
  // Thrifty coloring pages stay on the cheap model rather than switching to Recraft.
  assert.equal(picker.pickFalModel({ models, tier: 'thrifty', lineArt: true }).model, 'fal-ai/flux/schnell');
  // Only vector/LoRA/inactive models left: nothing usable.
  assert.equal(picker.pickFalModel({ models: [m('fal-ai/flux-lora'), m('x/text-to-vector'), m('fal-ai/nano-banana-pro', 'deprecated')] }), null);
  // An unknown model list still yields its most-used usable model.
  assert.equal(picker.pickFalModel({ models: [m('someone/new-painter')], tier: 'best' }).model, 'someone/new-painter');
});

test('pictures with characters: only models that take reference pictures', () => {
  const or = [
    { id: 'google/gemini-nano-banana-2.1', supported_parameters: { aspect_ratio: {} } },
    { id: 'openai/gpt-image-2.5', supported_parameters: { aspect_ratio: {}, input_references: {} } },
  ];
  assert.equal(picker.pickImageModel({ models: or, tier: 'balanced' }).model, 'google/gemini-nano-banana-2.1');
  assert.equal(picker.pickImageModel({ models: or, tier: 'balanced', withReferences: true }).model, 'openai/gpt-image-2.5');
  assert.equal(picker.pickImageModel({ models: [or[0]], tier: 'best', withReferences: true }), null);
  const m = (endpoint_id) => ({ endpoint_id, metadata: { status: 'active' } });
  const fal = [m('fal-ai/nano-banana-2/edit'), m('openai/gpt-image-2.5/sunburst/edit'), m('google/nano-banana-lite/edit'), m('fal-ai/flux-lora/edit'), m('fal-ai/flux/schnell')];
  assert.equal(picker.pickFalEditModel({ models: fal, tier: 'best' }).model, 'openai/gpt-image-2.5/sunburst/edit');
  assert.equal(picker.pickFalEditModel({ models: fal, tier: 'balanced' }).model, 'fal-ai/nano-banana-2/edit');
  assert.equal(picker.pickFalEditModel({ models: fal, tier: 'thrifty' }).model, 'google/nano-banana-lite/edit');
  assert.equal(picker.pickFalEditModel({ models: [m('fal-ai/flux/schnell')], tier: 'best' }), null, 'non-edit models never qualify');
});
