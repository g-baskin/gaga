'use strict';
// Chooses the best AI model for each Storyloom job. Pure functions (no network) so they can be unit-tested.
//
// Inputs are OpenRouter's public, live catalogues:
//   - the full model list (capabilities, context size, prices, expiry),
//   - the same list filtered to a use-case category, which OpenRouter orders by real usage
//     ("roleplay" is its creative-fiction category; "translation" for non-English books),
//   - the image-model and speech-model lists.
// The user picks a budget ("best", "balanced", "thrifty"); each job also has its own needs.

const TIERS = ['best', 'balanced', 'thrifty'];

// What each job needs. Short, simple jobs drop one budget step: they don't need the strongest model.
const TASKS = {
  story: { label: 'whole stories', minContext: 32000, tierShift: 0 },
  chapter: { label: 'chapters', minContext: 16000, tierShift: 0 },
  captions: { label: 'coloring-book captions', minContext: 8000, tierShift: 1 },
};

// Most a model may charge per million output tokens at each budget (US dollars).
const PRICE_CAP = { best: 40, balanced: 6, thrifty: 1.2 };

const DAY = 86_400_000;
const perMillion = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n * 1e6 : Infinity;
};
const shiftTier = (tier, steps) => TIERS[Math.min(TIERS.length - 1, Math.max(0, TIERS.indexOf(tier) + steps))];
const normalTier = (tier) => (TIERS.includes(tier) ? tier : 'balanced');
const isEnglish = (language) => !language || /^\s*english\s*$/i.test(language);

function usableForWriting(model, minContext, now) {
  const arch = model.architecture || {};
  const outputs = arch.output_modalities || [];
  const inputs = arch.input_modalities || [];
  if (!outputs.includes('text') || outputs.some((m) => m !== 'text')) return false; // text-only output
  if (inputs.length && !inputs.includes('text')) return false;
  if (typeof model.id !== 'string' || model.id.startsWith('openrouter/')) return false; // routers, not models
  if ((model.context_length || 0) < minContext) return false;
  if (model.expiration_date && Date.parse(model.expiration_date) - now < 30 * DAY) return false;
  return Number.isFinite(perMillion(model.pricing?.completion));
}

// Measured quality (Artificial Analysis "intelligence index", 0-100) by model id, from OpenRouter's benchmarks.
function scoreMap(benchmarks = []) {
  const map = new Map();
  for (const item of benchmarks) {
    const score = Number(item?.intelligence_index);
    if (typeof item?.model_permaslug === 'string' && Number.isFinite(score)) map.set(item.model_permaslug, score);
  }
  return map;
}
const scoreOf = (scores, model) => scores.get(model.id) ?? scores.get(model.canonical_slug) ?? null;

