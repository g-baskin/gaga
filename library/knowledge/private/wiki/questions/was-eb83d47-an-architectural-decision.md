---
type: question
title: "Was eb83d47 an architectural decision?"
status: answered
question: "Was eb83d47 an architectural decision?"
answer_quality: settled
created: 2026-10-07
updated: 2026-10-08
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

## Answer (2026-10-08)

Yes. It made three lasting decisions, now recorded as ADRs in `library/knowledge/private/architecture/`:

- [ADR-1](../../architecture/ADR-1-signed-self-update-from-github-releases.md): Storyloom updates itself from signed GitHub releases.
- [ADR-2](../../architecture/ADR-2-agpl-3-0-only-licence.md): Storyloom is licensed AGPL-3.0-only.
- [ADR-4](../../architecture/ADR-4-main-process-online-renderer-offline.md): only the main process goes online; the page never does (replacing "offline-only").

`3312b4e` (the replaced storybook look) is covered by [ADR-3](../../architecture/ADR-3-original-code-only.md) as an example of removing copied design, not as its own decision.
