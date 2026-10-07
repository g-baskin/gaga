---
type: question
title: "Is the PDF export `mode` meant to change output in main?"
status: developing
created: 2026-10-06
updated: 2026-10-06
question: "Is the PDF export `mode` meant to change output in main?"
answer_quality: draft
tags:
  - question
  - storyloom
related: []
sources: []
---

# Is the PDF export `mode` meant to change output in main?

**Question:** Is the PDF export `mode` meant to change output in main?

## Answer

Unanswered. `books:export-pdf` computes `mode` but only uses it to rename the self-test output file (main.cjs:525); print vs digital differences must come entirely from renderer CSS. Confirm this is intended.

## Confidence

Draft — raised by wiki-worker-bee scan on 2026-10-06.
