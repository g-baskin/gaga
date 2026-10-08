'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createLog } = require('../log.cjs');

test('the error log writes readable entries with stacks, and stays private to this user', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'storyloom-log-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const log = createLog(path.join(dir, 'logs'), { now: () => new Date('2026-10-08T12:00:00Z') });
  log.error('Saving a book', new Error('Disk is full'));
  log.warn('Book abc couldn’t be read');
  log.error('Odd value', 'just a string');
  const text = await fs.readFile(log.file, 'utf8');
  assert.match(text, /^2026-10-08T12:00:00.000Z ERROR Saving a book: Error: Disk is full\n {2}at /m);
  assert.match(text, /WARN Book abc couldn’t be read/);
  assert.match(text, /ERROR Odd value: just a string/);
  assert.equal((await fs.stat(log.file)).mode & 0o777, 0o600);
});

test('the error log is bounded: one older file is kept, never more', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'storyloom-log-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const log = createLog(dir, { maxBytes: 2000 });
  for (let i = 0; i < 200; i++) log.write('error', `entry ${i} ${'x'.repeat(50)}`);
  const names = (await fs.readdir(dir)).sort();
  assert.deepEqual(names, ['storyloom.log', 'storyloom.old.log']);
  for (const name of names) assert.ok((await fs.stat(path.join(dir, name))).size <= 2000);
  assert.match(await fs.readFile(log.file, 'utf8'), /entry 199 /);
});

test('logging never throws, even when the folder can’t be written', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'storyloom-log-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const blocked = path.join(dir, 'a-file');
  await fs.writeFile(blocked, '');
  const log = createLog(path.join(blocked, 'logs')); // a folder inside a file can't exist
  assert.doesNotThrow(() => log.error('Anything', new Error('boom')));
});
