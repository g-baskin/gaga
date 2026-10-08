---
ai_description: |
  This folder contains internal engineering and business documentation.
  ADRs MUST live in architecture/ADR-<n>-<kebab-slug>.md.
  Engineering standards MUST live in standards/documentation-framework.md.
  Other domain folders (<domain>/) are repo-specific and may be created as
  needed. In this repo: architecture/, data/, release/, security/, standards/,
  and wiki/ (one page per module, concept, and IPC channel).
  Do NOT file customer-facing content here (that goes in knowledge/public/).
  Write path: library/knowledge/private/<domain>/<kebab-slug>.md.
human_description: |
  Internal engineering and business documentation.
  - architecture/: Architecture Decision Records (ADRs)
  - standards/: Documentation framework and coding standards
  - data/, release/, security/: Storyloom's storage, release, and security notes
  - wiki/: one page per module, concept, and IPC channel
  Default landing zone for any doc that does not need to be customer-facing.
  When creating a new domain folder, add a README.md explaining what belongs.
---

# Knowledge - Private

Internal documentation for engineers, product, and AI agents.

## Required sub-folders (always present)

| Folder | Contents |
|---|---|
| `architecture/` | ADRs: `ADR-<n>-<kebab-slug>.md`. Locked decisions with context, alternatives, consequences. |
| `standards/` | `documentation-framework.md` and any repo-specific writing rules. |

## Optional domain folders

This repo has `data/`, `release/`, `security/`, and `wiki/`. Add another domain folder only when a topic outgrows these, with a `README.md` explaining what belongs.

## What does NOT belong here

- Customer-facing content (put in `knowledge/public/`)
- PRDs or IRDs (put in `requirements/` or `issues/`)
- Binary asset