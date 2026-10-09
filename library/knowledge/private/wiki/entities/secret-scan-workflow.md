---
type: entity
title: "secret-scan-workflow"
entity_type: ci-workflow
status: developing
created: 2026-10-08
updated: 2026-10-08
path: ".github/workflows/secret-scan.yml"
language: yaml
last_commit_hash: "7d459e2d1140ffc4d9f2ab44379827342ea99b24"
depends_on: []
used_by: []
tested_by: []
related: []
tags: [entity, ci-workflow]
sources:
  - .github/workflows/secret-scan.yml
---

# secret-scan-workflow

The `gitleaks` job runs on pushes to main and pull requests, with read-only contents permission. It fetches full history with checkout credential persistence disabled, downloads gitleaks 8.30.1, verifies the configured SHA-256, then scans every commit with `--redact --log-opts="--all"`.

This is a description of the workflow, not evidence that the current history is free of secrets. Source: `.github/workflows/secret-scan.yml` / `jobs.gitleaks`.
