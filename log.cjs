'use strict';
// A small error log on this Mac only (Storyloom never sends it anywhere). It lives in the app's logs folder
// (~/Library/Logs/Storyloom), so someone reporting a problem can open it and choose what to share.
// Bounded: when storyloom.log passes MAX_BYTES it becomes storyloom.old.log (replacing the previous one).
// Plain Node, no Electron, so it can be tested on its own.
const fs = require('node:fs');
const path = require('node:path');

const MAX_BYTES = 1024 * 1024;
const MAX_ENTRY = 8000; // characters per entry, so one huge stack can't fill the log

function createLog(dir, { maxBytes = MAX_BYTES, now = () => new Date() } = {}) {
  const file = path.join(dir, 'storyloom.log');
  const old = path.join(dir, 'storyloom.old.log');

  // Synchronous on purpose: entries are rare, and a crash handler must finish writing before the app goes away.
  function write(level, message, detail) {
    try {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      const extra = detail ? `\n  ${String(detail).replace(/\n/g, '\n  ')}` : '';
      const entry = `${now().toISOString()} ${level.toUpperCase()} ${String(message)}${extra}`.slice(0, MAX_ENTRY);
      let size = 0;
      try { size = fs.statSync(file).size; } catch { /* no log yet */ }
      if (size + entry.length > maxBytes) fs.renameSync(file, old);
      fs.appendFileSync(file, `${entry}\n`, { mode: 0o600 });
    } catch { /* Logging must never be the thing that breaks Storyloom. */ }
  }

  // Turns anything thrown into one line plus its stack.
  function error(context, value) {
    const err = value instanceof Error ? value : null;
    const message = err ? `${err.name}: ${err.message}` : String(value);
    write('error', `${context}: ${message}`, err?.stack?.split('\n').slice(1).join('\n').trim());
  }

  return { dir, file, write, error, warn: (message, detail) => write('warn', message, detail) };
}

module.exports = { createLog, MAX_BYTES };
