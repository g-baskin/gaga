---
type: question
title: "Can concurrent settings writes collide on the same temp file?"
status: resolved
created: 2026-10-06
updated: 2026-10-06
question: "Can concurrent settings writes collide on the same temp file?"
answer_quality: verified
tags:
  - question
  - storyloom
related: []
sources: []
---

# Can concurrent settings writes collide on the same temp file?

**Question:** Can concurrent settings writes collide on the same temp file?

## Answer

Resolved on 2026-10-06. Yes, they could: `writePrivate` now adds a random suffix to each temp file and removes it if
the write fails, and `saveSettings` runs saves one at a time through a queue, so overlapping saves keep every change.
The self-test (`selftest/ai-services.cjs`, check `concurrentSaves`) fires three saves at once and confirms all three
are kept.

Original finding: `writePrivate` names its temp file `${file}.${process.pid}.tmp` (main.cjs:104), so two overlapping `settings:save` calls (or a settings write racing the ChatGPT record write to a different file is fine) share one temp path for the same target, unlike the store's random suffix (storage.cjs:316). Also `saveSettings` is read-modify-write without a lock, so concurrent saves can lose fields. Needs a human to confirm whether the renderer can issue overlapping saves.

## Confidence

Verified: fixed in code and covered by the self-test.
