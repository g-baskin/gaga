'use strict';
// AI and app settings (settings.json in the user's data folder). Keys are sealed with the Mac keychain (safeStorage)
// and never leave the main process; the page only sees publicSettings(). Every save is a read-modify-write, so
// saves go through one queue and never overlap.
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const modelPicker = require('../ai/model-picker.cjs');
const { readJsonFile } = require('../storage.cjs');

function createSettings({ app, safeStorage, reportDamaged, onClaudePathChanged = () => {} }) {
  const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
  const MODEL = /^[\w.:/@-]{1,200}$/;
  const VOICE = /^[\w.:-]{1,80}$/;
  const WRITERS = ['custom', 'openrouter', 'chatgpt', 'claude'];
  // Pictures: OpenRouter, fal.ai, or your own service. Voices: OpenRouter or your own service.
  const PICTURES = ['custom', 'openrouter', 'fal'];
  const VOICES = ['custom', 'openrouter'];
  async function readSettings() {
    const str = (v) => (typeof v === 'string' ? v : '');
    const one = (v, list, fallback) => (list.includes(v) ? v : fallback);
    const raw = (await readJsonFile(settingsFile(), {}, reportDamaged)) || {};
    return {
      baseUrl: str(raw.baseUrl), model: str(raw.model), imageModel: str(raw.imageModel), speechModel: str(raw.speechModel),
      voice: str(raw.voice), apiKeyEnc: str(raw.apiKeyEnc),
      writer: one(raw.writer, WRITERS, 'custom'), pictures: one(raw.pictures, PICTURES, 'custom'), voices: one(raw.voices, VOICES, 'custom'),
      tier: one(raw.tier, modelPicker.TIERS, 'balanced'),
      openrouterKeyEnc: str(raw.openrouterKeyEnc), orTextModel: str(raw.orTextModel), orImageModel: str(raw.orImageModel), orSpeechModel: str(raw.orSpeechModel),
      falKeyEnc: str(raw.falKeyEnc), falImageModel: str(raw.falImageModel),
      chatgptModel: str(raw.chatgptModel), claudeModel: str(raw.claudeModel), claudePath: str(raw.claudePath),
      checkUpdates: raw.checkUpdates !== false, // on unless turned off
    };
  }
  function checkBaseUrl(value) {
    if (!value) return '';
    let url;
    try { url = new URL(value); } catch { throw new Error('Enter a full address, like https://api.openai.com/v1'); }
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (!(url.protocol === 'https:' || (url.protocol === 'http:' && local))) {
      throw new Error('Use https — plain http is only allowed for a service running on this computer');
    }
    if (url.username || url.password) throw new Error('Put credentials in the API key field, not the address');
    url.hash = '';
    url.search = '';
    return url.toString().replace(/\/+$/, '');
  }
  function checkModel(value, label) {
    const model = typeof value === 'string' ? value.trim() : '';
    if (model && !MODEL.test(model)) throw new Error(`${label} names may only contain letters, numbers, and . : / @ - _`);
    return model;
  }
  function encryptSecret(value, label) {
    const secret = typeof value === 'string' ? value.trim() : '';
    if (secret.length > 1000) throw new Error(`That ${label} is too long`);
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure key storage is unavailable on this computer');
    return safeStorage.encryptString(secret).toString('base64');
  }
  const decryptSecret = (enc) => (enc ? safeStorage.decryptString(Buffer.from(enc, 'base64')) : '');
  async function writePrivate(file, text) {
    const temp = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
    try {
      await fs.writeFile(temp, text, { mode: 0o600 });
      await fs.rename(temp, file);
    } catch (error) {
      await fs.rm(temp, { force: true });
      throw error;
    }
  }
  // Each save reads the current settings, changes them, and writes them back, so saves must not overlap.
  let settingsQueue = Promise.resolve();
  function saveSettings(input = {}) {
    const next = settingsQueue.then(() => saveSettingsNow(input));
    settingsQueue = next.catch(() => {});
    return next;
  }
  async function saveSettingsNow(input = {}) {
    const current = await readSettings();
    const keep = (key) => (key in input ? input[key] : current[key]);
    const voice = typeof keep('voice') === 'string' ? keep('voice').trim() : '';
    if (voice && !VOICE.test(voice)) throw new Error('Voice names may only contain letters, numbers, and . : - _');
    const choose = (key, list, label) => {
      const value = keep(key);
      if (!list.includes(value)) throw new Error(`Choose a service for ${label}`);
      return value;
    };
    const claudePath = typeof keep('claudePath') === 'string' ? keep('claudePath').trim() : '';
    // Only a program named claude: this path is run, so it must not point Storyloom at any other program.
    if (claudePath && (!path.isAbsolute(claudePath) || claudePath.length > 1000 || path.basename(claudePath) !== 'claude')) {
      throw new Error('The Claude Code location must be the full path to the claude program, like /usr/local/bin/claude');
    }
    const next = {
      baseUrl: checkBaseUrl(typeof input.baseUrl === 'string' ? input.baseUrl.trim() : current.baseUrl),
      model: checkModel(keep('model'), 'Model'),
      imageModel: checkModel(keep('imageModel'), 'Picture model'),
      speechModel: checkModel(keep('speechModel'), 'Voice model'),
      voice,
      apiKeyEnc: current.apiKeyEnc,
      writer: choose('writer', WRITERS, 'writing'),
      pictures: choose('pictures', PICTURES, 'pictures'),
      voices: choose('voices', VOICES, 'voices'),
      tier: choose('tier', modelPicker.TIERS, 'the budget'),
      openrouterKeyEnc: current.openrouterKeyEnc,
      orTextModel: checkModel(keep('orTextModel'), 'Model'),
      orImageModel: checkModel(keep('orImageModel'), 'Picture model'),
      falKeyEnc: current.falKeyEnc,
      falImageModel: checkModel(keep('falImageModel'), 'Picture model'),
      orSpeechModel: checkModel(keep('orSpeechModel'), 'Voice model'),
      chatgptModel: checkModel(keep('chatgptModel'), 'Model'),
      claudeModel: checkModel(keep('claudeModel'), 'Model'),
      claudePath,
      checkUpdates: 'checkUpdates' in input ? input.checkUpdates === true : current.checkUpdates,
    };
    if (input.clearKey) next.apiKeyEnc = '';
    if (typeof input.apiKey === 'string' && input.apiKey.trim()) next.apiKeyEnc = encryptSecret(input.apiKey, 'API key');
    if (input.clearOpenrouterKey) next.openrouterKeyEnc = '';
    if (typeof input.openrouterKey === 'string' && input.openrouterKey.trim()) next.openrouterKeyEnc = encryptSecret(input.openrouterKey, 'OpenRouter key');
    if (input.clearFalKey) next.falKeyEnc = '';
    if (typeof input.falKey === 'string' && input.falKey.trim()) next.falKeyEnc = encryptSecret(input.falKey, 'fal.ai key');
    await writePrivate(settingsFile(), JSON.stringify(next));
    if (next.claudePath !== current.claudePath) onClaudePathChanged();
    return publicSettings(next);
  }
  const publicSettings = (s) => ({
    baseUrl: s.baseUrl, model: s.model, imageModel: s.imageModel, speechModel: s.speechModel, voice: s.voice, hasKey: Boolean(s.apiKeyEnc),
    writer: s.writer, pictures: s.pictures, voices: s.voices, tier: s.tier, hasOpenrouterKey: Boolean(s.openrouterKeyEnc),
    orTextModel: s.orTextModel, orImageModel: s.orImageModel, orSpeechModel: s.orSpeechModel,
    hasFalKey: Boolean(s.falKeyEnc), falImageModel: s.falImageModel,
    chatgptModel: s.chatgptModel, claudeModel: s.claudeModel, claudePath: s.claudePath,
    checkUpdates: s.checkUpdates,
  });

  return { readSettings, saveSettings, publicSettings, checkBaseUrl, decryptSecret, writePrivate, VOICE };
}

module.exports = { createSettings };
