'use strict';
// "Sign in with ChatGPT" for open-source, locally hosted apps (OpenAI's self-serve flow, preview).
// https://developers.openai.com/siwc/token-sharing-open-source
//
// - First sign-in registers Storyloom with client_id=dynamic_agent_client; OpenAI returns an issued client ID.
// - PKCE + state + nonce, a loopback callback on 127.0.0.1, ID token verified against OpenAI's published keys.
// - Plan usage needs the chatgpt.tokens.use.direct scope; requests go to the Responses API with store:false, stream:true.
// - Tokens are kept only in this process and in one file encrypted with the Mac keychain (safeStorage).
const crypto = require('node:crypto');
const http = require('node:http');

const SCOPES = 'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct';
const PLAN_SCOPE = 'chatgpt.tokens.use.direct';
const RESOURCE = 'https://api.openai.com/v1';
const APP_NAME = 'Storyloom';
const CALLBACK_PATH = '/auth/callback';
const SIGN_IN_TIMEOUT = 5 * 60 * 1000;

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const randomToken = () => b64url(crypto.randomBytes(32));

// Friendly text for OpenAI's documented ChatGPT-plan errors.
const PLAN_ERRORS = {
  subscription_sharing_user_not_eligible: 'This ChatGPT account can’t use its plan in other apps (Plus or Pro is needed, and some workspaces turn it off).',
  subscription_sharing_usage_limit_exceeded: 'You’ve reached your ChatGPT plan’s usage limit for now. See chatgpt.com/settings/usage.',
  subscription_sharing_usage_unavailable: 'ChatGPT couldn’t check your plan’s usage just now — try again in a minute.',
  subscription_sharing_unsupported_capability: 'ChatGPT plan usage doesn’t support this request.',
  subscription_sharing_route_not_supported: 'ChatGPT plan usage doesn’t support this request.',
  subscription_sharing_invalid_user: 'ChatGPT couldn’t confirm your account — sign in with ChatGPT again.',
  subscription_sharing_user_unavailable: 'ChatGPT account details are temporarily unavailable — try again in a minute.',
};
const UNUSABLE_REFRESH = new Set(['invalid_grant', 'invalid_refresh_token', 'token_expired', 'refresh_token_expired', 'refresh_token_invalidated', 'refresh_token_reused']);

