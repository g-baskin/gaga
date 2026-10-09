---
ai_description: |
  Development commands, test-layer boundaries, CI jobs and package invariants for Storyloom.
human_description: |
  How to run and check the app without confusing preview, simulated tests and released builds.
---

# Development and verification

Run commands at the Storyloom repository root. `package.json` specifies Node >=22 and Electron 44.7.0 at source baseline `6a7c05c`. Runtime code is plain CommonJS/main plus ordered vanilla renderer scripts, with no runtime npm dependencies or bundler. This page documents available checks, not results from running them.

## Commands and evidence

| Command | What it establishes when actually run |
|---|---|
| `npm start` | Starts the development Electron app against ordinary local data |
| `npm run preview` | Browser visual preview at `127.0.0.1:4173` (`PORT` override); mock books stay in the tab, not real storage |
| `npm run lint` | ESLint rules from `eslint.config.mjs`, including shared renderer globals |
| `npm test` | Node test runner over `test/*.test.cjs`; no paid provider requests |
| `npm run self-test` | Real Electron screen/input/IPC tests with temporary data, fake microphone/keychain and local services |
| `npm run self-test -- --only=home,designer` | Only those modules; not evidence of a full suite pass |
| `npm run test:live` | Opt-in OpenRouter live checks; may spend credit, not run in CI |
| `npm run package` | Builds this Mac's chip; `package.mjs` applies package filters, checks runtime notice files exist, and sets and reads back fuses |
| `node scripts/check-package.mjs releases/Storyloom-darwin-<arch>/Storyloom.app` | Checks reachable literal local `require()` modules, renderer index scripts/styles and absence of `DEV_ONLY` files; not fuses, notices or the complete shipping allow-list |
| `node scripts/fetch-fonts.mjs --check` | Offline verification of generated font files |

Preview (`scripts/preview.mjs`, `renderer/preview-boot.js`) is not proof that IPC, encryption, recording or export works in Electron. The live script reads `OPENROUTER_TEST_API` from the environment or optional `.env.local` locations; never print or commit these files.

## Self-test contract

`selftest/index.cjs` defines `FULL_ORDER`: Designer, Home, Bookshelf, Story builder, Manuscript, Templates, Studio, Coloring, export/orders/account, AI services, updates, text fit, illustration, boundaries and logging. A new module must be added there, return a nonempty checks object with no false values, and save its own fresh screenshot through `ctx.screenshot()`. Page `console.error` is a failure; user-visible handled errors use `logError(error, { shown: true })` or a warning instead.

`--keep-data` retains temporary data. `--load=screens/<name>.js` injects an allowed script not yet listed in `index.html`. Full-run screenshots go under gitignored `verification/`; partial runs use a module/PID subdirectory. Update self-tests stop at verified staging and do not replace the running Electron app. Fakes establish local behavior, not real-provider compatibility or a manual packaged-app acceptance check.

## CI and branch protection

`.github/workflows/lint.yml` runs `eslint` on Ubuntu and `unit-tests`, `self-test`, and `build` on macOS for main pushes and pull requests. The build job packages Apple Silicon and runs `check-package.mjs`. A failing self-test uploads `verification/` screenshots with seven-day retention. `.github/workflows/secret-scan.yml` supplies `gitleaks`; workflows use pinned action revisions and read-only permissions except the release publishing job.

Verified remote-state snapshot, 2026-10-08: a direct GitHub API query of main ruleset **24756163** confirmed required checks `self-test`, `eslint`, `unit-tests`, `build` and `gitleaks` from GitHub App **15368**, with administrator bypass unchanged. This records the verification performed for this documentation update; the query was not repeated while editing this page. Workflow YAML does not itself prove remote ruleset settings, nor does required-check configuration prove a particular run passed.

## Packaging constraints

`package.mjs` ships top-level files only through `keep`, plus `renderer/`, `ai/` and `main/`; it excludes `node_modules` and `DEV_ONLY` (including preview bootstrap). New top-level runtime modules must enter `keep`. New renderer dev-only files must enter `DEV_ONLY`. `scripts/check-package.mjs` follows reachable literal single-quoted relative `require('./…')` and `require('../…')` references from `main.cjs` and `preload.cjs`, excluding self-tests. It also checks scripts/styles referenced by `renderer/index.html` and rejects shipped `DEV_ONLY` files. It does not validate the complete shipping allow-list, fuses or runtime notices; dynamic or differently formatted dependencies need explicit care.

`FUSES` disables RunAsNode, Node options and CLI inspector access, and enables ASAR integrity/ASAR-only loading and cookie encryption. `package.mjs` calls `lockFuses()` to set these values and read them back for verification. Packaged-app debugging therefore differs from `npm start`. `package.mjs` also copies Electron/Chromium license notices inside the app and calls `checkRuntimeNotices()` to check those files exist. Fonts are generated from `scripts/fetch-fonts.mjs`; never rename persisted font keys or hand-edit generated manifests.

`npm run dist` builds both chips unless `--arch=arm64|x64` selects one, and clears its `releases/dist/` output first. See [Release process](../release/release-process.md) before producing distributables. No package build, application test or live call was run for this documentation refresh.
