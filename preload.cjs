'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const call = (channel, ...args) => ipcRenderer.invoke(channel, ...args);
// For handlers that return { ok } or { error } instead of throwing.
const soft = async (channel, ...args) => {
  const result = await call(channel, ...args);
  if (result?.error) throw new Error(result.error);
  return result?.ok;
};

contextBridge.exposeInMainWorld('storyloom', {
  // Books
  listBooks: () => call('books:list'),
  createBook: (input) => call('books:create', input),
  readBook: (id) => call('books:read', id),
  saveBook: (book) => call('books:save', book),
  renameBook: (id, title) => call('books:rename', id, title),
  duplicateBook: (id, overrides) => call('books:duplicate', id, overrides), // overrides: { title?, kind? }
  deleteBook: (id) => call('books:delete', id),
  // Pictures and sounds (stored in the book's folder; shown via app://media/<bookId>/<name>)
  importImage: (id) => call('books:import-image', id),
  listImages: (id) => call('books:list-images', id),
  saveImage: (id, bytes) => call('books:save-image', id, bytes), // bytes: Uint8Array of a PNG/JPEG/WebP/GIF
  importAudio: (id) => call('books:import-audio', id),
  listAudio: (id) => call('books:list-audio', id),
  saveRecording: (id, bytes) => call('books:save-recording', id, bytes), // bytes: Uint8Array (WebM/WAV/MP3/M4A/OGG)
  importStoryText: () => call('import:story-text'), // → { name, text } | null
  // Library
  listShelves: () => call('shelves:list'),
  saveShelves: (shelves) => call('shelves:save', shelves),
  listCharacters: () => call('characters:list'), // pictures: app://media/_characters/<image>
  saveCharacter: (character, bookId) => call('characters:save', character, bookId),
  deleteCharacter: (id) => call('characters:delete', id),
  insertCharacter: (bookId, characterId) => call('characters:insert', bookId, characterId),
  getProfile: () => call('profile:get'),
  saveProfile: (input) => call('profile:save', input),
  // Export
  exportPdf: (input) => call('books:export-pdf', input), // { title, size, mode: 'digital' | 'print' }
  exportEpub: (input) => call('books:export-epub', input), // { bookId, pages: [{ body, label }], css, width, height, coverImage }
  exportWav: (input) => call('books:export-wav', input), // { title, bytes }
  revealExport: () => call('books:reveal-export'),
  // App and AI services
  openDataFolder: () => call('app:open-data-folder'),
  appInfo: () => call('app:info'),
  getSettings: () => call('settings:get'),
  saveSettings: async (input) => {
    const result = await call('settings:save', input);
    if (result?.error) throw new Error(result.error);
    return result?.settings;
  },
  generateStory: (input) => call('ai:generate', input), // → { title, chapters: [{ title, text }], pages: [text] }
  generateChapter: (input) => call('ai:chapter', input), // → { text }
  generateImage: (input) => call('ai:image', input), // { bookId, prompt, style?, lineArt? } → asset name
  generateSpeech: (input) => call('ai:speech', input), // { bookId, text, voice? } → asset name
  aiRecommendations: () => soft('ai:recommendations'), // → [{ job, model, fallbacks, reason }]
  chatGptStatus: () => soft('ai:chatgpt-status'), // → { signedIn, planEnabled, email, signingIn }
  chatGptSignIn: () => soft('ai:chatgpt-sign-in'), // opens the browser → { signedIn, planEnabled, email, firstTime } | { declined }
  chatGptCancel: () => call('ai:chatgpt-cancel'),
  chatGptWelcomed: () => soft('ai:chatgpt-welcomed'),
  chatGptSignOut: () => soft('ai:chatgpt-sign-out'), // → { revoked }
  chatGptModels: () => soft('ai:chatgpt-models'), // → [{ slug, display_name }]
  claudeStatus: (force) => soft('ai:claude-status', force), // → { installed, signedIn, method, version, message? }
  openLink: (name) => call('ai:open-link', name), // 'chatgpt-usage' | 'openrouter-keys' | 'claude-code'
  onBeforeClose: (fn) => ipcRenderer.on('app:before-close', () => fn()),
  onMenuAction: (fn) => ipcRenderer.on('menu:action', (_event, action) => {
    if (action === 'undo' || action === 'redo') fn(action);
  }),
  closeReady: () => call('app:close-ready'),
});
