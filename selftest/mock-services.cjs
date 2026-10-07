'use strict';
// Local stand-ins for OpenRouter, ChatGPT sign-in + Responses API, and the Claude Code program,
// so every subscription path runs end to end in the self-test and unit tests without real accounts.
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { makePng, makeWav, writerReply } = require('./mock-ai.cjs');

// ---------------- OpenRouter ----------------
const textModel = (id, perMillion, extra = {}) => ({
  id, name: id, canonical_slug: id, context_length: 128000,
  architecture: { input_modalities: ['text'], output_modalities: ['text'] },
  pricing: { prompt: String(perMillion / 4e6), completion: String(perMillion / 1e6) },
  supported_parameters: ['response_format', 'max_tokens', 'temperature'], ...extra,
});
const OR_MODELS = [
  textModel('mock/popular-writer', 0.8),
  textModel('mock/fine-writer', 4),
  textModel('mock/grand-writer', 18),
  textModel('openrouter/auto', 1),
];
const OR_CREATIVE = ['mock/popular-writer', 'mock/fine-writer', 'mock/grand-writer'];
const OR_IMAGES = [
  { id: 'mock/vector-art', name: 'Vector', supported_parameters: {} },
  { id: 'openai/gpt-image-mock', name: 'GPT Image (mock)', supported_parameters: { aspect_ratio: { values: ['1:1', '16:9'] }, output_format: { values: ['png', 'webp'] } } },
  { id: 'google/gemini-nano-banana-mock', name: 'Nano Banana (mock)', supported_parameters: { aspect_ratio: { values: ['1:1'] } } },
  { id: 'recraft/recraft-mock', name: 'Recraft (mock)', supported_parameters: {} },
];
const OR_SPEECH = [
  { id: 'microsoft/mai-voice-2.1-flash', name: 'MAI Voice Flash (mock)', supported_voices: ['en-GB-Ada:MAI', 'en-US-Nova:MAI'] },
  { id: 'hexgrad/kokoro-82m', name: 'Kokoro (mock)', supported_voices: ['af_bella'] },
];

function startOpenRouter({ key = 'sk-or-test' } = {}) {
  const calls = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (d) => { raw += d; if (raw.length > 5_000_000) req.destroy(); });
    req.on('end', () => {
      let body = {};
      try { body = JSON.parse(raw || '{}'); } catch { /* keep empty */ }
      const url = new URL(req.url, 'http://x');
      calls.push({ method: req.method, path: url.pathname, query: url.search, body, auth: req.headers.authorization || '', title: req.headers['x-title'] || '' });
      const json = (data, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
      const authed = req.headers.authorization === `Bearer ${key}`;
      if (req.method === 'GET' && url.pathname === '/models') {
        if (url.searchParams.get('category') === 'roleplay') return json({ data: OR_CREATIVE.map((id) => ({ id })) });
        if (url.searchParams.get('category')) return json({ data: [] });
        if (url.searchParams.get('output_modalities') === 'speech') return json({ data: OR_SPEECH });
        return json({ data: OR_MODELS });
      }
      if (req.method === 'GET' && url.pathname === '/images/models') return json({ data: OR_IMAGES });
      if (req.method === 'GET' && url.pathname === '/benchmarks') {
        if (!authed) return json({ error: { code: 401, message: 'Missing Authentication header' } }, 401);
        // The mid-priced writer scores highest, so "Best quality" must pick it over the priciest one.
        return json({ data: [
          { source: 'artificial-analysis', model_permaslug: 'mock/fine-writer', intelligence_index: 72 },
          { source: 'artificial-analysis', model_permaslug: 'mock/grand-writer', intelligence_index: 65 },
        ], meta: {} });
      }
      if (req.method !== 'POST') { res.writeHead(404); return res.end(); }
      if (!authed) return json({ error: { code: 401, message: 'No auth credentials found' } }, 401);
      if (url.pathname === '/chat/completions') {
        const model = body.model || body.models?.[0];
        return json({ model, choices: [{ message: { role: 'assistant', content: writerReply(body.messages?.[0]?.content || '', body.messages?.[1]?.content || '') } }] });
      }
      if (url.pathname === '/images') {
        const png = makePng({ lineArt: /line art/i.test(body.prompt || '') });
        return json({ created: 1, data: [{ b64_json: png.toString('base64'), media_type: 'image/png' }] });
      }
      if (url.pathname === '/audio/speech') {
        res.writeHead(200, { 'Content-Type': 'audio/wav' });
        return res.end(makeWav());
      }
      res.writeHead(404);
      return res.end();
    });
  });
  return listen(server, { calls, key });
}

