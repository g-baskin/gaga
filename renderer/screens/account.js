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

  function aiSection(s) {
    const error = h('p', { class: 'export-error', id: 'account-ai-error', role: 'alert' });
    const status = h('span', { class: 'muted', id: 'account-ai-status' });
    const voice = s.voice && !VOICES.includes(s.voice) ? [s.voice, ...VOICES] : VOICES;
    const form = h('form', { class: 'form account-form', onsubmit: async (e) => {
      e.preventDefault();
      error.textContent = '';
      status.textContent = '';
      const data = new FormData(form);
      try {
        const saved = await api.saveSettings({
          baseUrl: data.get('baseUrl'), model: data.get('model'), imageModel: data.get('imageModel'), speechModel: data.get('speechModel'),
          voice: data.get('voice'), apiKey: data.get('apiKey'), clearKey: data.get('clearKey') === 'on',
        });
        state.settings = saved;
        aiHost.replaceChildren(aiSection(saved));
        document.getElementById('account-ai-status').textContent = 'Saved';
      } catch (err) { error.textContent = cleanError(err); }
    } },
    h('p', { class: 'muted' }, 'Optional. Connect your own OpenAI-compatible service to draft stories, paint pictures, and read aloud. Without one, everything else still works.'),
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
    error,
    h('div', { class: 'form-actions' }, status, h('button', { class: 'btn primary', id: 'account-ai-save' }, 'Save AI settings')));
    return form;
  }
  let aiHost;

  registerScreen('account', {
    label: 'Account', scope: 'app',
    async render(host) {
      const [profile, settings, info] = await Promise.all([
        api.getProfile().catch(() => ({ authorName: '', bookOrder: [] })),
        api.getSettings().catch(() => state.settings),
        api.appInfo().catch(() => ({ version: '', dataFolder: '' })),
      ]);
      state.settings = settings;
      aiHost = h('div', {}, aiSection(settings));
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
          h('strong', {}, 'Sign-in, passwords, credits and subscriptions — not needed'),
          h('span', {}, ': Storyloom runs entirely on this Mac, so there is no online account to create or pay for.'))));
    },
  });
})();
