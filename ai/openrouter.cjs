'use strict';
// OpenRouter: one API key, hundreds of models. Storyloom reads OpenRouter's public live catalogues to pick
// the right model for each job (see model-picker.cjs) and passes fallbacks so a busy model doesn't fail the job.
const picker = require('./model-picker.cjs');

const CATALOG_TTL = 6 * 60 * 60 * 1000;

function createOpenRouter({ baseUrl = 'https://openrouter.ai/api/v1', getKey }) {
  const cache = new Map(); // path -> { at, data }

  async function request(path, { method = 'GET', body, auth = false, binary = false, maxBytes = 5_000_000, timeout = 120000 } = {}) {
    const headers = { 'X-Title': 'Storyloom' };
    if (body) headers['Content-Type'] = 'application/json';
    if (auth) {
      const key = await getKey();
      if (!key) throw new Error('Add your OpenRouter key in Account → AI services first');
      headers.Authorization = `Bearer ${key}`;
    }
    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method, headers, redirect: 'error', signal: AbortSignal.timeout(timeout), body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      throw new Error(error.name === 'TimeoutError' ? 'OpenRouter took too long to answer' : 'Could not reach OpenRouter', { cause: error });
    }
    const declared = Number(response.headers.get('content-length'));
    if (declared > maxBytes) throw new Error('OpenRouter’s answer was too large');
    const data = Buffer.from(await response.arrayBuffer());
    if (data.length > maxBytes) throw new Error('OpenRouter’s answer was too large');
    if (!response.ok) {
      let message = '';
      try { message = JSON.parse(data.toString('utf8'))?.error?.message || ''; } catch { /* not JSON */ }
      const known = {
        401: 'OpenRouter didn’t accept the key — check it in Account → AI services',
        402: 'Your OpenRouter account is out of credits — add credits at openrouter.ai',
        429: 'OpenRouter is busy right now — wait a moment and try again',
      }[response.status];
      throw new Error(known || `OpenRouter returned an error (HTTP ${response.status})${message ? `: ${String(message).slice(0, 200)}` : ''}`);
    }
    if (binary) return { data, type: response.headers.get('content-type') || '' };
    try { return JSON.parse(data.toString('utf8')); } catch { throw new Error('OpenRouter’s answer was not understood'); }
  }

  // Catalogues, cached for six hours. A stale copy is used if a refresh fails.
  async function catalog(path, { auth = false } = {}) {
    const hit = cache.get(path);
    if (hit && Date.now() - hit.at < CATALOG_TTL) return hit.data;
    try {
      const result = await request(path, { auth, maxBytes: 20_000_000, timeout: 30000 });
      const data = Array.isArray(result?.data) ? result.data : [];
      cache.set(path, { at: Date.now(), data });
      return data;
    } catch (error) {
      if (hit) return hit.data;
      throw error;
    }
  }

  // Measured quality scores need an OpenRouter key; without one the picker uses popularity and price.
  async function qualityScores() {
    if (!(await getKey())) return [];
    return catalog('/benchmarks?source=artificial-analysis&task_type=intelligence', { auth: true }).catch(() => []);
  }

  async function chooseText({ task, tier, language }) {
    const [all, creative, translation, benchmarks] = await Promise.all([
      catalog('/models'),
      catalog('/models?category=roleplay').catch(() => []),
      isEnglishish(language) ? [] : catalog('/models?category=translation').catch(() => []),
      qualityScores(),
    ]);
    return picker.pickTextModels({ catalog: all, creativeRanking: creative, translationRanking: translation, benchmarks, task, tier, language });
  }
  const isEnglishish = (language) => !language || /^\s*english\s*$/i.test(language);

  async function chat({ system, user, maxTokens, task, tier, language, model }) {
    let plan;
    if (model) plan = { models: [model], json: true };
    else {
      plan = await chooseText({ task, tier, language });
      if (!plan) throw new Error('No OpenRouter writing model fits this budget right now — try a different budget');
    }
    const body = {
      ...(plan.models.length === 1 ? { model: plan.models[0] } : { models: plan.models }),
      temperature: 0.8,
      ...(maxTokens ? { max_tokens: maxTokens } : {}),
      ...(plan.json ? { response_format: { type: 'json_object' } } : {}),
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    };
    const data = await request('/chat/completions', { method: 'POST', body, auth: true, maxBytes: 4_000_000, timeout: 240000 });
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('OpenRouter’s answer was not understood');
    return { content, model: typeof data.model === 'string' ? data.model : plan.models[0] };
  }

  async function chooseImage({ tier, lineArt, withReferences = false }) {
    return picker.pickImageModel({ models: await catalog('/images/models'), tier, lineArt, withReferences });
  }

  // references: [{ data: Buffer, type: 'image/png' }] pictures to keep characters looking the same.
  // aspect: '1:1' | '3:4' | '4:3'. Returns { bytes, model, usedReferences }.
  async function image({ prompt, tier, lineArt, model, references = [], aspect = '1:1' }) {
    let plan;
    if (model) plan = { model, params: {} };
    else {
      // With references, prefer a model that accepts them; if none does, draw without them.
      plan = (references.length && await chooseImage({ tier, lineArt, withReferences: true })) || await chooseImage({ tier, lineArt });
      if (!plan) throw new Error('OpenRouter has no picture models available right now');
    }
    const useReferences = references.length > 0 && (Boolean(model) || Boolean(plan.params?.input_references));
    // Only send optional settings the model says it supports (a typed-in model has no catalogue data, so none).
    const allowed = (name, value) => {
      const spec = plan.params?.[name];
      return Boolean(spec) && (!Array.isArray(spec.values) || spec.values.includes(value));
    };
    const body = {
      model: plan.model, prompt, n: 1,
      ...(allowed('aspect_ratio', aspect) ? { aspect_ratio: aspect } : allowed('aspect_ratio', '1:1') ? { aspect_ratio: '1:1' } : {}),
      ...(allowed('output_format', 'png') ? { output_format: 'png' } : {}),
      ...(useReferences ? {
        input_references: references.map((r) => ({ type: 'image_url', image_url: { url: `data:${r.type};base64,${r.data.toString('base64')}` } })),
      } : {}),
    };
    const data = await request('/images', { method: 'POST', body, auth: true, maxBytes: 40_000_000, timeout: 240000 });
    const item = data?.data?.[0];
    if (typeof item?.b64_json !== 'string') throw new Error('OpenRouter did not return a picture');
    if (item.media_type && !/^image\/(png|jpeg|webp|gif)$/.test(item.media_type)) throw new Error('OpenRouter returned a picture format Storyloom can’t use — try another picture model');
    return { bytes: Buffer.from(item.b64_json, 'base64'), model: plan.model, usedReferences: useReferences };
  }

  async function chooseSpeech({ tier, voice }) {
    return picker.pickSpeechModel({ models: await catalog('/models?output_modalities=speech'), tier, voice });
  }

  async function speech({ text, tier, voice, model }) {
    let plan;
    if (model) {
      const known = (await catalog('/models?output_modalities=speech').catch(() => [])).find((m) => m.id === model);
      plan = { model, voice: picker.pickVoice(known?.supported_voices || [], voice) };
    } else {
      plan = await chooseSpeech({ tier, voice });
      if (!plan) throw new Error('OpenRouter has no voice models available right now');
    }
    const { data } = await request('/audio/speech', {
      method: 'POST', auth: true, binary: true, maxBytes: 100_000_000, timeout: 240000,
      body: { model: plan.model, input: text, voice: plan.voice, response_format: 'mp3' },
    });
    return { bytes: data, model: plan.model, voice: plan.voice };
  }

  // What Storyloom would use right now for each job, with the reasons, for the Account screen.
  async function recommendations({ tier, language }) {
    const safe = (promise) => promise.catch(() => null);
    const [story, chapter, captions, picture, lineArt, voice] = await Promise.all([
      safe(chooseText({ task: 'story', tier, language })), safe(chooseText({ task: 'chapter', tier, language })),
      safe(chooseText({ task: 'captions', tier, language })), safe(chooseImage({ tier, lineArt: false })),
      safe(chooseImage({ tier, lineArt: true })), safe(chooseSpeech({ tier, voice: '' })),
    ]);
    return [
      story && { job: 'Whole stories', model: story.models[0], fallbacks: story.models.slice(1), reason: story.reason },
      chapter && { job: 'Chapters', model: chapter.models[0], fallbacks: chapter.models.slice(1), reason: chapter.reason },
      captions && { job: 'Coloring captions', model: captions.models[0], fallbacks: captions.models.slice(1), reason: captions.reason },
      picture && { job: 'Pictures', model: picture.model, fallbacks: [], reason: picture.reason },
      lineArt && { job: 'Coloring pages', model: lineArt.model, fallbacks: [], reason: lineArt.reason },
      voice && { job: 'Narration', model: voice.model, fallbacks: [], reason: voice.reason },
    ].filter(Boolean);
  }

  return { chat, image, speech, recommendations, clearCache: () => cache.clear() };
}

module.exports = { createOpenRouter };