// ---------------- ChatGPT (auth.openai.com + api.openai.com) ----------------
function startChatGpt({ declinePlan = false, deny = false } = {}) {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const kid = 'mock-key-1';
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid, alg: 'RS256', use: 'sig' };
  const calls = [];
  const codes = new Map(); // code -> { clientId, challenge, redirect, nonce, scope }
  const tokens = new Map(); // access token -> true
  const refreshTokens = new Map(); // refresh token -> clientId
  const options = { declinePlan, deny, usageLimit: false, idTokenTamper: null };
  let base = '';
  const sign = (claims) => {
    const head = Buffer.from(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const sig = crypto.sign('RSA-SHA256', Buffer.from(`${head}.${body}`), privateKey).toString('base64url');
    return `${head}.${body}.${sig}`;
  };
  const issue = (clientId, scope, nonce) => {
    const access = `at-${crypto.randomUUID()}`;
    const refresh = `rt-${crypto.randomUUID()}`;
    tokens.set(access, true);
    refreshTokens.set(refresh, clientId);
    const now = Math.floor(Date.now() / 1000);
    let idClaims = { iss: base, aud: clientId, sub: 'user-123', email: 'reader@example.com', iat: now, exp: now + 3600, ...(nonce ? { nonce } : {}) };
    if (options.idTokenTamper) idClaims = { ...idClaims, ...options.idTokenTamper };
    return { access_token: access, refresh_token: refresh, id_token: sign(idClaims), token_type: 'Bearer', expires_in: 3600, scope };
  };

  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (d) => { raw += d; if (raw.length > 2_000_000) req.destroy(); });
    req.on('end', () => {
      const url = new URL(req.url, base);
      calls.push({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), raw });
      const json = (data, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
      if (url.pathname === '/.well-known/openid-configuration') {
        return json({ issuer: base, authorization_endpoint: `${base}/api/accounts/authorize`, token_endpoint: `${base}/api/accounts/oauth/token`, jwks_uri: `${base}/.well-known/jwks.json`, revocation_endpoint: `${base}/api/accounts/oauth/revoke` });
      }
      if (url.pathname === '/.well-known/jwks.json') return json({ keys: [jwk] });
      if (url.pathname === '/api/accounts/authorize') {
        const q = url.searchParams;
        const redirect = new URL(q.get('redirect_uri'));
        if (redirect.hostname !== '127.0.0.1' || q.get('code_challenge_method') !== 'S256' || !q.get('state')) { res.writeHead(400); return res.end('bad request'); }
        redirect.searchParams.set('state', q.get('state'));
        if (options.deny) {
          redirect.searchParams.set('error', 'access_denied');
        } else {
          const clientId = q.get('client_id') === 'dynamic_agent_client' ? `oaiapp_mock_${crypto.randomUUID().slice(0, 8)}` : q.get('client_id');
          const scope = options.declinePlan ? q.get('scope').split(' ').filter((s) => s !== 'chatgpt.tokens.use.direct').join(' ') : q.get('scope');
          const code = `code-${crypto.randomUUID()}`;
          codes.set(code, { clientId, challenge: q.get('code_challenge'), redirect: q.get('redirect_uri'), nonce: q.get('nonce'), scope });
          redirect.searchParams.set('code', code);
          redirect.searchParams.set('client_id', clientId);
          redirect.searchParams.set('scope', scope);
        }
        res.writeHead(302, { Location: redirect.toString() });
        return res.end();
      }
      if (url.pathname === '/api/accounts/oauth/token' && req.method === 'POST') {
        const form = new URLSearchParams(raw);
        if (form.get('grant_type') === 'authorization_code') {
          const entry = codes.get(form.get('code'));
          codes.delete(form.get('code'));
          const challenge = crypto.createHash('sha256').update(form.get('code_verifier') || '').digest('base64url');
          if (!entry || entry.clientId !== form.get('client_id') || entry.redirect !== form.get('redirect_uri') || entry.challenge !== challenge) {
            return json({ error: 'invalid_grant' }, 400);
          }
          return json(issue(entry.clientId, entry.scope, entry.nonce));
        }
        if (form.get('grant_type') === 'refresh_token') {
          const clientId = refreshTokens.get(form.get('refresh_token'));
          if (!clientId || clientId !== form.get('client_id')) return json({ error: 'invalid_grant' }, 400);
          refreshTokens.delete(form.get('refresh_token')); // rotation: each refresh token works once
          return json(issue(clientId, 'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct'));
        }
        return json({ error: 'unsupported_grant_type' }, 400);
      }
      if (url.pathname === '/api/accounts/oauth/revoke' && req.method === 'POST') {
        refreshTokens.delete(new URLSearchParams(raw).get('token'));
        res.writeHead(200);
        return res.end();
      }
      const bearer = (req.headers.authorization || '').replace(/^Bearer /, '');
      if (url.pathname === '/v1/models' && req.method === 'GET') {
        if (!tokens.has(bearer)) return json({ error: { code: 'invalid_token' } }, 401);
        return json({ models: [
          { slug: 'gpt-mock-sol', display_name: 'GPT Mock', visibility: 'list' },
          { slug: 'gpt-mock-mini', display_name: 'GPT Mock mini', visibility: 'list' },
          { slug: 'gpt-mock-hidden', display_name: 'Hidden', visibility: 'hide' },
        ] });
      }
      if (url.pathname === '/v1/responses' && req.method === 'POST') {
        if (!tokens.has(bearer)) return json({ error: { code: 'invalid_token' } }, 401);
        let body = {};
        try { body = JSON.parse(raw); } catch { /* bad body */ }
        if (body.store !== false || body.stream !== true || !Array.isArray(body.input) || 'temperature' in body || 'max_output_tokens' in body) {
          return json({ error: { code: 'invalid_request', message: 'store:false, stream:true and an input array are required' } }, 400);
        }
        res.writeHead(200, { 'Content-Type': 'text/event-stream' });
        const send = (event) => res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
        if (options.usageLimit) {
          send({ type: 'response.failed', response: { error: { code: 'subscription_sharing_usage_limit_exceeded' } } });
          return res.end();
        }
        const text = writerReply(body.instructions || '', body.input[0]?.content || '');
        send({ type: 'response.created' });
        for (let i = 0; i < text.length; i += 40) send({ type: 'response.output_text.delta', delta: text.slice(i, i + 40) });
        send({ type: 'response.completed', response: { status: 'completed' } });
        return res.end();
      }
      res.writeHead(404);
      return res.end();
    });
  });
  return listen(server, { calls, options, refreshTokens, onUrl: (url) => { base = url; } });
}