// Returns { models: [primary, ...fallbacks], tier, reason } or null when nothing fits.
// Popularity for creative writing (OpenRouter's usage order) narrows the field; measured quality scores,
// when available, decide among the leaders; price caps keep each budget honest.
function pickTextModels({ catalog = [], creativeRanking = [], translationRanking = [], benchmarks = [], task = 'story', tier = 'balanced', language = '', now = Date.now() }) {
  const job = TASKS[task] || TASKS.story;
  const budget = shiftTier(normalTier(tier), job.tierShift);
  const byId = new Map(catalog.map((m) => [m.id, m]));
  const translation = new Set(translationRanking.map((m) => m.id));
  const english = isEnglish(language);
  const scores = scoreMap(benchmarks);

  // Popularity for creative writing comes from OpenRouter's usage-ordered category list.
  const ranked = creativeRanking.map((m) => byId.get(m.id) || m).filter((m) => usableForWriting(m, job.minContext, now));
  const pool = ranked.length ? ranked : catalog.filter((m) => usableForWriting(m, job.minContext, now));
  const scored = pool.map((model, index) => ({
    model,
    price: perMillion(model.pricing?.completion),
    json: (model.supported_parameters || []).includes('response_format'),
    free: model.id.endsWith(':free') || perMillion(model.pricing?.completion) === 0,
    score: scoreOf(scores, model),
    // Lower is better: usage rank, boosted for non-English books when the model is also popular for translation.
    rank: index - (!english && translation.has(model.id) ? 5 : 0),
  }));

  // Free models have tight rate limits, so they are a last resort; JSON support makes answers reliable.
  const fits = (s) => s.price <= PRICE_CAP[budget] && !s.free;
  let candidates = scored.filter((s) => fits(s) && s.json);
  if (!candidates.length) candidates = scored.filter(fits);
  if (!candidates.length) candidates = scored.filter((s) => s.price <= PRICE_CAP[budget]);
  if (!candidates.length) return null;

  const byUsage = [...candidates].sort((a, b) => a.rank - b.rank || a.price - b.price);
  const haveScores = byUsage.some((c) => c.score !== null);
  // Missing scores sort last; ties keep usage order.
  const byQuality = (list) => [...list].sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.rank - b.rank);
  if (budget === 'best') {
    // The strongest of the most-used models: measured quality when known, otherwise the priciest tier as a proxy.
    const leaders = byUsage.slice(0, 12);
    candidates = haveScores ? byQuality(leaders) : leaders.sort((a, b) => b.price - a.price || a.rank - b.rank);
  } else if (budget === 'balanced' && haveScores && job.tierShift === 0) {
    // (Simple jobs that dropped to "balanced" skip the quality ranking: popular and cheap is enough.)
    candidates = byQuality(byUsage.slice(0, 8));
  } else {
    candidates = byUsage;
  }
  const chosen = candidates.slice(0, 3);
  const lead = chosen[0];
  const why = budget === 'best'
    ? (lead.score !== null ? 'the highest-scoring of the models most used for creative writing' : 'the strongest of the models most used for creative writing')
    : budget === 'balanced'
      ? (lead.score !== null && job.tierShift === 0 ? 'the highest-scoring popular creative-writing model within a balanced budget' : 'the most-used creative-writing model within a balanced budget')
      : 'the most-used low-cost creative-writing model';
  const details = [lead.score !== null ? `quality score ${Math.round(lead.score)}` : '', `$${lead.price.toFixed(2)} per million tokens`].filter(Boolean).join(', ');
  return {
    models: chosen.map((c) => c.model.id),
    json: chosen.every((c) => c.json),
    tier: budget,
    reason: `For ${job.label}: ${why}${!english && translation.has(lead.model.id) ? `, also popular for ${language.trim()}` : ''} (${details}).`,
  };
}

