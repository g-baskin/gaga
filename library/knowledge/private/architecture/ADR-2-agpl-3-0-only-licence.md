---
status: accepted
date: 2026-10-07
recorded: 2026-10-08
---

# ADR-2: Storyloom is licensed AGPL-3.0-only

## Context and problem statement

Storyloom's source is public on GitHub. Without a licence, nobody may legally use, change, or share it. The licence also decides whether someone can take the code, change it, and offer it to others without sharing their changes.

## Considered options

1. **A permissive licence** (MIT, Apache-2.0): anyone may reuse it, including in closed products.
2. **GPL-3.0**: shared changed copies must stay open.
3. **AGPL-3.0-only**: like GPL, but also covers changed versions people use over a network.

## Decision outcome

Option 3, added in commit `eb83d47` (`LICENSE`, `package.json` `"license": "AGPL-3.0-only"`). The README explains it in plain words: anyone may use, change, and share Storyloom, but sharing a changed version, or letting people use one over a network, means sharing its source under the same licence. "Only" (not "or later") keeps the project on this exact version unless it chooses otherwise.

The commit doesn't record why this licence was chosen over the others. What it secures is that improvements stay open, including in a hosted version.

## Consequences

- The licence text ships inside the app, along with Electron's and Chromium's notices (`package.mjs`).
- Bundled fonts must use licences that can be combined with this one; the tests allow only OFL-1.1 and Apache-2.0.
- Changing the licence later needs agreement from everyone who contributed code, so this is hard to reverse once others contribute.
- Copying code into Storyloom from an incompatible or proprietary source isn't allowed (see ADR-3).
