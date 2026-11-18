---
tags: [neuminstitute, content]
---

# Content

Text content copied verbatim from the `neum` repo (the Preact/Astro site
this project rebuilds in Angular), so it's available here without needing
the other repo checked out. Nothing in this folder is wired into the
Angular app yet — `apps/web/src/app/modules/*` are still empty vertical
slices. This is reference material for a later pass that turns it into
real i18n data and page content.

## Layout

- `raw/` — the original TypeScript source files, copied byte-for-byte from
  `neum/apps/web/src/shared/i18n/domain/translations/` and
  `neum/apps/web/src/shared/config/campus.ts`. Exact programmatic source of
  truth if the text needs to be copy-pasted back into code.
- `en.md`, `es.md`, `ca.md` — the same translation keys as `raw/`, one file
  per locale, grouped by section and rendered as readable Markdown for
  browsing/editing in Obsidian.
- `team.md` — team roster and alumni institutions (not translated — these
  are proper nouns, same across all three locales).
- `page-structure.md` — the order sections appear in on the page, and the
  one external link (Discord campus) the site has.

## Source

Copied from `neum` at the commit current when this repo was created
(2026-11-18). Locale codes: `ca` (Catalan, primary), `es` (Spanish), `en`
(English).
