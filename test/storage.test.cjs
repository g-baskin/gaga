'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createStore } = require('../storage.cjs');

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082', 'hex');

async function setup() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'storyloom-unit-'));
  return { root, store: createStore(root) };
}

test('creates, saves, lists, and reads a book', async () => {
  const { store } = await setup();
  const book = await store.create({ title: 'The Brave Snail' });
  book.pages.push({ layout: 'image-top', text: 'Once upon a time.' });
  book.author = 'Sam';
  await store.save(book);
  const [summary] = await store.list();
  assert.equal(summary.title, 'The Brave Snail');
  assert.equal(summary.pageCount, 2);
  const loaded = await store.read(book.id);
  assert.equal(loaded.pages[1].text, 'Once upon a time.');
  assert.equal(loaded.author, 'Sam');
  assert.equal(loaded.createdAt, book.createdAt);
});

test('cleans invalid page values instead of storing them', async () => {
  const { store } = await setup();
  const book = await store.create({});
  book.pages = [{ layout: 'evil', image: '../../secret.png', background: 'red;x', fontSize: 5000 }];
  const saved = await store.save(book);
  assert.deepEqual(
    [saved.pages[0].layout, saved.pages[0].image, saved.pages[0].background, saved.pages[0].fontSize],
    ['image-top', null, '#ffffff', 96],
  );
});

test('rejects path traversal in book ids and image names', async () => {
  const { store } = await setup();
  await assert.rejects(store.read('../outside'), /Invalid book id/);
  await assert.rejects(store.save({ id: 'missing-book' }));
  const book = await store.create({});
  assert.throws(() => store.mediaPath(book.id, '../book.json'), /Invalid image name/);
  assert.throws(() => store.mediaPath('../x', 'a.png'), /Invalid book id/);
});

test('imports real images and refuses disguised files', async () => {
  const { root, store } = await setup();
  const book = await store.create({});
  const good = path.join(root, 'photo.png');
  const fake = path.join(root, 'fake.png');
  await fs.writeFile(good, PNG);
  await fs.writeFile(fake, '<svg onload="alert(1)"></svg>');
  const name = await store.importImage(book.id, good);
  assert.match(name, /^[a-z0-9-]+\.png$/);
  assert.deepEqual(await fs.readFile(store.mediaPath(book.id, name)), PNG);
  await assert.rejects(store.importImage(book.id, fake), /PNG, JPEG, WebP, or GIF/);
});

test('saves design elements and cleans unsafe ones', async () => {
  const { root, store } = await setup();
  const book = await store.create({});
  const good = path.join(root, 'photo.png');
  await fs.writeFile(good, PNG);
  const image = await store.importImage(book.id, good);
  book.pages[0].frame = 'double';
  book.pages[0].elements = [
    { type: 'text', text: 'Hello', x: 10, y: 20, w: 200, h: 50, rotation: 15, bold: true, fontSize: 9999 },
    { type: 'shape', shape: 'star', fill: '#ff0000', x: 1e9 },
    { type: 'sticker', char: '🦊' },
    { type: 'image', image },
    { type: 'image', image: '../../etc/passwd' },
    { type: 'sticker', char: '<img src=x>' },
    { type: 'script', text: 'x' },
    { type: 'shape', shape: 'evil', fill: 'url(javascript:1)' },
  ];
  const saved = (await store.save(book)).pages[0];
  assert.equal(saved.frame, 'double');
  assert.deepEqual(saved.elements.map((el) => el.type), ['text', 'shape', 'sticker', 'image', 'shape']);
  const [textEl, star, , , last] = saved.elements;
  assert.deepEqual([textEl.rotation, textEl.bold, textEl.fontSize], [15, true, 300]);
  assert.deepEqual([star.shape, star.fill, star.x], ['star', '#ff0000', 4000]);
  assert.deepEqual([last.shape, last.fill], ['rect', '#f2b84b']);
  assert.deepEqual(await store.listImages(book.id), [image]);
});

