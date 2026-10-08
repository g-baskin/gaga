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
  assert.match(text, /\*\*Intel Macs\*\*: `Storyloom_0\.1\.0_Intel_x64\.dmg`/);
  assert.match(text, /\*\*Apple Silicon Macs\*\*.*`Storyloom_0\.1\.0_Apple-Silicon_arm64\.dmg`/);
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

// The command-line entry the release workflow runs (check, notes) and `npm run release` uses, run for real on a copy
// of the script in a temporary folder, so it reads that folder's package.json and CHANGELOG.md.
test('the changelog command checks, prints notes, and releases a version', async (t) => {
  const os = require('node:os');
  const { execFile } = require('node:child_process');
  const run = (dir, args) => new Promise((resolve) => {
    execFile(process.execPath, [path.join(dir, 'scripts', 'changelog.mjs'), ...args], { cwd: dir }, (error, stdout, stderr) => {
      resolve({ code: error ? error.code : 0, stdout, stderr });
    });
  });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'storyloom-changelog-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'scripts'));
  fs.copyFileSync(path.join(__dirname, '..', 'scripts', 'changelog.mjs'), path.join(dir, 'scripts', 'changelog.mjs'));
  fs.writeFileSync(path.join(dir, 'package.json'), `${JSON.stringify({ name: 'changelog-cli-test', version: '0.1.0', private: true }, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, 'CHANGELOG.md'), SAMPLE);

  const ok = await run(dir, ['check', '0.1.0']);
  assert.equal(ok.code, 0, ok.stderr);
  assert.match(ok.stdout, /Version 0\.1\.0 is ready to release\./);

  const mismatch = await run(dir, ['check', '0.2.0']);
  assert.equal(mismatch.code, 1);
  assert.match(mismatch.stderr, /package\.json says 0\.1\.0, but the release is 0\.2\.0/);

  const printed = await run(dir, ['notes', '0.1.0']);
  assert.equal(printed.code, 0, printed.stderr);
  assert.match(printed.stdout, /^### Added\n\n- First thing\./);

  const usage = await run(dir, ['check']);
  assert.equal(usage.code, 1);
  assert.match(usage.stderr, /Usage: node scripts\/changelog\.mjs/);
  assert.equal((await run(dir, ['publish', '0.1.0'])).code, 1);

  const released = await run(dir, ['release', '0.2.0']);
  assert.equal(released.code, 0, released.stderr);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version, '0.2.0');
  const changelog = fs.readFileSync(path.join(dir, 'CHANGELOG.md'), 'utf8');
  assert.match(changelog, /^## \[0\.2\.0\] - \d{4}-\d{2}-\d{2}\n\n### Added\n\n- New thing\./m);
  assert.equal((await run(dir, ['check', '0.2.0'])).code, 0);
});
