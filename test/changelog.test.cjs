'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const load = () => import('../scripts/changelog.mjs');

const SAMPLE = `# Changelog

Intro.

## [Unreleased]

### Added

- New thing.

## [0.1.0] - 2026-10-01

### Added

- First thing.

[Unreleased]: https://github.com/g-baskin/gaga/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/g-baskin/gaga/releases/tag/v0.1.0
`;

test('release moves Unreleased into a dated version section and updates the links', async () => {
  const { release, section } = await load();
  const out = release(SAMPLE, '0.2.0', { current: '0.1.0', date: '2026-10-07' });
  assert.match(out, /## \[Unreleased\]\n\n## \[0\.2\.0\] - 2026-10-07\n\n### Added\n\n- New thing\./);
  assert.equal(section(out, 'Unreleased'), '');
  assert.equal(section(out, '0.2.0'), '### Added\n\n- New thing.');
  assert.equal(section(out, '0.1.0'), '### Added\n\n- First thing.');
  assert.match(out, /^\[Unreleased\]: https:\/\/github\.com\/g-baskin\/gaga\/compare\/v0\.2\.0\.\.\.HEAD$/m);
  assert.match(out, /^\[0\.2\.0\]: https:\/\/github\.com\/g-baskin\/gaga\/compare\/v0\.1\.0\.\.\.v0\.2\.0$/m);
});

test('release refuses bad, older, repeated, or empty releases', async () => {
  const { release } = await load();
  assert.throws(() => release(SAMPLE, 'v0.2', { current: '0.1.0', date: 'x' }), /not a version/);
  assert.throws(() => release(SAMPLE, '0.0.9', { current: '0.1.0', date: 'x' }), /older/);
  assert.throws(() => release(SAMPLE, '0.1.0', { current: '0.1.0', date: 'x' }), /already has/);
  const empty = SAMPLE.replace('- New thing.\n', '');
  assert.throws(() => release(empty, '0.2.0', { current: '0.1.0', date: 'x' }), /Nothing is listed/);
});

test('first release from a changelog with no versions yet', async () => {
  const { release, notes } = await load();
  const first = '# Changelog\n\n## [Unreleased]\n\n### Fixed\n\n- A bug.\n\n[Unreleased]: https://github.com/g-baskin/gaga/commits/main\n';
  const out = release(first, '0.1.0', { current: '0.1.0', date: '2026-10-07' });
  assert.match(out, /^\[0\.1\.0\]: https:\/\/github\.com\/g-baskin\/gaga\/releases\/tag\/v0\.1\.0$/m);
  const text = notes(out, '0.1.0');
  assert.match(text, /^### Fixed\n\n- A bug\./);
  assert.match(text, /Storyloom_0\.1\.0_aarch64\.dmg/);
  assert.match(text, /Storyloom_0\.1\.0_x64\.dmg/);
  assert.throws(() => notes(out, '9.9.9'), /no entries/);
});

test('the real CHANGELOG.md is well formed: an Unreleased section, and notes for every released version', async () => {
  const { section, notes } = await load();
  const text = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8');
  assert.notEqual(section(text, 'Unreleased'), null);
  for (const [, version] of text.matchAll(/^## \[(\d+\.\d+\.\d+)\] - \d{4}-\d{2}-\d{2}$/gm)) {
    assert.doesNotThrow(() => notes(text, version), `version ${version} has no entries`);
    assert.match(text, new RegExp(`^\\[${version.replace(/\./g, '\\.')}\\]: https://`, 'm'), `version ${version} has no link`);
  }
});
