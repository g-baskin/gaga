'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { zip, unzip, crc32, buildEpub, collectImages } = require('../epub.cjs');

test('a picture that no longer exists is skipped and its references removed', async () => {
  const files = { 'here.png': Buffer.from('png') };
  const read = async (name) => {
    if (files[name]) return files[name];
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  };
  const out = await collectImages({
    pages: [{ label: 'One', body: '<p>Hi</p><img src="images/here.png" alt=""/><img class="x" src="images/gone-1.png" alt=""/>' }],
    css: '.a { background: url("images/gone-1.png"); } .b { background: url(images/here.png); }',
    read,
  });
  assert.deepEqual(out.images.map((i) => i.name), ['here.png']);
  assert.deepEqual(out.missing, ['gone-1.png']);
  assert.equal(out.pages[0].body, '<p>Hi</p><img src="images/here.png" alt=""/>');
  assert.equal(out.css, '.a { background: none; } .b { background: url(images/here.png); }');
  // Other read errors still stop the export.
  await assert.rejects(collectImages({ pages: [{ body: 'images/x.png' }], css: '', read: async () => { throw Object.assign(new Error('denied'), { code: 'EACCES' }); } }), /denied/);
});

test('crc32 matches the standard check value', () => {
  assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926);
});

test('zip round-trips files and stores mimetype first', () => {
  const out = zip([{ name: 'mimetype', data: 'application/epub+zip' }, { name: 'a/b.txt', data: Buffer.from('héllo') }]);
  assert.equal(out.subarray(30, 38).toString(), 'mimetype');
  assert.equal(out.subarray(38, 58).toString(), 'application/epub+zip');
  const files = unzip(out);
  assert.equal(files.get('a/b.txt').toString(), 'héllo');
  assert.equal(out.readUInt32LE(out.length - 22), 0x06054b50);
});

test('builds a fixed-layout EPUB with escaped metadata, pages, and images', () => {
  const epub = buildEpub({
    book: { id: 'abc', title: 'Fox & <Friends>', author: 'Sam', language: 'en', isbn: '978-3-16-148410-0', modified: new Date(0) },
    pages: [{ body: '<div class="page"><img src="images/x.png" alt=""/></div>', label: 'Cover' }, { body: '<p>Two</p>' }],
    css: '.page { color: red; }',
    width: 816, height: 816,
    images: [{ name: 'x.png', data: Buffer.from([1, 2, 3]) }],
  });
  const files = unzip(epub);
  assert.equal(files.get('mimetype').toString(), 'application/epub+zip');
  const opf = files.get('OEBPS/content.opf').toString();
  assert.match(opf, /<dc:title>Fox &amp; &lt;Friends&gt;<\/dc:title>/);
  assert.match(opf, /urn:isbn:9783161484100/);
  assert.match(opf, /rendition:layout">pre-paginated/);
  assert.match(opf, /properties="cover-image"/);
  assert.match(files.get('OEBPS/page-0002.xhtml').toString(), /<p>Two<\/p>/);
  assert.match(files.get('OEBPS/nav.xhtml').toString(), /Cover/);
  assert.deepEqual([...files.get('OEBPS/images/x.png')], [1, 2, 3]);
  assert.throws(() => buildEpub({ book: {}, pages: [], css: '', width: 1, height: 1 }), /no pages/);
});
