'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { zip, unzip, crc32, buildEpub } = require('../epub.cjs');

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
