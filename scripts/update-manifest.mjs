// Signs the update archives in releases/dist and writes releases/dist/latest.json for the in-app updater.
//
//   STORYLOOM_UPDATE_SIGNING_KEY="$(cat key.pem)" node scripts/update-manifest.mjs 0.5.0
//
// The key is the Ed25519 private key (PKCS#8 PEM) whose public half is in updater.cjs (TRUSTED_KEYS).
// It is read from the environment only, never written to disk or printed. Every signature is checked
// against the built-in public keys before latest.json is written, so a wrong key fails the release
// instead of publishing updates that no copy of Storyloom would accept.
import { createPrivateKey, sign } from 'node:crypto';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256 } from './sha256.mjs';

const require = createRequire(import.meta.url);
const { PLATFORMS, RELEASES_PAGE, signedMessage, verifySignature, TRUSTED_KEYS } = require('../updater.cjs');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'releases', 'dist');
const version = process.argv[2];

async function main() {
  if (!/^\d+\.\d+\.\d+$/.test(version || '')) throw new Error('Usage: node scripts/update-manifest.mjs <version>');
  const { version: packaged } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  if (packaged !== version) throw new Error(`package.json says ${packaged}, but the release is ${version}`);
  const pem = process.env.STORYLOOM_UPDATE_SIGNING_KEY;
  if (!pem) throw new Error('STORYLOOM_UPDATE_SIGNING_KEY is not set, so the update can’t be signed');
  const key = createPrivateKey(pem);

  const platforms = {};
  for (const platform of Object.values(PLATFORMS)) {
    const file = platform.file(version);
    const full = path.join(outDir, file);
    const entry = { version, platform: platform.key, file, sha256: await sha256(full), size: (await stat(full)).size };
    entry.signature = sign(null, signedMessage(entry), key).toString('base64');
    if (!verifySignature(entry, TRUSTED_KEYS)) {
      throw new Error('The signing key doesn’t match the public key built into Storyloom (updater.cjs TRUSTED_KEYS)');
    }
    platforms[platform.key] = { file, sha256: entry.sha256, size: entry.size, signature: entry.signature };
  }

  const manifest = { version, pub_date: new Date().toISOString(), notes_url: `${RELEASES_PAGE}tag/v${version}`, platforms };
  await writeFile(path.join(outDir, 'latest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`latest.json written for ${version} (${Object.keys(platforms).join(', ')})`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