// Picture models: preferred families per budget, matched against what OpenRouter offers today (newest first).
const IMAGE_PREFERENCE = {
  best: [/^openai\/gpt-image/, /gemini-[\d.]+-pro-image/, /^black-forest-labs\/flux/, /nano-banana/],
  balanced: [/nano-banana/, /gemini-[\d.]+-flash-image/, /seedream/, /^black-forest-labs\/flux/, /^openai\/gpt-image/],
  thrifty: [/flash-lite-image/, /gemini-[\d.]+-flash-image/, /seedream.*flash/, /mai-image.*flash/, /nano-banana/],
};
// Clean outlines for coloring pages: these families follow "line art" instructions well.
const LINE_ART_PREFERENCE = [/^recraft\//, /^openai\/gpt-image/, /^black-forest-labs\/flux/];
// Vector/layered outputs are SVG or multi-layer files, which a picture page can't use.
const NOT_RASTER = /vector|svg|layer/i;

// withReferences: only models that accept reference pictures (to keep characters looking the same).
function pickImageModel({ models = [], tier = 'balanced', lineArt = false, withReferences = false }) {
  const budget = normalTier(tier);
  const usable = models.filter((m) => typeof m.id === 'string' && !NOT_RASTER.test(m.id)
    && (m.architecture?.output_modalities || ['image']).includes('image')
    && (!withReferences || Boolean(m.supported_parameters?.input_references)));
  if (!usable.length) return null;
  const patterns = lineArt && budget !== 'thrifty' ? [...LINE_ART_PREFERENCE, ...IMAGE_PREFERENCE[budget]] : IMAGE_PREFERENCE[budget];
  for (const pattern of patterns) {
    const hit = usable.find((m) => pattern.test(m.id));
    if (hit) {
      return { model: hit.id, params: hit.supported_parameters || {}, reason: `${lineArt ? 'Coloring pages' : 'Pictures'}: ${hit.name || hit.id}, a ${budget === 'best' ? 'top-quality' : budget === 'balanced' ? 'well-rounded' : 'low-cost'} picture model.` };
    }
  }
  const fallback = usable[0];
  return { model: fallback.id, params: fallback.supported_parameters || {}, reason: `Pictures: ${fallback.name || fallback.id}, the newest picture model available.` };
}

const SPEECH_PREFERENCE = {
  best: [/gemini-[\d.]+-(pro-)?tts/, /mai-voice-[\d.]+$/, /minimax\/speech-[\d.]+-hd/, /elevenlabs/],
  balanced: [/mai-voice-[\d.]+-flash/, /gemini-[\d.]+-flash-tts/, /deepgram\/aura/, /minimax\/speech-[\d.]+-turbo/],
  thrifty: [/kokoro/, /flash-lite-tts/, /mai-voice-[\d.]+-flash/, /deepgram\/aura/],
};

// Picks a voice the model actually has: the requested one, else a US-English voice, else its first voice.
function pickVoice(supported, requested) {
  if (!supported.length) return requested || 'alloy';
  const wanted = (requested || '').toLowerCase();
  const exact = supported.find((v) => v.toLowerCase() === wanted);
  if (exact) return exact;
  const named = wanted && supported.find((v) => v.toLowerCase().includes(`-${wanted}:`) || v.toLowerCase().startsWith(`${wanted}`));
  if (named) return named;
  return supported.find((v) => /^en-us/i.test(v)) || supported.find((v) => /^en[-_]/i.test(v)) || supported[0];
}

function pickSpeechModel({ models = [], tier = 'balanced', voice = '' }) {
  const budget = normalTier(tier);
  const usable = models.filter((m) => typeof m.id === 'string');
  if (!usable.length) return null;
  const withVoices = usable.filter((m) => (m.supported_voices || []).length);
  const pool = withVoices.length ? withVoices : usable;
  let hit = null;
  for (const pattern of SPEECH_PREFERENCE[budget]) {
    hit = pool.find((m) => pattern.test(m.id));
    if (hit) break;
  }
  hit ||= pool[0];
  const chosenVoice = pickVoice(hit.supported_voices || [], voice);
  return { model: hit.id, voice: chosenVoice, reason: `Narration: ${hit.name || hit.id} with the ${chosenVoice.split(':')[0]} voice.` };
}

// Claude Code model aliases per job and budget.
function pickClaudeModel({ task = 'story', tier = 'balanced' }) {
  const budget = shiftTier(normalTier(tier), (TASKS[task] || TASKS.story).tierShift);
  return { best: task === 'story' ? 'opus' : 'sonnet', balanced: 'sonnet', thrifty: 'haiku' }[budget];
}

// ChatGPT: the account's own model list arrives in OpenAI's recommended order.
function pickChatGptModel({ models = [], task = 'story', tier = 'balanced' }) {
  if (!models.length) return null;
  const budget = shiftTier(normalTier(tier), (TASKS[task] || TASKS.story).tierShift);
  if (budget === 'thrifty') {
    const light = models.find((m) => /mini|lite|nano/i.test(`${m.slug} ${m.display_name || ''}`));
    if (light) return light.slug;
  }
  return models[0].slug;
}

// fal.ai picture models (endpoint IDs from fal's live text-to-image list). Families per budget, best first;
// the list is checked against what fal offers today, so retired models are skipped automatically.
const FAL_PREFERENCE = {
  best: [/^openai\/gpt-image-[\d.]+\/sunburst\/text-to-image$/, /^fal-ai\/nano-banana-pro$/, /^blackforestlabs\/flux-\d+\/text-to-image$/, /^fal-ai\/flux-2-pro$/, /^openai\/gpt-image-\d/],
  balanced: [/^fal-ai\/nano-banana-2$/, /^fal-ai\/flux-2-pro$/, /^bytedance\/seedream\/v\d+\/pro\/text-to-image$/, /^fal-ai\/flux\/dev$/],
  thrifty: [/^fal-ai\/flux\/schnell$/, /^fal-ai\/flux-2\/klein\/4b$/, /^fal-ai\/z-image\/turbo$/, /nano-banana-2-lite$/],
};
// Recraft follows "clean line art" instructions well, which suits coloring pages.
const FAL_LINE_ART = [/^fal-ai\/recraft\/v[\d.]+\/text-to-image$/, /^recraft\/v[\d.]+\/flash\/text-to-image$/];
// Not plain picture makers: vector/SVG output, add-on-weight (LoRA) variants, control rigs, material maps.
const FAL_SKIP = /vector|svg|lora|controlnet|kontext|material|layer/i;

// fal.ai: the "edit" form of a picture model takes reference pictures (image_urls). Same families, per budget.
const FAL_EDIT_PREFERENCE = {
  best: [/^openai\/gpt-image-[\d.]+\/sunburst\/edit$/, /^fal-ai\/nano-banana-pro\/edit$/, /^fal-ai\/flux-2-pro\/edit$/, /^openai\/gpt-image-\d[\d.]*\/edit$/],
  balanced: [/^fal-ai\/nano-banana-2\/edit$/, /^bytedance\/seedream\/v\d+\/pro\/edit$/, /^fal-ai\/flux-2-pro\/edit$/],
  thrifty: [/^google\/nano-banana-lite\/edit$/, /^fal-ai\/flux-2\/klein\/4b\/edit$/, /^bytedance\/seedream\/v\d+\/lite\/edit$/, /^fal-ai\/nano-banana-2\/edit$/],
};
function pickFalEditModel({ models = [], tier = 'balanced' }) {
  const budget = normalTier(tier);
  const usable = models.filter((m) => typeof m?.endpoint_id === 'string' && /\/edit$/.test(m.endpoint_id) && !FAL_SKIP.test(m.endpoint_id)
    && (m.metadata?.status ?? 'active') === 'active');
  for (const pattern of FAL_EDIT_PREFERENCE[budget]) {
    const hit = usable.find((m) => pattern.test(m.endpoint_id));
    if (hit) return { model: hit.endpoint_id, reason: `Pictures with your characters: ${hit.metadata?.display_name || hit.endpoint_id} on fal.ai.` };
  }
  return usable[0] ? { model: usable[0].endpoint_id, reason: `Pictures with your characters: ${usable[0].metadata?.display_name || usable[0].endpoint_id} on fal.ai.` } : null;
}

function pickFalModel({ models = [], tier = 'balanced', lineArt = false }) {
  const budget = normalTier(tier);
  const usable = models.filter((m) => typeof m?.endpoint_id === 'string' && !FAL_SKIP.test(m.endpoint_id)
    && (m.metadata?.status ?? 'active') === 'active');
  if (!usable.length) return null;
  const label = budget === 'best' ? 'a top-quality' : budget === 'balanced' ? 'a well-rounded' : 'a fast, low-cost';
  const patterns = lineArt && budget !== 'thrifty' ? [...FAL_LINE_ART, ...FAL_PREFERENCE[budget]] : FAL_PREFERENCE[budget];
  // Version number in an ID like ".../v4.1/..." (0 if none), so the newest of a family wins.
  const version = (id) => Number((/\/v(\d+(?:\.\d+)?)\//.exec(id) || [])[1] || 0);
  for (const pattern of patterns) {
    const hit = usable.filter((m) => pattern.test(m.endpoint_id)).sort((a, b) => version(b.endpoint_id) - version(a.endpoint_id))[0];
    if (hit) {
      const name = hit.metadata?.display_name || hit.endpoint_id;
      return { model: hit.endpoint_id, reason: `${lineArt ? 'Coloring pages' : 'Pictures'}: ${name}, ${label} picture model on fal.ai.` };
    }
  }
  const fallback = usable[0];
  return { model: fallback.endpoint_id, reason: `Pictures: ${fallback.metadata?.display_name || fallback.endpoint_id}, the most-used picture model on fal.ai.` };
}

module.exports = { TIERS, pickTextModels, pickImageModel, pickFalModel, pickFalEditModel, pickSpeechModel, pickVoice, pickClaudeModel, pickChatGptModel };
