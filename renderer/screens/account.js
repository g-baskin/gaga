(() => {
  'use strict';
  // Account: local profile, own AI service settings, data folder, about. No cloud sign-in.

  const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  const field = (label, input, hint) => h('label', { class: 'field' }, h('span', { class: 'field-label' }, label), input,
    hint ? h('span', { class: 'muted small-print' }, hint) : null);

  function profileSection(profile) {
    const status = h('span', { class: 'muted', id: 'account-profile-status' });
    const input = h('input', { id: 'account-author', name: 'authorName', value: profile.authorName || '', maxlength: '200', placeholder: 'Your name' });
    const form = h('form', { class: 'form account-form', onsubmit: async (e) => {
      e.preventDefault();
      const saved = await run(() => api.saveProfile({ ...profile, authorName: input.value.trim() }));
      if (saved) { Object.assign(profile, saved); status.textContent = 'Saved'; }
    } },
    field('Default author name', input, 'Filled in on every new book. You can change it per book.'),
    h('div', { class: 'form-actions' }, status, h('button', { class: 'btn primary', id: 'account-profile-save' }, 'Save')));
    return h('section', { class: 'export-details', id: 'account-profile' }, h('h2', {}, 'Profile'), form);
  }

  // ---------- AI services ----------
  const WRITERS = [
    ['claude', 'Claude plan', 'Your Claude Pro or Max plan, through Claude Code on this Mac'],
    ['chatgpt', 'ChatGPT plan', 'Your ChatGPT Plus or Pro plan'],
    ['openrouter', 'OpenRouter', 'Picks the best model for each job; pay as you go'],
    ['custom', 'Your own service', 'Any OpenAI-compatible address, including Ollama'],
  ];
  const MEDIA = [['openrouter', 'OpenRouter'], ['custom', 'Your own service']];
  const TIERS = [
    ['best', 'Best quality', 'Strongest models; costs more'],
    ['balanced', 'Balanced', 'Great results at a sensible price'],
    ['thrifty', 'Lowest cost', 'Cheapest models that still do the job'],
  ];

  // A row of radio "cards" (accessible: real radio inputs inside labels).
  function choices(name, options, value, onchange) {
    return h('div', { class: 'ai-choices', role: 'radiogroup' }, options.map(([v, label, hint]) =>
      h('label', { class: 'ai-choice' },
        h('input', { type: 'radio', name, value: v, id: `account-${name}-${v}`, checked: v === value, onchange: () => onchange(v) }),
        h('span', { class: 'ai-choice-label' }, label),
        hint ? h('span', { class: 'ai-choice-hint' }, hint) : null)));
  }

  // Saves only the given fields, then redraws the AI section.
  async function saveAi(patch, message = 'Saved') {
    const error = document.getElementById('account-ai-error');
    if (error) error.textContent = '';
    try {
      state.settings = await api.saveSettings(patch);
      // A new budget or key changes which models fit, so fetch fresh picks.
      if ('tier' in patch || 'openrouterKey' in patch || 'clearOpenrouterKey' in patch) live.recs = undefined;
      await drawAi();
      const status = document.getElementById('account-ai-status');
      if (status) status.textContent = message;
      return true;
    } catch (err) {
      const el = document.getElementById('account-ai-error');
      if (el) el.textContent = cleanError(err);
      return false;
    }
  }

  function claudePanel(s, claude) {
    const ok = claude?.installed && claude?.signedIn;
    const badge = !claude ? ['Checking…', ''] : ok ? [`Connected${claude.method === 'subscription' ? ' to your Claude plan' : ''}`, 'ok']
      : claude.installed ? ['Not signed in', 'warn'] : ['Not installed', 'warn'];
    return h('div', { class: 'ai-panel', id: 'account-claude' },
      h('div', { class: 'ai-panel-head' }, h('strong', {}, 'Claude Code'), h('span', { class: `ai-badge ${badge[1]}`, id: 'account-claude-state' }, badge[0])),
      h('p', { class: 'muted small-print' }, 'Storyloom asks the Claude Code app on this Mac to write, so it uses your own Claude sign-in. Storyloom never sees your login. '
        + 'Writing only. Plan limits are meant for personal use, so use an API key if you build a product on this.'),
      claude && !claude.installed ? h('p', { class: 'small-print' }, claude.message || 'Claude Code isn’t installed.') : null,
      claude?.installed && !claude.signedIn ? h('p', { class: 'small-print' }, 'Open Terminal, run “claude”, and sign in with your Claude account. Then check again.') : null,
      claude?.installed && claude.method === 'api-key' ? h('p', { class: 'small-print' }, 'Claude Code is signed in with an API key, so writing is billed to that key, not your plan.') : null,
      h('div', { class: 'color-row' },
        field('Model', h('select', { id: 'account-claude-model', onchange: (e) => saveAi({ claudeModel: e.target.value }) },
          [['', 'Automatic (Claude Code’s choice)'], ['opus', 'Opus — strongest'], ['sonnet', 'Sonnet — balanced'], ['haiku', 'Haiku — fastest']]
            .map(([v, l]) => h('option', { value: v, selected: v === s.claudeModel }, l))))),
      h('div', { class: 'form-actions export-start' },
        h('button', { type: 'button', class: 'btn secondary small', id: 'account-claude-check', onclick: () => drawAi({ forceClaude: true }) }, 'Check again'),
        claude && !claude.installed ? h('button', { type: 'button', class: 'btn ghost small', onclick: () => api.openLink('claude-code') }, 'Get Claude Code') : null));
  }

  function chatGptPanel(s, gpt, models) {
    const signedIn = gpt?.signedIn;
    const badge = !gpt ? ['Checking…', ''] : gpt.signingIn ? ['Waiting for your browser…', ''] : signedIn && gpt.planEnabled ? ['Connected', 'ok']
      : signedIn ? ['Plan use not allowed', 'warn'] : ['Not signed in', ''];
    const modelSelect = h('select', { id: 'account-chatgpt-model', disabled: !(signedIn && gpt.planEnabled), onchange: (e) => saveAi({ chatgptModel: e.target.value }) },
      [['', 'Automatic (best available)'], ...(models || []).map((m) => [m.slug, m.display_name || m.slug])]
        .map(([v, l]) => h('option', { value: v, selected: v === s.chatgptModel }, l)));
    const signIn = async () => {
      const button = document.getElementById('account-chatgpt-sign-in');
      button.disabled = true;
      button.textContent = 'Waiting for your browser…';
      const error = document.getElementById('account-ai-error');
      error.textContent = '';
      try {
        const result = await api.chatGptSignIn();
        if (result?.firstTime && result.planEnabled) await welcome();
      } catch (err) {
        error.textContent = cleanError(err);
      }
      await drawAi();
    };
    return h('div', { class: 'ai-panel', id: 'account-chatgpt' },
      h('div', { class: 'ai-panel-head' }, h('strong', {}, 'ChatGPT'), h('span', { class: `ai-badge ${badge[1]}`, id: 'account-chatgpt-state' }, badge[0])),
      signedIn ? h('p', { class: 'small-print' }, 'Signed in as ', h('strong', { id: 'account-chatgpt-email' }, gpt.email || 'your ChatGPT account'), '.')
        : h('p', { class: 'muted small-print' }, 'Uses the AI allowance included in your ChatGPT Plus or Pro plan, through OpenAI’s official sign-in. No API key needed. Writing only.'),
      signedIn && !gpt.planEnabled ? h('p', { class: 'small-print' }, 'You signed in but didn’t allow Storyloom to use your plan. Sign in again and allow it, or choose another service.') : null,
      signedIn && gpt.planEnabled ? field('Model', modelSelect) : null,
      h('div', { class: 'form-actions export-start' },
        !signedIn || !gpt.planEnabled
          ? h('button', { type: 'button', class: 'btn chatgpt-btn', id: 'account-chatgpt-sign-in', disabled: gpt?.signingIn, onclick: signIn },
            'Continue with ChatGPT')
          : null,
        gpt?.signingIn ? h('button', { type: 'button', class: 'btn ghost small', onclick: async () => { await api.chatGptCancel(); drawAi(); } }, 'Cancel') : null,
        signedIn ? h('button', { type: 'button', class: 'btn ghost small', id: 'account-chatgpt-usage', onclick: () => api.openLink('chatgpt-usage') }, 'Manage usage') : null,
        signedIn ? h('button', { type: 'button', class: 'btn ghost small danger', id: 'account-chatgpt-sign-out', onclick: async () => {
          if (!(await confirmDialog('Sign out of ChatGPT in Storyloom?', { confirmLabel: 'Sign out' }))) return;
          try {
            const result = await api.chatGptSignOut();
            if (result && !result.revoked) toast('Signed out here. ChatGPT didn’t confirm, so you can also disconnect Storyloom in ChatGPT settings.');
          } catch (err) { toast(cleanError(err)); }
          drawAi();
        } }, 'Sign out') : null));
  }

  // Shown once, the first time a ChatGPT plan is connected (OpenAI's guidelines ask for this).
  function welcome() {
    return new Promise((resolve) => {
      modal('You’re using your ChatGPT plan', (close) => h('div', { class: 'form confirm-dialog', id: 'account-chatgpt-welcome' },
        h('p', {}, 'Storyloom will use your ChatGPT plan when it writes stories, chapters, and coloring-book captions.'),
        h('p', { class: 'muted small-print' }, 'This counts toward your plan’s usage limits. You can see usage, set a weekly cap, or disconnect Storyloom in ChatGPT settings.'),
        h('div', { class: 'form-actions' },
          h('button', { type: 'button', class: 'btn ghost', onclick: () => api.openLink('chatgpt-usage') }, 'Manage usage'),
          h('button', { type: 'button', class: 'btn primary', id: 'account-chatgpt-welcome-ok', onclick: () => close() }, 'Got it'))),
      () => { api.chatGptWelcomed().catch(() => {}); resolve(); });
    });
  }

  function openRouterPanel(s, recs) {
    const key = h('input', { id: 'account-openrouter-key', class: 'ai-key-input', 'aria-label': 'OpenRouter key', type: 'password', autocomplete: 'off', placeholder: s.hasOpenrouterKey ? 'Saved — paste a new key to replace it' : 'sk-or-…' });
    const overrides = [['orTextModel', 'Writing model'], ['orImageModel', 'Picture model'], ['orSpeechModel', 'Voice model']];
    return h('div', { class: 'ai-panel', id: 'account-openrouter' },
      h('div', { class: 'ai-panel-head' }, h('strong', {}, 'OpenRouter'),
        h('span', { class: `ai-badge ${s.hasOpenrouterKey ? 'ok' : ''}`, id: 'account-openrouter-state' }, s.hasOpenrouterKey ? 'Key saved' : 'No key yet')),
      h('p', { class: 'muted small-print' }, 'One key for hundreds of models. Storyloom reads OpenRouter’s live model lists and usage rankings, then picks a model for each job to match your budget.'),
      h('fieldset', { class: 'ai-fieldset' }, h('legend', { class: 'field-label' }, 'Budget'), choices('tier', TIERS, s.tier, (v) => saveAi({ tier: v }))),
      h('div', { class: 'export-isbn-row' },
        key,
        h('button', { type: 'button', class: 'btn secondary', id: 'account-openrouter-save', onclick: async () => {
          if (!key.value.trim()) return;
          const value = key.value;
          key.value = '';
          if (!(await saveAi({ openrouterKey: value }, 'Key saved'))) key.value = value;
        } }, 'Save key'),
        s.hasOpenrouterKey ? h('button', { type: 'button', class: 'btn ghost small danger', id: 'account-openrouter-clear', onclick: () => saveAi({ clearOpenrouterKey: true }, 'Key removed') }, 'Remove') : null),
      h('p', { class: 'muted small-print' }, 'Encrypted with your Mac’s keychain. ', h('button', { type: 'button', class: 'link-btn', onclick: () => api.openLink('openrouter-keys') }, 'Get a key at openrouter.ai')),
      recs?.length ? h('div', { class: 'ai-picks', id: 'account-openrouter-picks' },
        h('div', { class: 'field-label' }, 'What Storyloom would use right now'),
        h('ul', {}, recs.map((r) => h('li', {},
          h('span', { class: 'ai-pick-job' }, r.job), h('code', {}, r.model),
          h('span', { class: 'muted small-print ai-pick-why' }, r.reason, r.fallbacks?.length ? ` Backups: ${r.fallbacks.join(', ')}.` : '')))))
        : recs === null ? h('p', { class: 'muted small-print', id: 'account-openrouter-picks' }, 'Loading OpenRouter’s model lists…')
          : h('p', { class: 'muted small-print', id: 'account-openrouter-picks' }, 'Couldn’t load OpenRouter’s model lists. Check your internet connection.'),
      h('details', { class: 'ai-advanced' }, h('summary', {}, 'Always use specific models instead'),
        h('div', { class: 'color-row' }, overrides.map(([name, label]) =>
          field(label, h('input', { id: `account-${name}`, value: s[name], placeholder: 'Automatic', spellcheck: 'false',
            onchange: (e) => saveAi({ [name]: e.target.value }) })))),
        h('p', { class: 'muted small-print' }, 'Use OpenRouter model IDs, like anthropic/claude-sonnet-4.6. Leave blank for automatic.')));
  }

  function customPanel(s) {
    const voice = s.voice && !VOICES.includes(s.voice) ? [s.voice, ...VOICES] : VOICES;
    const form = h('form', { class: 'ai-panel account-form', id: 'account-custom', onsubmit: async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      await saveAi({
        baseUrl: data.get('baseUrl'), model: data.get('model'), imageModel: data.get('imageModel'), speechModel: data.get('speechModel'),
        voice: data.get('voice'), apiKey: data.get('apiKey'), clearKey: data.get('clearKey') === 'on',
      });
    } },
    h('div', { class: 'ai-panel-head' }, h('strong', {}, 'Your own service'),
      h('span', { class: `ai-badge ${s.baseUrl ? 'ok' : ''}` }, s.baseUrl ? 'Set up' : 'Not set up')),
    h('p', { class: 'muted small-print' }, 'Any OpenAI-compatible service. Writing, pictures, and voices each use the model you name here.'),
    field('Service address', h('input', { name: 'baseUrl', id: 'account-base-url', value: s.baseUrl, placeholder: 'https://api.openai.com/v1', spellcheck: 'false' }),
      'For a free local option, run Ollama and use http://localhost:11434/v1.'),
    h('div', { class: 'color-row' },
      field('Writing model', h('input', { name: 'model', id: 'account-model', value: s.model, placeholder: 'gpt-4o-mini', spellcheck: 'false' })),
      field('Picture model', h('input', { name: 'imageModel', id: 'account-image-model', value: s.imageModel, placeholder: 'gpt-image-1', spellcheck: 'false' }))),
    h('div', { class: 'color-row' },
      field('Voice model', h('input', { name: 'speechModel', id: 'account-speech-model', value: s.speechModel, placeholder: 'tts-1', spellcheck: 'false' })),
      field('Voice', h('select', { name: 'voice', id: 'account-voice' }, voice.map((v) => h('option', { value: v, selected: v === (s.voice || 'alloy') }, v[0].toUpperCase() + v.slice(1)))))),
    field('API key', h('input', { name: 'apiKey', id: 'account-api-key', type: 'password', autocomplete: 'off', placeholder: s.hasKey ? 'Saved — leave blank to keep it' : 'Paste your key' }),
      'Your key is encrypted with your Mac’s keychain and is never shown again.'),
    s.hasKey ? h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'clearKey', id: 'account-clear-key' }), 'Remove the saved key') : null,
    h('div', { class: 'form-actions' }, h('button', { class: 'btn primary', id: 'account-ai-save' }, 'Save service')));
    return form;
  }

  // Live status is fetched in the background so the screen appears instantly.
  const live = { claude: undefined, gpt: undefined, models: undefined, recs: undefined };
  let aiHost;
  let drawToken = 0;
  async function drawAi({ forceClaude = false } = {}) {
    const token = ++drawToken;
    const s = state.settings;
    const render = () => {
      if (token !== drawToken || !aiHost?.isConnected) return;
      const keepOpen = aiHost.querySelector('details.ai-advanced')?.open;
      // Keep anything half-typed into the key field across redraws.
      const typedKey = aiHost.querySelector('#account-openrouter-key')?.value || '';
      const hadFocus = document.activeElement?.id === 'account-openrouter-key';
      aiHost.replaceChildren(...[
        h('p', { class: 'muted' }, 'Optional. Everything else in Storyloom works without AI.'),
        h('fieldset', { class: 'ai-fieldset' }, h('legend', { class: 'ai-subhead' }, 'Writing stories'),
          choices('writer', WRITERS, s.writer, (v) => saveAi({ writer: v }))),
        h('div', { class: 'ai-media-row' },
          field('Pictures', h('select', { id: 'account-pictures', onchange: (e) => saveAi({ pictures: e.target.value }) },
            MEDIA.map(([v, l]) => h('option', { value: v, selected: v === s.pictures }, l)))),
          field('Voices', h('select', { id: 'account-voices', onchange: (e) => saveAi({ voices: e.target.value }) },
            MEDIA.map(([v, l]) => h('option', { value: v, selected: v === s.voices }, l))))),
        h('p', { class: 'muted small-print' }, 'ChatGPT and Claude plans cover writing only. Pictures and voices use OpenRouter or your own service.'),
        h('p', { class: 'export-error', id: 'account-ai-error', role: 'alert' }),
        h('span', { class: 'muted ai-status', id: 'account-ai-status', role: 'status' }),
        s.writer === 'claude' ? claudePanel(s, live.claude) : null,
        s.writer === 'chatgpt' ? chatGptPanel(s, live.gpt, live.models) : null,
        [s.writer, s.pictures, s.voices].includes('openrouter') ? openRouterPanel(s, live.recs) : null,
        [s.writer, s.pictures, s.voices].includes('custom') ? customPanel(s) : null,
      ].filter(Boolean));
      if (keepOpen) aiHost.querySelector('details.ai-advanced')?.setAttribute('open', '');
      const keyInput = aiHost.querySelector('#account-openrouter-key');
      if (keyInput && typedKey) keyInput.value = typedKey;
      if (keyInput && hadFocus) keyInput.focus();
    };
    render();
    const jobs = [];
    if (s.writer === 'claude' && (forceClaude || live.claude === undefined)) {
      live.claude = forceClaude ? undefined : live.claude;
      jobs.push(api.claudeStatus(forceClaude).then((v) => { live.claude = v; }, (e) => { live.claude = { installed: false, message: cleanError(e) }; }));
    }
    if (s.writer === 'chatgpt') {
      jobs.push(api.chatGptStatus().then(async (v) => {
        live.gpt = v;
        live.models = v.signedIn && v.planEnabled ? await api.chatGptModels().catch(() => []) : [];
      }, () => { live.gpt = { signedIn: false }; }));
    }
    if ([s.writer, s.pictures, s.voices].includes('openrouter') && live.recs === undefined) {
      live.recs = null;
      jobs.push(api.aiRecommendations().then((v) => { live.recs = v; }, () => { live.recs = []; }));
    }
    if (jobs.length) { await Promise.all(jobs); render(); }
  }

  registerScreen('account', {
    label: 'Account', scope: 'app',
    async render(host) {
      const [profile, settings, info] = await Promise.all([
        api.getProfile().catch(() => ({ authorName: '', bookOrder: [] })),
        api.getSettings().catch(() => state.settings),
        api.appInfo().catch(() => ({ version: '', dataFolder: '' })),
      ]);
      state.settings = settings;
      live.recs = undefined; // refresh OpenRouter's picks each visit
      aiHost = h('div', { class: 'account-ai' });
      host.replaceChildren(h('div', { class: 'export-main account-main' },
        h('header', { class: 'export-head' }, h('h1', {}, 'Account'), h('p', { class: 'muted' }, 'Your settings for Storyloom on this Mac.')),
        profileSection(profile),
        h('section', { class: 'export-details', id: 'account-ai' }, h('h2', {}, 'AI services'), aiHost),
        h('section', { class: 'export-details', id: 'account-data' }, h('h2', {}, 'Your data'),
          h('p', {}, 'Books, pictures, and recordings are stored in this folder:'),
          h('code', { class: 'account-path', id: 'account-data-path' }, info.dataFolder),
          h('div', { class: 'form-actions export-start' },
            h('button', { class: 'btn secondary', id: 'account-open-data', onclick: () => run(() => api.openDataFolder()) }, 'Open data folder'))),
        h('section', { class: 'export-details', id: 'account-about' }, h('h2', {}, 'About'),
          h('p', {}, `Storyloom ${info.version}`, h('span', { class: 'muted' }, ' — a picture-book maker that works offline.'))),
        h('div', { class: 'export-unavailable', 'data-unavailable': 'cloud-account' },
          h('strong', {}, 'Storyloom account — not needed'),
          h('span', {}, ': Storyloom runs entirely on this Mac, so there is no Storyloom account, password, or subscription. AI services above are optional and billed by their own providers.'))));
      drawAi();
    },
  });
})();
