'use strict';
// "Is there a newer Storyloom?" — reads the latest GitHub release and compares it with the running version.
// Sends nothing about the user or their books: one anonymous request for public release information.
// Answers are cached for six hours; any failure (offline, private repo, rate limit) just means "no notice".

const REPO = 'g-baskin/gaga';
const RELEASES_PAGE = `https://github.com/${REPO}/releases/`;
const CACHE_MS = 6 * 60 * 60 * 1000;
const MAX_BYTES = 1_000_000;
const SEMVER = /^v?(\d+)\.(\d+)\.(\d+)$/;

// True when `latest` (like "v0.4.0") is a newer plain release than `current` (like "0.3.0").
function isNewer(latest, current) {
  const a = SEMVER.exec(String(latest || '').trim());
  const b = SEMVER.exec(String(current || '').trim());
  if (!a || !b) return false;
  for (let i = 1; i <= 3; i++) {
    if (Number(a[i]) !== Number(b[i])) return Number(a[i]) > Number(b[i]);
  }
  return false;
}

// Keeps only what the notice needs, and only a link to this project's own releases page.
function readRelease(data, releasesPage = RELEASES_PAGE) {
  if (!data || typeof data !== 'object' || data.draft || data.prerelease) return null;
  const match = SEMVER.exec(typeof data.tag_name === 'string' ? data.tag_name.trim() : '');
  if (!match) return null;
  const url = typeof data.html_url === 'string' && data.html_url.startsWith(releasesPage) ? data.html_url : `${releasesPage}tag/${data.tag_name.trim()}`;
  return { version: `${match[1]}.${match[2]}.${match[3]}`, url };
}

function createUpdateChecker({ currentVersion, apiUrl = `https://api.github.com/repos/${REPO}/releases/latest`, releasesPage = RELEASES_PAGE }) {
  let cached = null; // { at, result }

  async function check({ force = false } = {}) {
    if (!force && cached && Date.now() - cached.at < CACHE_MS) return cached.result;
    let result = { available: false, current: currentVersion };
    try {
      const response = await fetch(apiUrl, {
        redirect: 'error',
        signal: AbortSignal.timeout(10000),
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': `Storyloom/${currentVersion}`, 'X-GitHub-Api-Version': '2022-11-28' },
      });
      if (response.ok && Number(response.headers.get('content-length') || 0) <= MAX_BYTES) {
        const text = await response.text();
        const release = text.length <= MAX_BYTES ? readRelease(JSON.parse(text), releasesPage) : null;
        if (release && isNewer(release.version, currentVersion)) {
          result = { available: true, current: currentVersion, latest: release.version, url: release.url };
        }
      }
    } catch {
      // Offline, blocked, or an unexpected answer: show nothing rather than an error.
    }
    cached = { at: Date.now(), result };
    return result;
  }

  return { check };
}

module.exports = { createUpdateChecker, isNewer, readRelease, RELEASES_PAGE };
