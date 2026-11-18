# Neum Institute

Monorepo for the Angular rebuild of the Neum music academy public site
(originally built with Astro + Preact in the `neum` repo).

## Apps

- `apps/web` — Angular (standalone, zoneless, SSR), public. Will render the
  academy's public pages (courses, team, Discord link, etc.) once the
  content modules are built out.

## Architecture

This repo follows the standards in [`docs/architecture`](docs/architecture)
— hexagonal architecture, DDD tactical patterns, CQRS at the application
layer, vertical slicing by feature. Read
[`docs/architecture/README.md`](docs/architecture/README.md) first, then
[`13-tech-angular-typescript.md`](docs/architecture/13-tech-angular-typescript.md)
for the concrete Angular adaptation used inside `apps/web`.

`docs/` doubles as an Obsidian vault — see [`docs/index.md`](docs/index.md).

## Content

Text content copied from the `neum` Preact site (translations, team roster,
page structure) lives in [`content/`](content/README.md). It's kept
separate from `docs/architecture/` because it's product copy, not
architecture reference material, and will be used to recreate the real
pages in a follow-up pass — this repo currently only has the boilerplate:
empty vertical-slice module folders, the shared error types, and the GSAP +
Lenis animation wiring ported from `neum`.

## Getting started

```bash
pnpm install
pnpm dev:web         # Angular dev server
```

```bash
pnpm build           # build all apps
pnpm test            # unit tests across the workspace (vitest)
pnpm arch-test        # dependency-cruiser layer boundary checks
pnpm typecheck        # tsc --noEmit across the workspace
```

## Content domain

Courses, team, methodology, contact, and about are scaffolded as empty
vertical slices under `apps/web/src/app/modules/` (domain/application/
infrastructure/presentation folders, no implementation yet) — they'll be
filled in once the content in `content/` is turned into real copy and
components.
