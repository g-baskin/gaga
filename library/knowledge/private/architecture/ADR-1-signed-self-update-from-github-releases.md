---
status: accepted
date: 2026-10-07
recorded: 2026-10-08
---

# ADR-1: Storyloom updates itself from signed GitHub releases

## Context and problem statement

Storyloom is a Mac app that people download as a `.dmg`. Without an updater, fixes only reach people who come back to the releases page. The builds are ad-hoc signed, not signed with an Apple Developer ID or notarized. There is no Storyloom server.

## Considered options

1. **No updater**: people download new versions themselves.
2. **Electron's built-in autoUpdater** (Squirrel.Mac), which requires a properly code-signed app.
3. **Our own updater** reading a signed manifest from GitHub releases, with Storyloom's own Ed25519 key.

## Decision outcome

Option 3, shipped in v0.5.0 (commit `eb83d47`; details in PRD-011). Each release publishes `latest.json`, signed with Storyloom's release key and binding version, chip, file name, SHA-256, and size. The app trusts only the public keys built into `TRUSTED_KEYS` in `updater.cjs`. It also checks the unpacked app's bundle id (`local.storyloom.app`), version, chip, and code signature before swapping it in.

Option 1 left people on old, possibly broken versions. Option 2 depends on code signing the project doesn't do (builds are ad-hoc signed). The commit doesn't record a fuller rationale.

## Consequences

- The private key is the most sensitive secret in the project. It lives only in the `STORYLOOM_UPDATE_SIGNING_KEY` GitHub Actions secret and with the maintainer. Anyone holding it can push code to every installed copy.
- Rotating the key takes two releases: first ship one that adds the new public key, and only later drop the old one. Removing it too early leaves installed apps unable to update.
- The bundle id can never change; the updater refuses any other.
- Pushing a `v*` tag publishes a signed release, so the repository's tag and branch permissions are part of this security boundary.
- Storyloom makes one network request on launch (if update checks are on) that sends no data about the person or their books.
