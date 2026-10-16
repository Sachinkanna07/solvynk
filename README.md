# BuildSocial prototype

Dependency-free frontend prototype for connecting real problems with credible builders. The current visual system uses warm paper, dark ink, gold, mint, lilac, cream, Manrope, DM Mono, editorial spacing, and fixture-only content.

## Run locally

    python -m http.server 4173

Open `http://localhost:4173/index.html`.

## Routes

- `/index.html` — homepage and private-beta CTA
- `/explore.html` — searchable and filterable problems and projects
- `/problem.html?slug=clean-water-testing` — problem detail and requirements
- `/project.html?slug=clearflow` — project detail, coverage, updates, share, and save
- `/prototype.html` — owner, builder, and member workspace flows

## Fixture architecture

`app.js` contains the shared problem/project fixtures used by the public prototype pages. `fixtures.js` contains the catalog layer for categories, users, solutions, and updates used by the workspace. UI behavior lives in page-specific scripts and uses local browser state only.

## Complete screens

Homepage, Explore, problem detail, project detail, owner create-problem flow, builder create-project flow, member-space empty states, local draft feedback, local save behavior, share feedback, search, filters, and responsive detail layouts.

## Intentionally simulated

There is no authentication, authorization, GitHub integration, moderation, database persistence, server-side URL validation, upload security, audit logging, or security monitoring. No personal data is transmitted. Publishing, following, notifications, profiles, and project coverage are presentation-only states.

## Verification

    node --check app.js
    node --check explore.js
    node --check fixtures.js
    node --check prototype.js

The recovered specification files and M0/M1/M2 gate values remain unchanged.
