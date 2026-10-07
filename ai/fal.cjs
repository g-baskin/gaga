'use strict';
// fal.ai: pictures from a large catalogue of image models with one key (https://fal.ai/docs).
// - The model list comes from fal's public Platform API (GET https://api.fal.ai/v1/models, text-to-image).
// - Each model publishes an OpenAPI schema; Storyloom reads it and only sends settings the model accepts
//   (square size, PNG, and sync_mode so the picture comes back inside the answer).
// - Pictures are made with a direct call to https://fal.run/<model> using "Authorization: Key <key>".
const picker = require('./model-picker.cjs');

const CATALOG_TTL = 6 * 60 * 60 * 1000;
const MAX_IMAGE = 40_000_000;
// Where fal serves finished pictures when it doesn't return them inline.
const FAL_MEDIA_HOST = /(^|\.)fal\.(media|ai|run)$/i;

function createFal({ runBase = 'https://fal.run', apiBase = 'https://api.fal.ai/v1', getKey, mediaHostOk = (host) => FAL_MEDIA_HOST.test(host) }) {
  const cache = new Map(); // url -> { at, data }

  async function key() {
    const value = await getKey();
    if (!value) throw new Error('Add your fal.ai key in Account → AI services first');
    return value;
  }

  // fal answers errors as { detail } (a string, or a list of validation problems).
  function falError(status, data) {
    const raw = data?.detail;
    const detail = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.map((d) => d?.msg).filter(Boolean).join('; ') : '';
    if (/balance|credit|billing|locked|payment/i.test(detail) || status === 402) {
      return new Error('Your fal.ai account is out of credit — add credit at fal.ai/dashboard/billing');
    }
    if (status === 401 || status === 403) return new Error('fal.ai didn’t accept the key — check it in Account → AI services');
    if (status === 429) return new Error('fal.ai is busy right now — wait a moment and try again');
    if (status === 422 || status === 400) return new Error(`fal.ai couldn’t use that request${detail ? `: ${detail.slice(0, 200)}` : ''}`);
    return new Error(`fal.ai returned an error (HTTP ${status})${detail ? `: ${detail.slice(0, 200)}` : ''}`);
  }

  async function getJson(url, { auth = false, timeout = 30000 } = {}) {
    const headers = {};
    if (auth) headers.Authorization = `Key ${await key()}`;
    let response;
    try {
      response = await fetch(url, { headers, redirect: 'error', signal: AbortSignal.timeout(timeout) });
    } catch (error) {
      throw new Error(error.name === 'TimeoutError' ? 'fal.ai took too long to answer' : 'Could not reach fal.ai');
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) throw falError(response.status, data);
    return data;
  }

  // Public lists, cached for six hours; a stale copy is used if a refresh fails.
  async function cached(url, load) {
    const hit = cache.get(url);
    if (hit && Date.now() - hit.at < CATALOG_TTL) return hit.data;
    try {
      const data = await load();
      cache.set(url, { at: Date.now(), data });
      return data;
    } catch (error) {
      if (hit) return hit.data;
      throw error;
    }
  }

  // Active text-to-image models, in fal's own order (most used first).
  function catalog() {
    const url = `${apiBase}/models?category=text-to-image&status=active&limit=100`;
    return cached(url, async () => {
      const data = await getJson(url);
      return Array.isArray(data?.models) ? data.models.filter((m) => typeof m?.endpoint_id === 'string') : [];
    });
  }

  // The input fields a model accepts, from its OpenAPI schema ({} if unknown).
  async function inputFields(endpoint) {
    const url = `${apiBase}/models?endpoint_id=${encodeURIComponent(endpoint)}&expand=openapi-3.0`;
    try {
      return await cached(url, async () => {
        const data = await getJson(url);
        const schemas = data?.models?.[0]?.openapi?.components?.schemas || {};
        const input = Object.entries(schemas).find(([name]) => name.endsWith('Input'))?.[1];
        return input?.properties || {};
      });
    } catch {
      return {};
    }
  }

  // Allowed values of a field, looking inside anyOf; null means "any value".
  function allowed(field) {
    if (!field) return [];
    const lists = [field.enum, ...(field.anyOf || []).map((f) => f.enum)].filter(Array.isArray);
    return lists.length ? lists.flat() : null;
  }
  const accepts = (field, value) => {
    const values = allowed(field);
    return values === null || values.includes(value);
  };

  function body(prompt, fields) {
    const out = { prompt };
    if (fields.image_size && accepts(fields.image_size, 'square_hd')) out.image_size = 'square_hd';
    else if (fields.aspect_ratio && accepts(fields.aspect_ratio, '1:1')) out.aspect_ratio = '1:1';
    if (fields.output_format && accepts(fields.output_format, 'png')) out.output_format = 'png';
    if (fields.num_images) out.num_images = 1;
    if (fields.sync_mode) out.sync_mode = true; // the picture comes back inside the answer
    return out;
  }

  // Reads a finished picture: inline (data: URL) or downloaded from fal's media host.
  async function readImage(url) {
    if (typeof url !== 'string') throw new Error('fal.ai did not return a picture');
    const inline = /^data:image\/[a-z+.-]+;base64,([A-Za-z0-9+/=\s]+)$/i.exec(url);
    if (inline) {
      const bytes = Buffer.from(inline[1], 'base64');
      if (bytes.length > MAX_IMAGE) throw new Error('fal.ai’s picture was too large');
      return bytes;
    }
    let next = url;
    for (let hop = 0; hop < 3; hop++) {
      let parsed;
      try { parsed = new URL(next); } catch { throw new Error('fal.ai returned an unreadable picture address'); }
      // https from fal's own hosts only (plain http is allowed just for a loopback test server).
      const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname);
      const secure = parsed.protocol === 'https:' || (parsed.protocol === 'http:' && loopback);
      if (!secure || !mediaHostOk(parsed.hostname)) throw new Error('fal.ai returned a picture from an unexpected address');
      let response;
      try {
        response = await fetch(parsed, { redirect: 'manual', signal: AbortSignal.timeout(120000) });
      } catch {
        throw new Error('Could not download the picture from fal.ai');
      }
      if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
        next = new URL(response.headers.get('location'), parsed).toString();
        continue;
      }
      if (!response.ok) throw new Error(`Could not download the picture from fal.ai (HTTP ${response.status})`);
      if (Number(response.headers.get('content-length')) > MAX_IMAGE) throw new Error('fal.ai’s picture was too large');
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > MAX_IMAGE) throw new Error('fal.ai’s picture was too large');
      return bytes;
    }
    throw new Error('Too many redirects while downloading the picture from fal.ai');
  }

  async function chooseImage({ tier, lineArt }) {
    return picker.pickFalModel({ models: await catalog(), tier, lineArt });
  }

  async function image({ prompt, tier, lineArt, model }) {
    let endpoint = model;
    if (!endpoint) {
      const plan = await chooseImage({ tier, lineArt });
      if (!plan) throw new Error('fal.ai has no picture models available right now');
      endpoint = plan.model;
    }
    const authorization = `Key ${await key()}`;
    const fields = await inputFields(endpoint);
    let response;
    try {
      response = await fetch(`${runBase}/${endpoint.split('/').map(encodeURIComponent).join('/')}`, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(300000),
        headers: { Authorization: authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify(body(prompt, fields)),
      });
    } catch (error) {
      throw new Error(error.name === 'TimeoutError' ? 'fal.ai took too long to draw the picture' : 'Could not reach fal.ai');
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) throw falError(response.status, data);
    if (data?.has_nsfw_concepts?.[0] === true) throw new Error('fal.ai’s safety filter blocked this picture — try describing it differently');
    const first = data?.images?.[0] || data?.image;
    return { bytes: await readImage(first?.url), model: endpoint };
  }

  // What would be used right now for pictures and coloring pages, for the Account screen.
  async function recommendations({ tier }) {
    const [picture, lineArt] = await Promise.all([
      chooseImage({ tier, lineArt: false }).catch(() => null),
      chooseImage({ tier, lineArt: true }).catch(() => null),
    ]);
    return [
      picture && { job: 'Pictures', model: picture.model, fallbacks: [], reason: picture.reason },
      lineArt && { job: 'Coloring pages', model: lineArt.model, fallbacks: [], reason: lineArt.reason },
    ].filter(Boolean);
  }

  return { catalog, inputFields, image, recommendations, chooseImage };
}

module.exports = { createFal };
