---
type: concept
title: "Self-test harness"
status: developing
created: 2026-10-06
updated: 2026-10-06
complexity: intermediate
domain: "storyloom"
tags:
  - concept
  - storyloom
related:
  - "[[entities/flag-self-test]]"
  - "[[entities/useTestServices]]"
sources: []
---

# Self-test harness

`electron . --self-test` drives the real UI end-to-end with mock services and temp data; unit tests run with `node --test test/*.test.cjs` (`package.json`). Hooks: [[entities/flag-self-test]], [[entities/flag-keep-data]], [[entities/useTestServices]], [[entities/window-__storyloom]].

## Entities

- [[entities/flag-self-test]]
- [[entities/useTestServices]]
