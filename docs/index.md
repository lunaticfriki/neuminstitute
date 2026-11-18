---
tags: [neuminstitute, architecture, moc]
---

# Neum Institute — Docs

This `docs/` folder doubles as an Obsidian vault: open it directly as a
vault ("Open folder as vault") to get backlinks, the graph view, and search
across every architecture and content note. Markdown links below are plain
relative links so they also work on GitHub; Obsidian resolves them the same
way.

## Architecture

- [[architecture/README|Architecture standards]] — start here. Hexagonal
  architecture, DDD tactical patterns, CQRS, vertical slicing.
- [[architecture/13-tech-angular-typescript|Angular + TypeScript adaptation]]
  — the concrete mapping used by `apps/web` in this repo.
- [[architecture/glossary|Glossary]] — terms used across every doc here.

## Content

- [[../content/README|Content folder]] — the text content copied from the
  `neum` Preact site (`ca`/`es`/`en`), kept outside `docs/` since it's
  product content, not architecture reference material. It will be used to
  recreate the real pages once instructed.

## Why this split

`docs/architecture/` is meant to be copied as-is into any new project (see
its own README) — it's a reusable standard, not something specific to Neum
Institute. `content/` is specific to this project: the actual words that
will eventually appear on the site. Keeping them in separate top-level
folders means the architecture folder can be lifted into a different repo
without dragging Neum-specific copy along with it.
