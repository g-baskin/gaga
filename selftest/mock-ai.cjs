'use strict';
// A tiny local OpenAI-compatible server so every AI path runs in the self-test without a real key.
const http = require('node:http');
const zlib = require('node:zlib');
const { crc32 } = require('../epub.cjs');

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'latin1');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

// A 256×256 RGB PNG: a filled circle (colour) or just its outline (line art), on a plain background.
function makePng({ lineArt = false } = {}) {
  const size = 256;
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - 128, y - 128);
      let rgb;
      if (lineArt) rgb = Math.abs(d - 80) < 4 || Math.abs(x - 128) < 3 && d < 80 ? [0, 0, 0] : [255, 255, 255];
      else rgb = d < 80 ? [240, 140, 60] : y > 190 ? [90, 160, 90] : [150, 200, 240];
      row.set(rgb, 1 + x * 3);
    }
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; header[9] = 2; // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0)),
  ]);
}

// One second of a soft 440 Hz tone, 16-bit mono WAV.
function makeWav(seconds = 1, rate = 16000) {
  const samples = Math.round(seconds * rate);
  const out = Buffer.alloc(44 + samples * 2);
  out.write('RIFF', 0, 'latin1'); out.writeUInt32LE(36 + samples * 2, 4); out.write('WAVE', 8, 'latin1');
  out.write('fmt ', 12, 'latin1'); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
  out.writeUInt32LE(rate, 24); out.writeUInt32LE(rate * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36, 'latin1'); out.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) out.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 6000), 44 + i * 2);
  return out;
}

function start() {
  const calls = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (d) => { raw += d; if (raw.length > 5_000_000) req.destroy(); });
    req.on('end', () => {
      let body = {};
      try { body = JSON.parse(raw || '{}'); } catch { /* keep empty */ }
      calls.push({ path: req.url, body });
      const json = (data) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
      if (req.method === 'POST' && req.url === '/chat/completions') {
        const system = body.messages?.[0]?.content || '';
        const user = body.messages?.[1]?.content || '';
        let content;
        if (/one chapter/.test(system)) {
          content = JSON.stringify({ text: 'The moon hummed a quiet song.\n\nEveryone in the meadow listened.' });
        } else {
          const count = Math.min(30, Number(/Number of pages: (\d+)/.exec(user)?.[1]) || 4);
          const star = /Characters: ([^—;\n]+)/.exec(user)?.[1]?.trim() || 'Pip';
          content = `Here you go:\n${JSON.stringify({
            title: 'The Moon That Hummed',
            chapters: Array.from({ length: count }, (_v, i) => ({ title: `Part ${i + 1}`, text: `${star} took step number ${i + 1} toward the humming moon.` })),
          })}`;
        }
        return json({ choices: [{ message: { role: 'assistant', content } }] });
      }
      if (req.method === 'POST' && req.url === '/images/generations') {
        return json({ data: [{ b64_json: makePng({ lineArt: /line art/i.test(body.prompt || '') }).toString('base64') }] });
      }
      if (req.method === 'POST' && req.url === '/audio/speech') {
        res.writeHead(200, { 'Content-Type': 'audio/wav' });
        return res.end(makeWav());
      }
      res.writeHead(404);
      res.end();
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ url: `http://127.0.0.1:${server.address().port}`, calls, close: () => server.close() });
    });
  });
}

module.exports = { start, makePng, makeWav };
