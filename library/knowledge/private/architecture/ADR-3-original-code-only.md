---
status: accepted
date: 2026-10-06
recorded: 2026-10-08
---

# ADR-3: Storyloom is original work; Scrively is a reference only

## Context and problem statement

Storyloom was built to match the features of Scrively, a proprietary picture-book app. Its installer and files unpacked from it are kept next to the repository (in the parent `scrively/` folder) for study. Copying its code, artwork, text, or design into an open-source (AGPL, see ADR-2) project would break its copyright and taint Storyloom's licence.

## Considered options

1. **Port or adapt Scrively's code and assets** to reach feature parity quickly.
2. **Write everything new**, using Scrively only to understand what features exist and how they behave.

## Decision outcome

Option 2, from the first commit (`a5dac04`, "offline picture-book maker with Scrively feature parity"). Storyloom's code, design, and wording are its own. The study material stays outside the repository and is ignored by git (`scrively/.gitignore` and the parent folder's `.gitignore`). When an early design turned out to copy Scrively's look, it was replaced with Storyloom's own picture-book design (commit `3312b4e`).

## Consequences

- Nothing from `scrively/study/`, `scrively/desktop-study/`, or the Scrively `.dmg` may be copied into this repository: not code, artwork, icons, fonts, or text.
- Matching a feature means building it from scratch, which is slower than porting.
- Bundled fonts and other assets must come from openly licensed sources with their licence files (checked by the font tests).
- If anyone finds copied material, remove it and replace it with original work, as was done in `3312b4e`.
