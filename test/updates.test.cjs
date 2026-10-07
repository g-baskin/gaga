'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createUpdateChecker, isNewer, readRelease } = require('../updates.cjs');

const PAGE = 'https://github.com/g-baskin/gaga/releases/';

test('isNewer compares plain release versions number by number', () => {
  assert.equal(isNewer('v0.4.0', '0.3.0'), true);
  assert.equal(isNewer('0.10.0', '0.9.9'), true); // 10 > 9, not text order
  assert.equal(isNewer('v1.0.0', '0.99.99'), true);
  assert.equal(isNewer('v0.3.0', '0.3.0'), false);
  assert.equal(isNewer('v0.2.9', '0.3.0'), false);
  assert.equal(isNewer('v0.4.0-beta.1', '0.3.0'), false); // not a plain release
  assert.equal(isNewer('nonsense', '0.3.0'), false);
});

test('readRelease keeps only real releases and only links to this project', () => {
  assert.deepEqual(readRelease({ tag_name: 'v0.4.0', html_url: `${PAGE}tag/v0.4.0` }), { version: '0.4.0', url: `${PAGE}tag/v0.4.0` });
  // A link anywhere else is replaced with this project's own release page.
  assert.deepEqual(readRelease({ tag_name: 'v0.4.0', html_url: 'https://evil.example/download' }), { version: '0.4.0', url: `${PAGE}tag/v0.4.0` });
  assert.equal(readRelease({ tag_name: 'v0.4.0', draft: true }), null);
  assert.equal(readRelease({ tag_name: 'v0.4.0', prerelease: true }), null);
  assert.equal(readRelease({ tag_name: 'latest' }), null);
  assert.equal(readRelease(null), null);
});

async function fakeGitHub(t, answer) {
  let requests = 0;
  const server = http.createServer((req, res) => {
    requests++;
    const { status = 200, body } = answer();
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  return { url: `http://127.0.0.1:${server.address().port}/repos/g-baskin/gaga/releases/latest`, count: () => requests };
}

test('reports a newer release, caches the answer, and re-checks when forced', async (t) => {
  let tag = 'v0.4.0';
  const gh = await fakeGitHub(t, () => ({ body: { tag_name: tag, html_url: `${PAGE}tag/${tag}` } }));
  const checker = createUpdateChecker({ currentVersion: '0.3.0', apiUrl: gh.url });
  assert.deepEqual(await checker.check(), { available: true, current: '0.3.0', latest: '0.4.0', url: `${PAGE}tag/v0.4.0` });
  await checker.check();
  assert.equal(gh.count(), 1, 'second check uses the cached answer');
  tag = 'v0.3.0';
  assert.deepEqual(await checker.check({ force: true }), { available: false, current: '0.3.0' });
  assert.equal(gh.count(), 2);
});

test('a private repo, an error, or an unreadable answer means no notice', async (t) => {
  const missing = await fakeGitHub(t, () => ({ status: 404, body: { message: 'Not Found' } }));
  assert.equal((await createUpdateChecker({ currentVersion: '0.3.0', apiUrl: missing.url }).check()).available, false);
  const broken = await fakeGitHub(t, () => ({ body: { tag_name: 42 } }));
  assert.equal((await createUpdateChecker({ currentVersion: '0.3.0', apiUrl: broken.url }).check()).available, false);
  // Nothing listening at all (offline).
  assert.equal((await createUpdateChecker({ currentVersion: '0.3.0', apiUrl: 'http://127.0.0.1:9/nothing' }).check()).available, false);
});