function createChatGpt({ authBase = 'https://auth.openai.com', apiBase = 'https://api.openai.com/v1', callbackPort = 1455, loadRecord, saveRecord, openBrowser }) {
  let pending = null; // the sign-in in progress
  let refreshing = null; // serialises refreshes so a rotating refresh token is never used twice

  async function discovery() {
    const response = await fetch(`${authBase}/.well-known/openid-configuration`, { redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Could not reach ChatGPT sign-in');
    return response.json();
  }

  // Verifies an RS256 ID token against OpenAI's published keys, plus issuer, audience, expiry, and nonce.
  async function verifyIdToken(idToken, { clientId, nonce }) {
    const parts = typeof idToken === 'string' ? idToken.split('.') : [];
    if (parts.length !== 3) throw new Error('ChatGPT sign-in returned an unreadable identity');
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (header.alg !== 'RS256') throw new Error('ChatGPT sign-in used an unexpected signature type');
    const config = await discovery();
    const jwksResponse = await fetch(config.jwks_uri || `${authBase}/.well-known/jwks.json`, { redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (!jwksResponse.ok) throw new Error('Could not load ChatGPT’s signing keys');
    const { keys = [] } = await jwksResponse.json();
    const jwk = keys.find((k) => k.kid === header.kid) || (keys.length === 1 ? keys[0] : null);
    if (!jwk) throw new Error('ChatGPT sign-in used an unknown signing key');
    const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
    const valid = crypto.verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), key, Buffer.from(parts[2], 'base64url'));
    if (!valid) throw new Error('ChatGPT sign-in identity failed its signature check');
    const now = Math.floor(Date.now() / 1000);
    const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (claims.iss !== (config.issuer || authBase)) throw new Error('ChatGPT sign-in identity came from the wrong issuer');
    if (!audience.includes(clientId)) throw new Error('ChatGPT sign-in identity was issued for a different app');
    if (typeof claims.exp !== 'number' || claims.exp < now - 60) throw new Error('ChatGPT sign-in identity has expired');
    if (nonce && claims.nonce !== nonce) throw new Error('ChatGPT sign-in identity did not match this sign-in');
    if (typeof claims.sub !== 'string' || !claims.sub) throw new Error('ChatGPT sign-in identity is missing the account');
    return claims;
  }

  async function tokenRequest(form) {
    let response;
    try {
      response = await fetch(`${authBase}/api/accounts/oauth/token`, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(form),
      });
    } catch {
      const error = new Error('Could not reach ChatGPT sign-in');
      error.retryable = true;
      throw error;
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error('ChatGPT sign-in failed');
      error.code = data.error || data.error_code || '';
      error.status = response.status;
      throw error;
    }
    return data;
  }

  // Waits for the browser to come back to http://127.0.0.1:<port>/auth/callback.
  function listen(port) {
    return new Promise((resolve, reject) => {
      let finish;
      const result = new Promise((res, rej) => { finish = { res, rej }; });
      const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://127.0.0.1');
        if (url.pathname !== CALLBACK_PATH) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end('<!doctype html><meta charset="utf-8"><title>Storyloom</title><body style="font:16px system-ui;padding:40px">'
          + '<h1>You can close this window</h1><p>Go back to Storyloom to finish.</p>');
        finish.res(url.searchParams);
      });
      server.on('error', (error) => reject(error.code === 'EADDRINUSE'
        ? new Error(`Another app is using port ${port}, which ChatGPT sign-in needs — close it and try again`) : error));
      server.listen(port, '127.0.0.1', () => {
        const timer = setTimeout(() => finish.rej(new Error('ChatGPT sign-in timed out — try again')), SIGN_IN_TIMEOUT);
        const done = result.finally(() => { clearTimeout(timer); server.close(); });
        done.catch(() => {}); // a cancel before anyone awaits the result is not an error
        resolve({
          port: server.address().port,
          result: done,
          cancel: () => finish.rej(new Error('Sign-in cancelled')),
        });
      });
    });
  }

  async function signIn() {
    if (pending) throw new Error('A ChatGPT sign-in is already open in your browser');
    const saved = (await loadRecord()) || {};
    const hostId = saved.hostId || `urn:uuid:${crypto.randomUUID()}`;
    const returning = Boolean(saved.clientId);
    // A first registration must use the fixed port; later sign-ins may use any free port.
    const listener = await listen(returning ? 0 : callbackPort);
    pending = listener;
    try {
      const redirectUri = `http://127.0.0.1:${listener.port}${CALLBACK_PATH}`;
      const state = randomToken();
      const nonce = randomToken();
      const verifier = randomToken();
      const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
      const params = new URLSearchParams({
        client_id: returning ? saved.clientId : 'dynamic_agent_client',
        ...(returning ? {} : { agent_name_hint: APP_NAME }),
        ext_agent_host_id: hostId,
        ...(returning && saved.idToken ? { id_token_hint: saved.idToken } : {}),
        ...(returning && saved.email ? { login_hint: saved.email } : {}),
        response_type: 'code', redirect_uri: redirectUri, scope: SCOPES, resource: RESOURCE,
        state, nonce, code_challenge_method: 'S256', code_challenge: challenge,
      });
      await openBrowser(`${authBase}/api/accounts/authorize?${params}`);
      const back = await listener.result;
      if (back.get('state') !== state) throw new Error('ChatGPT sign-in returned an unexpected response — try again');
      if (back.get('error')) {
        if (back.get('error') === 'access_denied') return { signedIn: false, declined: true };
        throw new Error('ChatGPT sign-in was not completed');
      }
      const issued = back.get('client_id');
      let clientId = saved.clientId;
      if (returning) {
        if (issued && issued !== clientId) throw new Error('ChatGPT sign-in returned a different app registration — try again');
      } else {
        if (!issued || issued === 'dynamic_agent_client') throw new Error('ChatGPT didn’t finish registering Storyloom — try again');
        clientId = issued;
      }
      const code = back.get('code');
      if (!code) throw new Error('ChatGPT sign-in was not completed');
      const tokens = await tokenRequest({ grant_type: 'authorization_code', client_id: clientId, code, code_verifier: verifier, redirect_uri: redirectUri, resource: RESOURCE });
      const claims = await verifyIdToken(tokens.id_token, { clientId, nonce });
      if (returning && saved.subject && saved.subject !== claims.sub) throw new Error('That’s a different ChatGPT account from the one connected before — sign out first to switch');
      const scopes = String(tokens.scope || back.get('scope') || '').split(/\s+/).filter(Boolean);
      const record = {
        hostId, clientId, subject: claims.sub, email: typeof claims.email === 'string' ? claims.email : '',
        idToken: tokens.id_token, accessToken: tokens.access_token, refreshToken: tokens.refresh_token || '',
        expiresAt: Date.now() + (Number(tokens.expires_in) || 3600) * 1000, scopes,
        welcomed: Boolean(saved.welcomed && saved.subject === claims.sub),
      };
      await saveRecord(record);
      return { signedIn: true, planEnabled: scopes.includes(PLAN_SCOPE), email: record.email, firstTime: !record.welcomed };
    } finally {
      pending = null;
      listener.cancel();
    }
  }

  function cancelSignIn() {
    pending?.cancel();
  }

  async function markWelcomed() {
    const record = await loadRecord();
    if (record) await saveRecord({ ...record, welcomed: true });
  }

  async function refresh(record) {
    try {
      const tokens = await tokenRequest({ grant_type: 'refresh_token', client_id: record.clientId, refresh_token: record.refreshToken, resource: RESOURCE });
      const next = {
        ...record, accessToken: tokens.access_token, refreshToken: tokens.refresh_token || record.refreshToken,
        expiresAt: Date.now() + (Number(tokens.expires_in) || 3600) * 1000,
        scopes: tokens.scope ? String(tokens.scope).split(/\s+/).filter(Boolean) : record.scopes,
      };
      await saveRecord(next);
      return next;
    } catch (error) {
      if (UNUSABLE_REFRESH.has(error.code)) {
        await saveRecord({ ...record, accessToken: '', refreshToken: '', expiresAt: 0 });
        throw new Error('Your ChatGPT sign-in has expired — sign in with ChatGPT again in Account');
      }
      throw new Error(error.retryable ? 'Could not reach ChatGPT — check your connection' : 'Could not renew your ChatGPT sign-in — try again');
    }
  }

  async function accessToken() {
    let record = await loadRecord();
    if (!record?.accessToken) throw new Error('Sign in with ChatGPT in Account → AI services first');
    if (!record.scopes?.includes(PLAN_SCOPE)) throw new Error('Allow Storyloom to use your ChatGPT plan: sign in with ChatGPT again in Account');
    if (record.expiresAt - Date.now() < 5 * 60 * 1000) {
      refreshing ||= refresh(record).finally(() => { refreshing = null; });
      record = await refreshing;
    }
    return record.accessToken;
  }

  async function status() {
    const record = await loadRecord();
    return {
      signedIn: Boolean(record?.accessToken),
      planEnabled: Boolean(record?.accessToken && record.scopes?.includes(PLAN_SCOPE)),
      email: record?.accessToken ? record.email || '' : '',
      signingIn: Boolean(pending),
    };
  }

  // Ends the renewable session at OpenAI, then forgets the tokens (keeps the app registration for next time).
  async function signOut() {
    const record = await loadRecord();
    if (!record) return { revoked: true };
    let revoked = !record.refreshToken;
    if (record.refreshToken) {
      let endpoint = `${authBase}/api/accounts/oauth/revoke`;
      try { endpoint = (await discovery()).revocation_endpoint || endpoint; } catch { /* use the default */ }
      for (let attempt = 0; attempt < 3 && !revoked; attempt++) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ token: record.refreshToken, token_type_hint: 'refresh_token', client_id: record.clientId }),
          });
          if (response.ok) revoked = true;
          else if (response.status < 500) break;
        } catch { /* network: retry */ }
        if (!revoked && attempt < 2) await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
      }
    }
    await saveRecord({ hostId: record.hostId, clientId: record.clientId, email: record.email, subject: record.subject, welcomed: record.welcomed });
    return { revoked };
  }

  async function models() {
    const token = await accessToken();
    const response = await fetch(`${apiBase}/models`, { headers: { Authorization: `Bearer ${token}` }, redirect: 'error', signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Could not load your ChatGPT models (HTTP ${response.status})`);
    const data = await response.json().catch(() => ({}));
    const list = Array.isArray(data.models) ? data.models : Array.isArray(data.data) ? data.data : [];
    return list.filter((m) => m && typeof m.slug === 'string' && (m.visibility === undefined || m.visibility === 'list'))
      .map((m) => ({ slug: m.slug, display_name: typeof m.display_name === 'string' ? m.display_name : m.slug }));
  }

  function planError(status, body) {
    const code = body?.error?.code || body?.code || '';
    if (PLAN_ERRORS[code]) return new Error(PLAN_ERRORS[code]);
    if (status === 401) return new Error('ChatGPT didn’t accept your sign-in — sign in with ChatGPT again');
    if (status === 403) return new Error('ChatGPT plan usage isn’t available for this account or region');
    if (status === 429) return new Error(PLAN_ERRORS.subscription_sharing_usage_limit_exceeded);
    if (status === 503) return new Error('ChatGPT plan usage is temporarily unavailable — try again soon');
    return new Error(`ChatGPT returned an error (HTTP ${status})`);
  }

  // One Responses API call, streamed; succeeds only on response.completed.
  async function respond({ instructions, user, model, maxBytes = 4_000_000 }) {
    const token = await accessToken();
    let response;
    try {
      response = await fetch(`${apiBase}/responses`, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(300000),
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ model, instructions, input: [{ role: 'user', content: user }], store: false, stream: true }),
      });
    } catch (error) {
      throw new Error(error.name === 'TimeoutError' ? 'ChatGPT took too long to answer' : 'Could not reach ChatGPT');
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      let body = {};
      try { body = JSON.parse(text); } catch { /* plain text */ }
      throw planError(response.status, body);
    }
    let text = '';
    let buffered = '';
    let size = 0;
    let completed = false;
    const decoder = new TextDecoder();
    const handle = (block) => {
      const data = block.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('\n');
      if (!data || data === '[DONE]') return;
      let event;
      try { event = JSON.parse(data); } catch { return; }
      if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') text += event.delta;
      else if (event.type === 'response.completed') completed = true;
      else if (event.type === 'response.failed' || event.type === 'error') throw planError(0, { error: event.response?.error || event.error || event });
      else if (event.type === 'response.incomplete') throw new Error('ChatGPT stopped before finishing — try again');
    };
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > maxBytes) throw new Error('ChatGPT’s answer was too large');
      buffered += decoder.decode(chunk, { stream: true }).replace(/\r\n/g, '\n');
      let cut;
      while ((cut = buffered.indexOf('\n\n')) !== -1) {
        handle(buffered.slice(0, cut));
        buffered = buffered.slice(cut + 2);
      }
    }
    if (buffered.trim()) handle(buffered);
    if (!completed) throw new Error('ChatGPT’s answer was cut off — try again');
    return text;
  }

  return { signIn, cancelSignIn, signOut, status, models, respond, markWelcomed };
}

module.exports = { createChatGpt, PLAN_SCOPE };
