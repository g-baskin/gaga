'use strict';
const fsSync = require('node:fs');
const path = require('node:path');
const { createUpdater, UpdateError, installTarget, startInstall, INSTALL_WAIT_TENTHS } = require('../updater.cjs');

function createUpdates({ app, selfTest, testUrls, readSettings, getWindow }) {
  // In-app updates (see updater.cjs). One state, shared with the screen through 'app:update-state' messages:
  // idle | checking | up-to-date | available | downloading | ready | installing | failed.
  // The self-test never contacts GitHub: it uses a local fake, or nothing.
  let updater = null;
  let pendingUpdate = null; // the verified result of the last check, needed to download it
  let readyUpdate = null; // { appPath, workdir, version } once downloaded and verified
  let updateState = { phase: 'idle' };
  function setUpdateState(next) {
    updateState = { ...next, current: app.getVersion() };
    getWindow()?.webContents.send('app:update-state', updateState);
    return updateState;
  }
  const friendly = (error, fallback) => (error instanceof UpdateError ? error.message : fallback);
  // Deletes a downloaded update that won't be installed (its folder is always one we created in the temp folder).
  function discardReadyUpdate() {
    const dir = readyUpdate?.workdir;
    readyUpdate = null;
    if (dir && path.basename(dir).startsWith('storyloom-update-')) {
      try { fsSync.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
    }
  }
  function getUpdater() {
    updater ||= createUpdater({
      currentVersion: app.getVersion(),
      ...(selfTest && testUrls.STORYLOOM_TEST_UPDATES ? {
        feedUrl: `${testUrls.STORYLOOM_TEST_UPDATES}/latest.json`,
        downloadBase: `${testUrls.STORYLOOM_TEST_UPDATES}/download/`,
        allowHost: (host) => host === '127.0.0.1',
        ...(testUrls.STORYLOOM_TEST_UPDATE_KEY ? { trustedKeys: [testUrls.STORYLOOM_TEST_UPDATE_KEY] } : {}),
      } : {}),
    });
    return updater;
  }
  async function checkForUpdate({ manual = false } = {}) {
    if (['checking', 'downloading', 'installing'].includes(updateState.phase)) return updateState;
    if (updateState.phase === 'ready') return updateState;
    if (!manual && !(await readSettings()).checkUpdates) return setUpdateState({ phase: 'idle', disabled: true });
    if (selfTest && !testUrls.STORYLOOM_TEST_UPDATES) return setUpdateState({ phase: 'idle' });
    setUpdateState({ phase: 'checking' });
    try {
      const result = await getUpdater().check();
      if (result.status !== 'available') {
        pendingUpdate = null;
        return setUpdateState({ phase: 'up-to-date', checkedAt: Date.now() });
      }
      pendingUpdate = result;
      return setUpdateState({ phase: 'available', version: result.version, notesUrl: result.notesUrl });
    } catch (error) {
      pendingUpdate = null;
      // A background check that fails says nothing; a check the user asked for explains why.
      return setUpdateState(manual ? { phase: 'failed', message: friendly(error, 'Could not check for updates') } : { phase: 'idle' });
    }
  }
  async function downloadUpdate() {
    if (updateState.phase !== 'available' || !pendingUpdate) throw new Error('There is no update to download');
    const update = pendingUpdate;
    setUpdateState({ phase: 'downloading', version: update.version, percent: 0 });
    try {
      readyUpdate = await getUpdater().download(update, {
        onProgress: (percent) => setUpdateState({ phase: 'downloading', version: update.version, percent }),
      });
      return setUpdateState({ phase: 'ready', version: update.version });
    } catch (error) {
      return setUpdateState({ phase: 'failed', message: friendly(error, 'The update couldn’t be downloaded'), version: update.version });
    }
  }
  async function installUpdate() {
    if (updateState.phase !== 'ready' || !readyUpdate) throw new Error('No update is ready to install');
    const ready = readyUpdate;
    // The self-test can't replace the running Electron, so it checks everything up to the swap and stops there.
    if (selfTest) {
      setUpdateState({ phase: 'installing', version: ready.version });
      return { ...updateState, staged: ready.appPath };
    }
    const where = await installTarget(process.execPath);
    if (!where.ok) return setUpdateState({ phase: 'failed', message: where.reason, version: ready.version });
    setUpdateState({ phase: 'installing', version: ready.version });
    try {
      startInstall({ pid: process.pid, target: where.target, staged: ready });
    } catch (error) {
      return setUpdateState({ phase: 'failed', message: friendly(error, 'The update couldn’t be installed'), version: ready.version });
    }
    // Quit through the normal close path, so open books save first. The helper swaps the app and reopens it.
    setTimeout(() => app.quit(), 200);
    // If Storyloom is somehow still open after the installer stopped waiting, nothing was replaced:
    // say so (instead of "Installing…" forever) and drop the download, which the installer has deleted.
    const giveUp = setTimeout(() => {
      discardReadyUpdate();
      setUpdateState({ phase: 'failed', message: 'Storyloom didn’t close, so the update wasn’t installed. Click Check for updates to try again.', version: ready.version });
    }, INSTALL_WAIT_TENTHS * 100 + 10000);
    giveUp.unref?.();
    return updateState;
  }

  // Self-test only (useTestServices): forget the updater and any found or downloaded update.
  function reset() {
    updater = null; pendingUpdate = null;
    discardReadyUpdate();
    setUpdateState({ phase: 'idle' }); // also tells the screen, so its buttons match
  }

  return { state: () => updateState, checkForUpdate, downloadUpdate, installUpdate, discardReadyUpdate, reset };
}

module.exports = { createUpdates };