test('skips a corrupt book without hiding the others', async () => {
  const { root, store } = await setup();
  await store.create({ title: 'Fine' });
  const broken = await store.create({ title: 'Broken' });
  await fs.writeFile(path.join(root, 'books', broken.id, 'book.json'), '{not json');
  const titles = (await store.list()).map((book) => book.title);
  assert.deepEqual(titles, ['Fine']);
});

const WAV = Buffer.concat([Buffer.from('RIFF'), Buffer.from([36, 0, 0, 0]), Buffer.from('WAVEfmt '), Buffer.alloc(32)]);

test('keeps crops, sound elements, and book-level story data', async () => {
  const { root, store } = await setup();
  const book = await store.create({ title: 'Crops' });
  await fs.writeFile(path.join(root, 'p.png'), PNG);
  const image = await store.importImage(book.id, path.join(root, 'p.png'));
  const sound = await store.saveAudioBytes(book.id, WAV);
  assert.match(sound, /\.wav$/);
  book.pages[0].crop = { x: 0.1, y: 0.2, w: 0.5, h: 0.5 };
  book.pages[0].elements = [
    { type: 'image', image, crop: { x: 0.25, y: 0, w: 0.5, h: 1 } },
    { type: 'image', image, crop: { x: 0.9, y: 0, w: 0.5, h: 1 } },
    { type: 'sound', char: '🐸', label: 'Ribbit', sound },
    { type: 'sound', char: '<b>', sound: '../x.wav' },
  ];
  book.kind = 'coloring';
  book.isbn = '978-3-16-148410-0';
  book.builder = { genre: 'Adventure', writingStyle: ['Rhyming', 5, 'Funny'], readingLevel: 'nonsense', characters: [{ name: 'Pip', image }, { name: '' }] };
  book.manuscript = { chapters: [{ title: 'One', blocks: [{ type: 'h2', runs: [{ text: 'Hi', b: true, evil: 1 }] }, { type: 'script', runs: [{ text: '<x>' }] }] }] };
  book.audio = { narration: { [book.pages[0].id]: { file: sound, duration: 3.2 }, 'gone-page': { file: sound } }, music: { file: sound, volume: 7 } };
  const saved = await store.save(book);
  const [cropped, badCrop, frog, plain] = saved.pages[0].elements;
  assert.deepEqual(saved.pages[0].crop, { x: 0.1, y: 0.2, w: 0.5, h: 0.5 });
  assert.deepEqual(cropped.crop, { x: 0.25, y: 0, w: 0.5, h: 1 });
  assert.equal(badCrop.crop, null);
  assert.deepEqual([frog.char, frog.label, frog.sound], ['🐸', 'Ribbit', sound]);
  assert.deepEqual([plain.char, plain.sound], ['🔔', null]);
  assert.equal(saved.kind, 'coloring');
  assert.equal(saved.isbn, '978-3-16-148410-0');
  assert.deepEqual(saved.builder.writingStyle, ['Rhyming', 'Funny']);
  assert.equal(saved.builder.readingLevel, 'early-reader');
  assert.deepEqual(saved.builder.characters.map((c) => [c.name, c.image]), [['Pip', image]]);
  const [h2, para] = saved.manuscript.chapters[0].blocks;
  assert.deepEqual(h2, { type: 'h2', runs: [{ text: 'Hi', b: true }] });
  assert.deepEqual(para, { type: 'p', runs: [{ text: '<x>' }] });
  assert.deepEqual(Object.keys(saved.audio.narration), [saved.pages[0].id]);
  assert.equal(saved.audio.music.volume, 1);
  assert.equal((await store.save({ ...saved, isbn: '12345' })).isbn, '');
  assert.deepEqual(await store.listAudio(book.id), [sound]);
  assert.equal(store.mediaPath(book.id, sound), path.join(root, 'books', book.id, 'assets', sound));
});

