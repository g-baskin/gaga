'use strict';
// New-version notice, against a local stand-in for GitHub's "latest release" answer.
const http = require('node:http');

module.exports = async function updates(ctx) {
  const { js, pause } = ctx;
  const checks = {};
  let release = { tag_name: 'v9.9.9', html_url: 'https://github.com/g-baskin/gaga/releases/tag/v9.9.9' };
  let requests = 0;
  const server = http.createServer((req, res) => {
    requests++;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(release));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const until = async (expr, ms = 5000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { if (await js(expr)) return true; await pause(50); }
    return false;
  };

  try {
    // By default the self-test never contacts GitHub, so no notice shows.
    await ctx.navigate('home');
    await js('checkUpdateNow(true)');
    checks.offlineByDefault = (await js(`!document.getElementById('app-update')`)) && requests === 0;

    ctx.useTestServices({ STORYLOOM_TEST_UPDATES: `http://127.0.0.1:${server.address().port}/repos/g-baskin/gaga/releases/latest` });
    await js('checkUpdateNow(true)');
    checks.noticeShown = await until(`/Version 9\\.9\\.9 is available/.test(document.getElementById('app-update')?.textContent || '')`);
    await ctx.screenshot('updates');
    // "Download it" opens only the release page the app itself checked.
    checks.opensCheckedPage = (await js('api.openUpdate()')) === 'https://github.com/g-baskin/gaga/releases/tag/v9.9.9';
    // The notice stays as you move between screens, without asking GitHub again.
    const before = requests;
    await ctx.click('[data-nav="bookshelf"]');
    checks.noticeOnOtherScreens = (await until(`!!document.getElementById('app-update')`)) && requests === before;

    // Switching it off in Account hides the notice and stops asking.
    await ctx.navigate('account');
    await ctx.waitFor('#account-check-updates');
    await ctx.click('#account-check-updates');
    checks.switchOffSaved = await until(`api.getSettings().then((s) => s.checkUpdates === false)`);
    checks.noticeHiddenWhenOff = await until(`!document.getElementById('app-update')`);
    const whileOff = requests;
    await js('checkUpdateNow(true)');
    checks.noRequestsWhenOff = requests === whileOff;
    // With the check off, "Download it" can't reopen the earlier link.
    checks.noStaleLinkWhenOff = await js(`api.openUpdate().then(() => false, () => true)`);
    await ctx.click('#account-check-updates');
    checks.switchOnShowsNotice = await until(`!!document.getElementById('app-update')`);

    // When GitHub's latest release is this version, there's nothing to show.
    const { version } = await js('api.appInfo()');
    release = { tag_name: `v${version}`, html_url: `https://github.com/g-baskin/gaga/releases/tag/v${version}` };
    await js('checkUpdateNow(true)');
    checks.upToDateNoNotice = await until(`!document.getElementById('app-update')`);
  } finally {
    ctx.useTestServices({ STORYLOOM_TEST_UPDATES: undefined });
    await js(`api.saveSettings({ checkUpdates: true }).then(() => checkUpdateNow(true))`).catch(() => {});
    server.close();
  }
  return checks;
};
