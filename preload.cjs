'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const call = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

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
  onBeforeClose: (fn) => ipcRenderer.on('app:before-close', () => fn()),
  onMenuAction: (fn) => ipcRenderer.on('menu:action', (_event, action) => {
    if (action === 'undo' || action === 'redo') fn(action);
  }),
  closeReady: () => call('app:close-ready'),
});
