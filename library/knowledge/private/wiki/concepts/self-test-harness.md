---
type: concept
title: "Self-test harness"
status: developing
created: 2026-10-06
updated: 2026-10-08
complexity: intermediate
domain: storyloom
tags: [concept, storyloom]
related: ["[[entities/selftest-index-cjs]]", "[[entities/lint-workflow]]"]
sources: ["selftest/index.cjs", ".github/workflows/lint.yml", "package.json"]
---

# Self-test harness

`npm run self-test` invokes Electron with --self-test. `selftest/index.cjs` / `run` chooses FULL_ORDER unless --only limits the modules, creates disposable app data and drives actual mouse/keyboard events. The renderer is checked for console errors, missing screens and navigation failures. Each module must return a nonempty checks object without false entries and write a fresh screenshot; these are acceptance rules in code, not results of this scan.

`FULL_ORDER` covers home, bookshelf, story-builder, manuscript, templates, designer, text-fit, studio, coloring, export-orders-account, ai-services, illustrate, updates, boundaries and logging. Fake-service implementation pages and individual module pages are listed in the scan coverage report; no live provider credentials were used.

`.github/workflows/lint.yml` / `jobs.self-test` runs this on macos-14 with Node 22 and uploads verification screenshots on failure. The release job runs lint and unit tests separately; it does not itself invoke this harness. A manual packaged-app check is different from this source-tree self-test.

See [[entities/selftest-index-cjs]], [[entities/lint-workflow]], [[entities/useTestServices]].
