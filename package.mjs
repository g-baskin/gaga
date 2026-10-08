// Builds an unsigned Storyloom.app under releases/ (for this Mac by default).
// `buildApp` is also used by dist.mjs to build the Intel and Apple Silicon versions.
import { FuseState, FuseV1Options, FuseVersion, flipFuses, getCurrentFuseWire } from '@electron/fuses';
import { packager } from '@electron/packager';
import { realpathSync } from 'node:fs';
import { access, copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = path.dirname(fileURLToPath(import.meta.url));
const keep = new Set(['', '/package.json', '/main.cjs', '/preload.cjs', '/storage.cjs', '/epub.cjs', '/updater.cjs', '/log.cjs', '/LICENSE']);

// Electron's MIT licence and Chromium's third-party notices must travel with every copy of the app. The packager
// writes them next to Storyloom.app, but only the .app goes into the disk image and the update zip, so copy them in.
export const RUNTIME_NOTICES = [
  ['LICENSE', 'LICENSE.electron.txt'],
  ['LICENSES.chromium.html', 'LICENSES.chromium.html'],
];

export async function checkRuntimeNotices(appPath) {
  for (const [, name] of RUNTIME_NOTICES) await access(path.join(appPath, 'Contents', 'Resources', name));
}

// Electron switches baked into the app. Off: running the app as plain Node (ELECTRON_RUN_AS_NODE), NODE_OPTIONS,
// and --inspect, any of which would let another program on this Mac run code as Storyloom and unseal its keys.
// On: the app only loads from its checked app.asar, and cookies are encrypted.
// Inside renderer/ for the browser preview (npm run preview), but never part of the app.
export const DEV_ONLY = new Set(['/renderer/preview-boot.js']);

export const FUSES = {
  [FuseV1Options.RunAsNode]: false,
  [FuseV1Options.EnableCookieEncryption]: true,
  [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
  [FuseV1Options.EnableNodeCliInspectArguments]: false,
  [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
  [FuseV1Options.OnlyLoadAppFromAsar]: true,
  [FuseV1Options.GrantFileProtocolExtraPrivileges]: false,
};

export async function lockFuses(appPath, arch) {
  // Flipping edits the Electron binary; Apple Silicon needs a fresh ad-hoc signature to run it (dist re-signs later too).
  await flipFuses(appPath, { version: FuseVersion.V1, resetAdHocDarwinSignature: arch === 'arm64', ...FUSES });
  const wire = await getCurrentFuseWire(appPath);
  for (const [option, on] of Object.entries(FUSES)) {
    if (wire[option] !== (on ? FuseState.ENABLE : FuseState.DISABLE)) throw new Error(`Electron fuse ${FuseV1Options[option]} didn't switch ${on ? 'on' : 'off'}`);
  }
}

export async function readManifest() {
  return JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
}

export async function buildApp({ arch = process.arch, out = path.join(root, 'releases'), quiet = false } = {}) {
  const manifest = await readManifest();
  const outputs = await packager({
    dir: root,
    out,
    name: 'Storyloom',
    appBundleId: 'local.storyloom.app',
    appVersion: manifest.version,
    electronVersion: manifest.devDependencies.electron,
    platform: 'darwin',
    arch,
    asar: true,
    prune: false,
    overwrite: true,
    quiet,
    // Ship only the app itself: no tests, build tools, verification output, or the browser preview's stand-in data.
    ignore: (file) => DEV_ONLY.has(file) || !(keep.has(file) || ['/renderer', '/ai', '/main'].some((dir) => file === dir || file.startsWith(`${dir}/`))),
  });
  for (const output of outputs) {
    const resources = path.join(output, 'Storyloom.app', 'Contents', 'Resources');
    for (const [from, to] of RUNTIME_NOTICES) await copyFile(path.join(output, from), path.join(resources, to));
    await checkRuntimeNotices(path.join(output, 'Storyloom.app'));
    await lockFuses(path.join(output, 'Storyloom.app'), arch);
  }
  return outputs;
}

// Run only when started directly (compares real paths, so a symlinked folder still builds).
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const outputs = await buildApp();
  console.log(`Built: ${outputs.join('\n')}`);
}
