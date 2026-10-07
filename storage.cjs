'use strict';
// Local book storage. Pure Node so it can be tested without Electron.
// Layout: <root>/books/<bookId>/book.json, <root>/books/<bookId>/assets/<image|audio>,
// <root>/shelves.json, <root>/characters.json + <root>/characters/<image>, <root>/profile.json
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const ID = /^[a-z0-9-]{1,64}$/;
const IMAGE = /^[a-z0-9-]{1,64}\.(png|jpg|webp|gif)$/;
const AUDIO = /^[a-z0-9-]{1,64}\.(wav|mp3|m4a|ogg|webm)$/;
const LIBRARY = '_characters'; // Media folder for the reusable character library (not a valid book id).
const LAYOUTS = new Set(['cover', 'image-top', 'image-left', 'image-full', 'text-only', 'blank']);
const FRAMES = new Set(['none', 'thin', 'thick', 'double', 'dashed', 'dotted', 'rounded']);
const SHAPES = new Set(['rect', 'rounded', 'ellipse', 'triangle', 'star', 'burst', 'heart', 'cloud', 'speech', 'arrow']);
const FITS = new Set(['cover', 'contain']);
const MAX_ELEMENTS = 200;
const FONTS = new Set(['serif', 'sans', 'rounded', 'hand']);
const SIZES = new Set(['square', 'portrait', 'landscape']);
const ALIGN = new Set(['left', 'center', 'right']);
const COLOR = /^#[0-9a-f]{6}$/i;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_PAGES = 500;
const MAX_AUDIO_BYTES = 100 * 1024 * 1024;
const MAX_TEXT_BYTES = 2 * 1024 * 1024;
const KINDS = new Set(['story', 'coloring']);
const READING_LEVELS = new Set(['first-words', 'early-reader', 'growing-reader', 'confident-reader']);
const LENGTHS = new Set(['tiny', 'short', 'medium', 'long']);
const BLOCK_TYPES = new Set(['p', 'h2', 'h3', 'quote', 'li']);
const NARRATION_SOURCES = new Set(['recording', 'import', 'ai']);
const MAX_CHAPTERS = 200;
const MAX_BLOCKS = 2000;
const MAX_SHELVES = 200;
const MAX_CHARACTERS = 500;

const newId = () => crypto.randomUUID();
const text = (value, max, fallback = '') => (typeof value === 'string' ? value.slice(0, max) : fallback);
const pick = (value, set, fallback) => (set.has(value) ? value : fallback);
const color = (value, fallback) => (typeof value === 'string' && COLOR.test(value) ? value.toLowerCase() : fallback);

const num = (value, min, max, fallback) =>
  (typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value * 100) / 100)) : fallback);
const okId = (value) => (typeof value === 'string' && ID.test(value) ? value : newId());
const imageName = (value) => (typeof value === 'string' && IMAGE.test(value) ? value : null);
const audioName = (value) => (typeof value === 'string' && AUDIO.test(value) ? value : null);
const list = (value, max) => (Array.isArray(value) ? value.slice(0, max) : []);
const emoji = (value) => (typeof value === 'string' && value && value.length <= 16 && !/[\x00-\x1f<>&"']/.test(value) ? value : null);

// A crop is a window onto the source image, as fractions (0–1) of its width and height.
function sanitizeCrop(crop) {
  if (!crop || typeof crop !== 'object') return null;
  const f = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10000) / 10000 : NaN);
  const x = f(crop.x); const y = f(crop.y); const w = f(crop.w); const h = f(crop.h);
  if ([x, y, w, h].some(Number.isNaN)) return null;
  if (x < 0 || y < 0 || w < 0.01 || h < 0.01 || x + w > 1.0001 || y + h > 1.0001) return null;
  if (x === 0 && y === 0 && w >= 1 && h >= 1) return null; // Full image: same as no crop.
  return { x, y, w: Math.min(w, 1 - x), h: Math.min(h, 1 - y) };
}

