// Serves the Storyloom screens in a browser.
// Electron's index.html is left alone. This server adds preview-boot.js
// only to the copy it sends, so the desktop app still talks to preload.cjs.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const renderer = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../renderer');
const port = Number(process.env.PORT) || 4173;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
};

function fileFor(urlPath) {
  let rel;
  try {
    rel = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null; // a malformed address like /%E0
  }
  const name = rel === '/' ? 'index.html' : rel.replace(/^\/+/, '');
  const file = path.resolve(renderer, name);
  if (file !== renderer && !file.startsWith(renderer + path.sep)) return null;
  return file;
}

const server = http.createServer((req, res) => {
  const file = fileFor(req.url || '/');
  if (!file) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }
  fs.readFile(file, (error, body) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(file);
    let payload = body;
    if (path.basename(file) === 'index.html') {
      payload = Buffer.from(body.toString('utf8').replace(
        '<script src="core.js" defer></script>',
        '<script src="preview-boot.js" defer></script>\n  <script src="core.js" defer></script>',
      ));
    }
    res.writeHead(200, {
      'Content-Type': types[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(payload);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Storyloom preview: http://127.0.0.1:${port}`);
});