test('imports only real sound and text files', async () => {
  const { root, store } = await setup();
  const book = await store.create({});
  await fs.writeFile(path.join(root, 'a.wav'), WAV);
  await fs.writeFile(path.join(root, 'fake.mp3'), 'not audio');
  assert.match(await store.importAudio(book.id, path.join(root, 'a.wav')), /\.wav$/);
  await assert.rejects(store.importAudio(book.id, path.join(root, 'fake.mp3')), /WAV, MP3/);
  await assert.rejects(store.saveAudioBytes(book.id, Buffer.from('<html>')), /not WAV/);
  await assert.rejects(store.saveImageBytes(book.id, Buffer.from('<svg/>')), /not a PNG/);
  assert.match(await store.saveImageBytes(book.id, PNG), /\.png$/);
  await fs.writeFile(path.join(root, 's.md'), '\ufeff# Title\r\nOnce upon a time.');
  assert.equal(await store.readStoryText(path.join(root, 's.md')), '# Title\nOnce upon a time.');
  await fs.writeFile(path.join(root, 'bin.txt'), Buffer.from([0x00, 0x01, 0xff]));
  await assert.rejects(store.readStoryText(path.join(root, 'bin.txt')));
});

test('duplicates a book with its pictures and keeps shelves tidy', async () => {
  const { root, store } = await setup();
  const book = await store.create({ title: 'Original' });
  await fs.writeFile(path.join(root, 'p.png'), PNG);
  const image = await store.importImage(book.id, path.join(root, 'p.png'));
  book.pages[0].image = image;
  await store.save(book);
  const copy = await store.duplicate(book.id);
  assert.notEqual(copy.id, book.id);
  assert.equal(copy.title, 'Original (copy)');
  assert.deepEqual(await fs.readFile(store.mediaPath(copy.id, image)), PNG);
  assert.equal((await store.rename(copy.id, 'Renamed')).title, 'Renamed');

  const shelves = await store.saveShelves([
    { name: 'Bedtime', bookIds: [book.id, copy.id, book.id, '../x'] },
    { name: '', bookIds: [] },
  ]);
  assert.deepEqual(shelves.map((s) => [s.name, s.bookIds.length]), [['Bedtime', 2], ['Untitled shelf', 0]]);
  await store.remove(copy.id, (dir) => fs.rm(dir, { recursive: true }));
  assert.deepEqual((await store.listShelves())[0].bookIds, [book.id]);
});

test('character library copies pictures in and out of books', async () => {
  const { root, store } = await setup();
  const book = await store.create({});
  const other = await store.create({});
  await fs.writeFile(path.join(root, 'p.png'), PNG);
  const image = await store.importImage(book.id, path.join(root, 'p.png'));
  const saved = await store.saveCharacter({ name: 'Mira', role: 'Hero', image }, book.id);
  assert.notEqual(saved.image, image);
  assert.deepEqual(await fs.readFile(store.mediaPath('_characters', saved.image)), PNG);
  await assert.rejects(store.saveCharacter({ name: '' }), /name/);
  const inserted = await store.insertCharacter(other.id, saved.id);
  assert.equal(inserted.name, 'Mira');
  assert.deepEqual(await fs.readFile(store.mediaPath(other.id, inserted.image)), PNG);
  assert.equal(await store.deleteCharacter(saved.id), true);
  assert.deepEqual(await store.listCharacters(), []);
  assert.throws(() => store.mediaPath('_characters', '../profile.json'), /Invalid/);
});

test('saves a profile with a default author name', async () => {
  const { store } = await setup();
  assert.equal((await store.getProfile()).authorName, '');
  await store.saveProfile({ authorName: 'Ada', bookOrder: ['a-1', '../x'] });
  assert.deepEqual(await store.getProfile(), { authorName: 'Ada', bookOrder: ['a-1'] });
});
