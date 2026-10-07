---
type: question
title: "Was eb83d47 an architectural decision?"
status: developing
question: "Was eb83d47 an architectural decision?"
answer_quality: draft
created: 2026-10-07
updated: 2026-10-07
commit_sha: "eb83d47"
tags:
  - question
  - adr-candidate
related:
  - "[[concepts/signed-update-channel]]"
  - "[[concepts/release-pipeline]]"
sources:
  - "commit eb83d47"
---

# Was eb83d47 an architectural decision?

Commit `eb83d47` (AutomationGod, 2026-10-07): "Add signed in-app updates, AGPL license, README, and remove offline-only wording". No body.

The code clearly introduces lasting choices (Ed25519-signed GitHub update feed, [[concepts/signed-update-channel]]; AGPL `LICENSE` packed into the app by [[entities/package-mjs]]; dropping the offline-only positioning). But the message has no Tier-1 marker (no switch/replace/adopt verb, no `Decision:`/`Rationale:` body), and single-line commits are filtered, so no ADR was filed.

**Question for a human:** should this be recorded as up to three ADRs (signed self-update over GitHub; AGPL licensing; app is no longer offline-only)? If yes, state the rationale and they can be filed in `decisions/`.

Related one-line commit `3312b4e` "Replace the copied storybook look with Storyloom's own picture-book design" matches the "replace X with Y" pattern but is a visual-design change with no body; also not filed.
