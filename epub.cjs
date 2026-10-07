'use strict';
// Dependency-free EPUB 3 writer: a store-only (uncompressed) ZIP plus fixed-layout EPUB packaging.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// DOS date/time for a fixed timestamp keeps output reproducible.
const DOS_TIME = 0;
const DOS_DATE = (1 << 5) | 1; // 1980-01-01

// entries: [{ name, data: Buffer|string }]. Stored without compression, which EPUB allows for every file.
function zip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(0, 8); // stored
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);
    offset += 30 + name.length + data.length;
  }
  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, end]);
}

// Reads a store-only zip back (used by tests and the self-test to inspect EPUB output).
function unzip(buffer) {
  const files = new Map();
  let at = 0;
  while (at + 30 <= buffer.length && buffer.readUInt32LE(at) === 0x04034b50) {
    const size = buffer.readUInt32LE(at + 18);
    const nameLength = buffer.readUInt16LE(at + 26);
    const extra = buffer.readUInt16LE(at + 28);
    const name = buffer.subarray(at + 30, at + 30 + nameLength).toString('utf8');
    const start = at + 30 + nameLength + extra;
    const data = buffer.subarray(start, start + size);
    if (crc32(data) !== buffer.readUInt32LE(at + 14)) throw new Error(`Bad checksum for ${name}`);
    files.set(name, data);
    at = start + size;
  }
  return files;
}

const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const MIME = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };

/**
 * Builds a fixed-layout EPUB 3.
 * book: { id, title, author, language (BCP 47 code), isbn, modified (Date) }
 * pages: [{ body: XHTML fragment string, label }]   width/height: viewport in CSS px
 * css: stylesheet text   images: [{ name, data }] referenced from pages as images/<name>
 */
function buildEpub({ book, pages, css, width, height, images = [] }) {
  if (!Array.isArray(pages) || pages.length === 0) throw new Error('The book has no pages');
  const identifier = book.isbn ? `urn:isbn:${book.isbn.replace(/[\s-]/g, '')}` : `urn:uuid:${book.id}`;
  const modified = (book.modified || new Date()).toISOString().replace(/\.\d+Z$/, 'Z');
  const pageName = (i) => `page-${String(i + 1).padStart(4, '0')}.xhtml`;
  const coverImage = images[0]?.name;

  const pageFiles = pages.map((page, i) => ({
    name: `OEBPS/${pageName(i)}`,
    data: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${esc(book.language)}" xml:lang="${esc(book.language)}">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=${width}, height=${height}"/><title>${esc(page.label || `Page ${i + 1}`)}</title><link rel="stylesheet" type="text/css" href="book.css"/></head>
<body class="epub-page">${page.body}</body>
</html>`,
  }));

  const nav = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${esc(book.language)}" xml:lang="${esc(book.language)}">
<head><meta charset="UTF-8"/><title>${esc(book.title)}</title></head>
<body><nav epub:type="toc" id="toc"><h1>Contents</h1><ol>
${pages.map((page, i) => `<li><a href="${pageName(i)}">${esc(page.label || `Page ${i + 1}`)}</a></li>`).join('\n')}
</ol></nav>
<nav epub:type="page-list" hidden="hidden"><ol>
${pages.map((_p, i) => `<li><a href="${pageName(i)}">${i + 1}</a></li>`).join('\n')}
</ol></nav></body>
</html>`;

  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${esc(book.language)}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="book-id">${esc(identifier)}</dc:identifier>
<dc:title>${esc(book.title)}</dc:title>
${book.author ? `<dc:creator>${esc(book.author)}</dc:creator>` : ''}
<dc:language>${esc(book.language)}</dc:language>
<meta property="dcterms:modified">${modified}</meta>
<meta property="rendition:layout">pre-paginated</meta>
<meta property="rendition:spread">none</meta>
${coverImage ? '<meta name="cover" content="cover-image"/>' : ''}
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="css" href="book.css" media-type="text/css"/>
${images.map((img, i) => `<item id="${i === 0 ? 'cover-image' : `img-${i}`}" href="images/${esc(img.name)}" media-type="${MIME[img.name.split('.').pop()]}"${i === 0 ? ' properties="cover-image"' : ''}/>`).join('\n')}
${pages.map((_p, i) => `<item id="p${i + 1}" href="${pageName(i)}" media-type="application/xhtml+xml"/>`).join('\n')}
</manifest>
<spine>
${pages.map((_p, i) => `<itemref idref="p${i + 1}"/>`).join('\n')}
</spine>
</package>`;

  return zip([
    { name: 'mimetype', data: 'application/epub+zip' }, // Must be first and uncompressed.
    {
      name: 'META-INF/container.xml',
      data: '<?xml version="1.0" encoding="UTF-8"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>',
    },
    { name: 'OEBPS/content.opf', data: opf },
    { name: 'OEBPS/nav.xhtml', data: nav },
    { name: 'OEBPS/book.css', data: `@page { margin: 0; }\nhtml, body { margin: 0; padding: 0; width: ${width}px; height: ${height}px; overflow: hidden; }\n${css}` },
    ...images.map((img) => ({ name: `OEBPS/images/${img.name}`, data: img.data })),
    ...pageFiles,
  ]);
}

module.exports = { zip, unzip, crc32, buildEpub };
