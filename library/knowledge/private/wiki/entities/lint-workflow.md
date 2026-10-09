---
type: entity
title: "lint-workflow"
entity_type: ci-workflow
status: developing
created: 2026-10-08
updated: 2026-10-08
path: ".github/workflows/lint.yml"
language: yaml
last_commit_hash: "6a7c05c7ff9ea19d4f429f77bdfd0ca2c2dd2cf7"
depends_on: []
used_by: []
tested_by: []
related: ["[[entities/selftest-index-cjs]]", "[[entities/scripts-check-package-mjs]]"]
tags: [entity, ci-workflow]
sources:
  - .github/workflows/lint.yml
---

# lint-workflow

On pushes to main and pull requests, `jobs.eslint` runs lint on Ubuntu; `jobs.unit-tests`, `jobs.self-test` and `jobs.build` run on macos-14. All use Node 22 and npm ci. `jobs.self-test` runs the real Electron UI with local fake services and uploads verification screenshots on failure with seven-day retention. `jobs.build` packages the runner’s Apple Silicon app and runs `scripts/check-package.mjs`.

This page describes workflow configuration, not a passing CI result. Repository ruleset requirements are remote state and cannot be proven by this file. Source: `.github/workflows/lint.yml` / `on`, `jobs`.
