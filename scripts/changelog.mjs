// Keeps CHANGELOG.md, package.json, and GitHub releases in step.
//
//   node scripts/changelog.mjs release 0.2.0   → moves "Unreleased" into a dated 0.2.0 section and sets the app version
//   node scripts/changelog.mjs check 0.2.0     → fails unless package.json is 0.2.0 and the changelog has a 0.2.0 section
//   node scripts/changelog.mjs notes 0.2.0     → prints the GitHub release notes for 0.2.0 (used by the release workflow)
import { execFile } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHANGELOG = path.join(root, 'CHANGELOG.md');
const REPO = 'https://github.com/g-baskin/gaga';
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const heading = (version) => new RegExp(`^## \\[${escape(version)}\\](?: - \\d{4}-\\d{2}-\\d{2})?[ \\t]*$`, 'm');

// The text of one "## [x]" section, without its heading.
export function section(text, version) {
  const match = heading(version).exec(text);
  if (!match) return null;
  const start = match.index + match[0].length;
  const next = text.slice(start).search(/^## \[|^\[[^\]]+\]: /m);
  return text.slice(start, next === -1 ? undefined : start + next).trim();
}

// True when a section lists at least one change (a line starting with "- ").
const hasEntries = (body) => /^- \S/m.test(body || '');

function compare(a, b) {
  const [x, y] = [SEMVER.exec(a), SEMVER.exec(b)];
  for (let i = 1; i <= 3; i++) if (Number(x[i]) !== Number(y[i])) return Number(x[i]) - Number(y[i]);
  return 0;
}

export function release(text, version, { current, date }) {
  if (!SEMVER.test(version)) throw new Error(`"${version}" is not a version like 1.2.3`);
  if (compare(version, current) < 0) throw new Error(`${version} is older than the current version ${current}`);
  if (section(text, version) !== null) throw new Error(`The changelog already has a ${version} section`);
  const unreleased = section(text, 'Unreleased');
  if (!hasEntries(unreleased)) throw new Error('Nothing is listed under "Unreleased" yet, so there is nothing to release');

  const previous = /^## \[(\d+\.\d+\.\d+)\]/m.exec(text)?.[1];
  let out = text.replace(heading('Unreleased'), `## [Unreleased]\n\n## [${version}] - ${date}`);
  // Links at the bottom: Unreleased compares from this version; this version compares from the last one.
  out = out.replace(/^\[Unreleased\]: .*$/m, `[Unreleased]: ${REPO}/compare/v${version}...HEAD\n[${version}]: ${
    previous ? `${REPO}/compare/v${previous}...v${version}` : `${REPO}/releases/tag/v${version}`}`);
  return out;
}

export function notes(text, version) {
  const body = section(text, version);
  if (!hasEntries(body)) throw new Error(`The changelog has no entries for ${version}`);
  return `${body}

### Download

- **Intel Macs**: \`Storyloom_${version}_Intel_x64.dmg\`
- **Apple Silicon Macs** (M1 and newer, 2020 onward): \`Storyloom_${version}_Apple-Silicon_arm64.dmg\`

Not sure which you have? Apple menu → About This Mac: "Chip: Apple M…" means Apple Silicon; "Processor: … Intel" means Intel.

Open the .dmg and drag Storyloom into Applications. Storyloom isn't notarized by Apple yet, so the first time you open it
macOS will block it: go to System Settings → Privacy & Security and click **Open Anyway**.

Already have Storyloom? Open **Account → Updates** and click **Download update**. The \`.app.zip\` files and
\`latest.json\` are for that in-app updater; you don't need to download them yourself.
`;
}

async function main([command, version]) {
  const text = await readFile(CHANGELOG, 'utf8');
  const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  if (!command || !version) throw new Error('Usage: node scripts/changelog.mjs <release|check|notes> <version>');
  if (command === 'notes') {
    process.stdout.write(notes(text, version));
  } else if (command === 'check') {
    if (manifest.version !== version) throw new Error(`package.json says ${manifest.version}, but the release is ${version}`);
    notes(text, version);
    console.log(`Version ${version} is ready to release.`);
  } else if (command === 'release') {
    const date = new Date().toISOString().slice(0, 10);
    const updated = release(text, version, { current: manifest.version, date });
    if (manifest.version !== version) {
      // Updates package.json and package-lock.json together.
      await promisify(execFile)('npm', ['version', version, '--no-git-tag-version'], { cwd: root });
    }
    await writeFile(CHANGELOG, updated);
    console.log(`CHANGELOG.md and package.json now say ${version}. Commit, then push the tag v${version} to publish.`);
  } else {
    throw new Error(`Unknown command "${command}"`);
  }
}

// Run only when started directly. Compares real paths: a symlinked folder (macOS /var → /private/var) would otherwise
// make the command silently do nothing.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