function listen(server, extra) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${server.address().port}`;
      extra.onUrl?.(url);
      resolve({ url, close: () => server.close(), ...extra });
    });
  });
}

// ---------------- Claude Code ----------------
// A stand-in "claude" program (a shell script) that answers like `claude -p --output-format json`.
// It records its arguments so tests can check every tool and setting was switched off.
async function makeFakeClaude(dir) {
  await fs.mkdir(dir, { recursive: true });
  const program = path.join(dir, 'claude');
  const log = path.join(dir, 'claude-args.log');
  const story = JSON.stringify(JSON.stringify({
    title: 'The Claude Lantern',
    chapters: [1, 2, 3, 4].map((n) => ({ title: `Part ${n}`, text: `Page ${n} of a story written by the Claude plan.` })),
  }));
  const chapter = JSON.stringify(JSON.stringify({ text: 'Claude wrote this chapter.' }));
  const script = `#!/bin/sh
# Fake Claude Code for Storyloom's self-test.
printf '%s\\n' "$*" >> ${JSON.stringify(log)}
if [ "$1" = "--version" ]; then echo "9.9.9 (Claude Code)"; exit 0; fi
if [ "$1" = "auth" ]; then echo '{"loggedIn": true, "authMethod": "claude.ai"}'; exit 0; fi
cat > /dev/null
case "$*" in
  *"one chapter"*) printf '{"type":"result","is_error":false,"result":%s,"modelUsage":{"claude-mock":{}}}' ${shellQuote(chapter)} ;;
  *) printf '{"type":"result","is_error":false,"result":%s,"modelUsage":{"claude-mock":{}}}' ${shellQuote(story)} ;;
esac
`;
  await fs.writeFile(program, script, { mode: 0o755 });
  return { program, log };
}
const shellQuote = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;

module.exports = { startOpenRouter, startChatGpt, makeFakeClaude, OR_MODELS };