// A design element placed freely on a page. Positions and sizes are in points (1/72 inch).
function sanitizeElement(el) {
  if (!el || typeof el !== 'object') return null;
  const base = {
    id: typeof el.id === 'string' && ID.test(el.id) ? el.id : newId(),
    x: num(el.x, -2000, 4000, 0),
    y: num(el.y, -2000, 4000, 0),
    w: num(el.w, 4, 4000, 100),
    h: num(el.h, 4, 4000, 100),
    rotation: num(el.rotation, -360, 360, 0),
    opacity: num(el.opacity, 0, 1, 1),
    locked: el.locked === true,
  };
  switch (el.type) {
    case 'text':
      return {
        ...base, type: 'text',
        text: text(el.text, 5000),
        font: pick(el.font, FONTS, 'serif'),
        fontSize: num(el.fontSize, 6, 300, 28),
        color: color(el.color, '#2a2433'),
        align: pick(el.align, ALIGN, 'center'),
        bold: el.bold === true,
        italic: el.italic === true,
        lineHeight: num(el.lineHeight, 0.8, 3, 1.25),
        letterSpacing: num(el.letterSpacing, -5, 40, 0),
        shadow: el.shadow === true,
        outline: el.outline === true,
        outlineColor: color(el.outlineColor, '#ffffff'),
        highlight: el.highlight == null ? null : color(el.highlight, null),
      };
    case 'image':
      if (typeof el.image !== 'string' || !IMAGE.test(el.image)) return null;
      return {
        ...base, type: 'image', image: el.image,
        fit: pick(el.fit, FITS, 'cover'),
        radius: num(el.radius, 0, 500, 0),
        borderWidth: num(el.borderWidth, 0, 60, 0),
        borderColor: color(el.borderColor, '#ffffff'),
        crop: sanitizeCrop(el.crop),
      };
    case 'shape':
      return {
        ...base, type: 'shape',
        shape: pick(el.shape, SHAPES, 'rect'),
        fill: el.fill == null ? null : color(el.fill, '#f2b84b'),
        stroke: color(el.stroke, '#2a2433'),
        strokeWidth: num(el.strokeWidth, 0, 60, 0),
      };
    case 'sticker': {
      // Emoji only: short, no control characters or markup.
      const char = typeof el.char === 'string' ? el.char : '';
      if (!char || char.length > 16 || /[\x00-\x1f<>&"']/.test(char)) return null;
      return { ...base, type: 'sticker', char };
    }
    case 'sound':
      // A tap-to-play button for the read-along player.
      return {
        ...base, type: 'sound',
        char: emoji(el.char) || '🔔',
        label: text(el.label, 80),
        sound: audioName(el.sound),
        fill: color(el.fill, '#fff4d6'),
        stroke: color(el.stroke, '#2a2433'),
      };
    default:
      return null;
  }
}

function assertId(id) {
  if (typeof id !== 'string' || !ID.test(id)) throw new Error('Invalid book id');
  return id;
}

function sanitizePage(page = {}) {
  const layout = pick(page.layout, LAYOUTS, 'image-top');
  return {
    id: typeof page.id === 'string' && ID.test(page.id) ? page.id : newId(),
    layout,
    text: text(page.text, 20000),
    image: imageName(page.image),
    crop: sanitizeCrop(page.crop),
    background: color(page.background, '#ffffff'),
    color: color(page.color, '#2a2433'),
    font: pick(page.font, FONTS, 'serif'),
    fontSize: Number.isFinite(page.fontSize)
      ? Math.min(96, Math.max(10, Math.round(page.fontSize)))
      : layout === 'cover' ? 48 : 24,
    align: pick(page.align, ALIGN, 'center'),
    frame: pick(page.frame, FRAMES, 'none'),
    frameColor: color(page.frameColor, '#2a2433'),
    elements: (Array.isArray(page.elements) ? page.elements.slice(0, MAX_ELEMENTS) : [])
      .map(sanitizeElement).filter(Boolean),
  };
}

function sanitizeCharacter(c) {
  if (!c || typeof c !== 'object') return null;
  const name = text(c.name, 80).trim();
  if (!name) return null;
  return { id: okId(c.id), name, role: text(c.role, 80), description: text(c.description, 1000), image: imageName(c.image) };
}

function sanitizeBuilder(b) {
  const src = b && typeof b === 'object' ? b : {};
  return {
    idea: text(src.idea, 4000),
    genre: text(src.genre, 60),
    writingStyle: list(src.writingStyle, 8).filter((v) => typeof v === 'string' && v.trim()).map((v) => v.slice(0, 40)),
    location: text(src.location, 200),
    era: text(src.era, 200),
    extras: text(src.extras, 2000),
    readingLevel: pick(src.readingLevel, READING_LEVELS, 'early-reader'),
    length: pick(src.length, LENGTHS, 'short'),
    templateId: typeof src.templateId === 'string' && ID.test(src.templateId) ? src.templateId : null,
    illustrationStyle: text(src.illustrationStyle, 60),
    characters: list(src.characters, 30).map(sanitizeCharacter).filter(Boolean),
  };
}

// Manuscript text is stored as structured runs, never as HTML.
function sanitizeBlock(block) {
  if (!block || typeof block !== 'object') return null;
  const runs = list(block.runs, 500)
    .filter((r) => r && typeof r.text === 'string' && r.text)
    .map((r) => {
      const run = { text: r.text.slice(0, 20000) };
      if (r.b === true) run.b = true;
      if (r.i === true) run.i = true;
      if (r.u === true) run.u = true;
      return run;
    });
  return { type: pick(block.type, BLOCK_TYPES, 'p'), runs };
}

function sanitizeManuscript(m) {
  const chapters = list(m?.chapters, MAX_CHAPTERS).filter((c) => c && typeof c === 'object').map((c) => ({
    id: okId(c.id),
    title: text(c.title, 200),
    blocks: list(c.blocks, MAX_BLOCKS).map(sanitizeBlock).filter(Boolean),
  }));
  return { chapters };
}

function sanitizeAudio(a, pageIds) {
  const src = a && typeof a === 'object' ? a : {};
  const narration = {};
  const raw = src.narration && typeof src.narration === 'object' ? src.narration : {};
  for (const pageId of Object.keys(raw)) {
    const n = raw[pageId];
    const file = audioName(n?.file);
    if (!pageIds.has(pageId) || !file) continue; // Drop narration for deleted pages.
    narration[pageId] = { file, duration: num(n.duration, 0, 36000, 0), source: pick(n.source, NARRATION_SOURCES, 'recording') };
  }
  const musicFile = audioName(src.music?.file);
  return {
    narration,
    music: musicFile ? { file: musicFile, volume: num(src.music.volume, 0, 1, 0.3), loop: src.music.loop !== false } : null,
    voice: typeof src.voice === 'string' && /^[\w.:-]{1,80}$/.test(src.voice) ? src.voice : '',
  };
}

// Keeps an ISBN only if it is a real ISBN-10 or ISBN-13 (correct length, prefix, and check digit).
function isValidIsbn(digits) {
  if (/^\d{9}[\dX]$/.test(digits)) {
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += (10 - i) * (digits[i] === 'X' ? 10 : Number(digits[i]));
    return sum % 11 === 0;
  }
  if (/^97[89]\d{10}$/.test(digits)) {
    let sum = 0;
    for (let i = 0; i < 13; i++) sum += Number(digits[i]) * (i % 2 ? 3 : 1);
    return sum % 10 === 0;
  }
  return false;
}
function sanitizeIsbn(value) {
  if (typeof value !== 'string') return '';
  const digits = value.toUpperCase().replace(/[\s-]/g, '');
  return isValidIsbn(digits) ? value.trim().slice(0, 20) : '';
}

function sanitizeBook(book, now = Date.now()) {
  const pages = (Array.isArray(book.pages) ? book.pages.slice(0, MAX_PAGES) : []).map(sanitizePage);
  if (pages.length === 0) pages.push(sanitizePage({ layout: 'cover' }));
  return {
    id: assertId(book.id),
    kind: pick(book.kind, KINDS, 'story'),
    title: text(book.title, 200).trim() || 'Untitled story',
    author: text(book.author, 200),
    size: pick(book.size, SIZES, 'square'),
    isbn: sanitizeIsbn(book.isbn),
    language: typeof book.language === 'string' && /^[A-Za-z][A-Za-z -]{0,39}$/.test(book.language) ? book.language : 'English',
    builder: sanitizeBuilder(book.builder),
    manuscript: sanitizeManuscript(book.manuscript),
    audio: sanitizeAudio(book.audio, new Set(pages.map((p) => p.id))),
    createdAt: Number.isFinite(book.createdAt) ? book.createdAt : now,
    updatedAt: now,
    pages,
  };
}

function sanitizeShelves(input) {
  const seen = new Set();
  return list(input, MAX_SHELVES).filter((s) => s && typeof s === 'object').map((s, index) => ({
    id: okId(s.id),
    name: text(s.name, 80).trim() || 'Untitled shelf',
    bookIds: [...new Set(list(s.bookIds, 5000).filter((id) => typeof id === 'string' && ID.test(id)))],
    order: Number.isFinite(s.order) ? s.order : index,
  })).filter((s) => !seen.has(s.id) && seen.add(s.id)).sort((a, b) => a.order - b.order);
}

function sanitizeProfile(p) {
  const src = p && typeof p === 'object' ? p : {};
  return {
    authorName: text(src.authorName, 200),
    bookOrder: list(src.bookOrder, 5000).filter((id) => typeof id === 'string' && ID.test(id)),
  };
}

// Checks the file's real contents, not just its name, so only actual images are served.
function sniffImage(head) {
  if (head.length >= 8 && head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'jpg';
  if (head.length >= 6 && /^GIF8[79]a$/.test(head.subarray(0, 6).toString('latin1'))) return 'gif';
  if (head.length >= 12 && head.subarray(0, 4).toString('latin1') === 'RIFF' && head.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  return null;
}

function sniffAudio(head) {
  const ascii = (a, b) => head.subarray(a, b).toString('latin1');
  if (head.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE') return 'wav';
  if (head.length >= 3 && ascii(0, 3) === 'ID3') return 'mp3';
  if (head.length >= 2 && head[0] === 0xff && (head[1] & 0xe0) === 0xe0 && (head[1] & 0x06) !== 0) return 'mp3'; // MPEG audio frame.
  if (head.length >= 12 && ascii(4, 8) === 'ftyp') return 'm4a';
  if (head.length >= 4 && ascii(0, 4) === 'OggS') return 'ogg';
  if (head.length >= 4 && head.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return 'webm';
  return null;
}

// Story text files: must decode as UTF-8 and contain no binary control characters.
function decodeStoryText(buffer) {
  if (buffer.length > MAX_TEXT_BYTES) throw new Error('Story files must be 2 MB or smaller');
  let body = buffer;
  if (body.length >= 3 && body[0] === 0xef && body[1] === 0xbb && body[2] === 0xbf) body = body.subarray(3);
  let decoded;
  try { decoded = new TextDecoder('utf-8', { fatal: true }).decode(body); } catch { throw new Error('Use a plain-text (.txt or .md) file saved as UTF-8'); }
  if (/[\x00-\x08\x0e-\x1f]/.test(decoded)) throw new Error('That file does not look like plain text');
  return decoded.replace(/\r\n?/g, '\n');
}

async function readHead(file, size) {
  const handle = await fs.open(file, 'r');
  try {
    const head = Buffer.alloc(size);
    const { bytesRead } = await handle.read(head, 0, size, 0);
    return head.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

function createStore(root) {
  const booksDir = path.join(root, 'books');
  const bookDir = (id) => path.join(booksDir, assertId(id));
  const bookFile = (id) => path.join(bookDir(id), 'book.json');

  async function writeJson(file, data) {
    const temp = `${file}.${crypto.randomBytes(6).toString('hex')}.tmp`;
    await fs.writeFile(temp, JSON.stringify(data, null, 2), { mode: 0o600 });
    await fs.rename(temp, file); // Atomic replace: a crash never leaves a half-written book.
  }

  const libraryDir = path.join(root, 'characters');
  async function readJson(file, fallback) {
    try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return fallback; }
  }
  const shelvesFile = path.join(root, 'shelves.json');
  const charactersFile = path.join(root, 'characters.json');
  const profileFile = path.join(root, 'profile.json');
  const loadShelves = async () => sanitizeShelves(await readJson(shelvesFile, []));
  const loadCharacters = async () => list(await readJson(charactersFile, []), MAX_CHARACTERS).map(sanitizeCharacter).filter(Boolean);
  const assetPath = (id, name) => path.join(bookDir(id), 'assets', name);

  async function addAsset(id, buffer, kind) {
    const name = `${newId()}.${kind}`;
    await fs.mkdir(path.join(bookDir(id), 'assets'), { recursive: true });
    await fs.writeFile(assetPath(id, name), buffer, { flag: 'wx', mode: 0o600 });
    return name;
  }

  async function read(id) {
    const parsed = JSON.parse(await fs.readFile(bookFile(id), 'utf8'));
    return sanitizeBook({ ...parsed, id }, Number.isFinite(parsed.updatedAt) ? parsed.updatedAt : Date.now());
  }

  return {
    async list() {
      await fs.mkdir(booksDir, { recursive: true });
      const books = [];
      for (const entry of await fs.readdir(booksDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || !ID.test(entry.name)) continue;
        try {
          const book = await read(entry.name);
          books.push({
            id: book.id, kind: book.kind, title: book.title, author: book.author, size: book.size, createdAt: book.createdAt,
            updatedAt: book.updatedAt, pageCount: book.pages.length, cover: book.pages[0],
          });
        } catch { /* Skip unreadable folders instead of breaking the whole library. */ }
      }
      return books.sort((a, b) => b.updatedAt - a.updatedAt);
    },

    async create(input = {}) {
      const book = sanitizeBook({ ...input, id: newId(), createdAt: Date.now() });
      await fs.mkdir(path.join(bookDir(book.id), 'assets'), { recursive: true });
      await writeJson(bookFile(book.id), book);
      return book;
    },

    read,

    async save(input) {
      const id = assertId(input?.id);
      const existing = await read(id); // Must already exist; also preserves createdAt.
      const book = sanitizeBook({ ...input, createdAt: existing.createdAt });
      await writeJson(bookFile(id), book);
      return book;
    },

    async remove(id, trash) {
      await read(id);
      await trash(bookDir(id));
      const shelves = await loadShelves();
      if (shelves.some((s) => s.bookIds.includes(id))) {
        await writeJson(shelvesFile, shelves.map((s) => ({ ...s, bookIds: s.bookIds.filter((b) => b !== id) })));
      }
    },

    async rename(id, title) {
      const book = await read(id);
      return this.save({ ...book, title });
    },

    // Copies the whole book folder (pages and assets) under a new id.
    async duplicate(id, overrides = {}) {
      const book = await read(id);
      const copy = sanitizeBook({ ...book, ...overrides, id: newId(), createdAt: Date.now() });
      if (!overrides.title) copy.title = `${book.title} (copy)`.slice(0, 200);
      await fs.mkdir(path.join(bookDir(copy.id), 'assets'), { recursive: true });
      for (const name of await fs.readdir(path.join(bookDir(id), 'assets')).catch(() => [])) {
        if (IMAGE.test(name) || AUDIO.test(name)) await fs.copyFile(assetPath(id, name), assetPath(copy.id, name), fs.constants.COPYFILE_EXCL);
      }
      await writeJson(bookFile(copy.id), copy);
      return copy;
    },

    async importImage(id, source) {
      await read(id);
      const stat = await fs.stat(source);
      if (!stat.isFile()) throw new Error('Choose an image file');
      if (stat.size > MAX_IMAGE_BYTES) throw new Error('Images must be 25 MB or smaller');
      const kind = sniffImage(await readHead(source, 12));
      if (!kind) throw new Error('Use a PNG, JPEG, WebP, or GIF image');
      const name = `${newId()}.${kind}`;
      await fs.mkdir(path.join(bookDir(id), 'assets'), { recursive: true });
      await fs.copyFile(source, path.join(bookDir(id), 'assets', name), fs.constants.COPYFILE_EXCL);
      return name;
    },

    // Image bytes from the page (canvas output, line art) or from an AI service.
    async saveImageBytes(id, bytes) {
      await read(id);
      const buffer = Buffer.from(bytes);
      if (buffer.length > MAX_IMAGE_BYTES) throw new Error('Images must be 25 MB or smaller');
      const kind = sniffImage(buffer.subarray(0, 12));
      if (!kind) throw new Error('That is not a PNG, JPEG, WebP, or GIF image');
      return addAsset(id, buffer, kind);
    },

    async importAudio(id, source) {
      await read(id);
      const stat = await fs.stat(source);
      if (!stat.isFile()) throw new Error('Choose a sound file');
      if (stat.size > MAX_AUDIO_BYTES) throw new Error('Sound files must be 100 MB or smaller');
      const kind = sniffAudio(await readHead(source, 12));
      if (!kind) throw new Error('Use a WAV, MP3, M4A, OGG, or WebM sound file');
      const name = `${newId()}.${kind}`;
      await fs.mkdir(path.join(bookDir(id), 'assets'), { recursive: true });
      await fs.copyFile(source, assetPath(id, name), fs.constants.COPYFILE_EXCL);
      return name;
    },

    // Microphone recordings and AI speech arrive as bytes.
    async saveAudioBytes(id, bytes) {
      await read(id);
      const buffer = Buffer.from(bytes);
      if (buffer.length === 0) throw new Error('The recording is empty');
      if (buffer.length > MAX_AUDIO_BYTES) throw new Error('Sound files must be 100 MB or smaller');
      const kind = sniffAudio(buffer.subarray(0, 12));
      if (!kind) throw new Error('That sound is not WAV, MP3, M4A, OGG, or WebM');
      return addAsset(id, buffer, kind);
    },

    async readStoryText(source) {
      const stat = await fs.stat(source);
      if (!stat.isFile()) throw new Error('Choose a text file');
      if (stat.size > MAX_TEXT_BYTES) throw new Error('Story files must be 2 MB or smaller');
      return decodeStoryText(await fs.readFile(source));
    },

    // ----- bookshelves -----
    listShelves: loadShelves,
    async saveShelves(input) {
      const shelves = sanitizeShelves(input).map((s, order) => ({ ...s, order }));
      await fs.mkdir(root, { recursive: true });
      await writeJson(shelvesFile, shelves);
      return shelves;
    },

    // ----- reusable character library (images live in <root>/characters) -----
    listCharacters: loadCharacters,
    async saveCharacter(input, fromBookId) {
      const character = sanitizeCharacter(input);
      if (!character) throw new Error('Give the character a name');
      const all = await loadCharacters();
      const existing = all.find((c) => c.id === character.id);
      if (character.image && character.image !== existing?.image) {
        // The picture comes from a book; copy it into the library so it outlives the book.
        if (!fromBookId) throw new Error('Missing the book the picture belongs to');
        await fs.mkdir(libraryDir, { recursive: true });
        const name = `${newId()}.${path.extname(character.image).slice(1)}`;
        await fs.copyFile(assetPath(fromBookId, character.image), path.join(libraryDir, name), fs.constants.COPYFILE_EXCL);
        character.image = name;
      }
      const next = existing ? all.map((c) => (c.id === character.id ? character : c)) : [...all, character].slice(-MAX_CHARACTERS);
      await writeJson(charactersFile, next);
      return character;
    },
    async deleteCharacter(characterId) {
      const all = await loadCharacters();
      const gone = all.find((c) => c.id === characterId);
      if (!gone) return false;
      await writeJson(charactersFile, all.filter((c) => c.id !== characterId));
      if (gone.image) await fs.rm(path.join(libraryDir, gone.image), { force: true });
      return true;
    },
    // Copies a library character (and its picture) into a book; returns the book-side character.
    async insertCharacter(bookId, characterId) {
      await read(bookId);
      const found = (await loadCharacters()).find((c) => c.id === characterId);
      if (!found) throw new Error('That character is no longer in the library');
      let image = null;
      if (found.image) {
        image = `${newId()}.${path.extname(found.image).slice(1)}`;
        await fs.mkdir(path.join(bookDir(bookId), 'assets'), { recursive: true });
        await fs.copyFile(path.join(libraryDir, found.image), assetPath(bookId, image), fs.constants.COPYFILE_EXCL);
      }
      return { ...found, id: newId(), image };
    },

    // ----- profile -----
    async getProfile() { return sanitizeProfile(await readJson(profileFile, {})); },
    async saveProfile(input) {
      const profile = sanitizeProfile({ ...(await this.getProfile()), ...(input && typeof input === 'object' ? input : {}) });
      await fs.mkdir(root, { recursive: true });
      await writeJson(profileFile, profile);
      return profile;
    },

    async listImages(id) {
      await read(id);
      const dir = path.join(bookDir(id), 'assets');
      let names;
      try { names = await fs.readdir(dir); } catch { return []; }
      const images = [];
      for (const name of names.filter((n) => IMAGE.test(n))) {
        try { images.push({ name, time: (await fs.stat(path.join(dir, name))).mtimeMs }); } catch { /* removed meanwhile */ }
      }
      return images.sort((a, b) => b.time - a.time).map((image) => image.name);
    },

    async listAudio(id) {
      await read(id);
      const names = await fs.readdir(path.join(bookDir(id), 'assets')).catch(() => []);
      return names.filter((n) => AUDIO.test(n));
    },

    // Resolves a file for the app:// media protocol: a book asset, or a library character picture.
    mediaPath(id, name) {
      if (id === LIBRARY) {
        if (typeof name !== 'string' || !IMAGE.test(name)) throw new Error('Invalid image name');
        return path.join(libraryDir, name);
      }
      if (typeof name !== 'string' || !(IMAGE.test(name) || AUDIO.test(name))) throw new Error('Invalid image name');
      return assetPath(id, name);
    },
  };
}

module.exports = {
  createStore, sanitizeBook, sanitizePage, sanitizeElement, sanitizeCrop, sniffAudio, sniffImage, decodeStoryText,
  LIBRARY, READING_LEVELS, LENGTHS,
};
