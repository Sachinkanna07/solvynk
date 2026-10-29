# Solvynk Phase P prototype

Solvynk is the approved configurable working name; trademark, domain, and logo clearance remain pending. This repository contains an interactive, fixture-only frontend for the dark developer-first design. See `README_START_HERE.md`, `docs/10_BACKLOG.md`, and `docs/STATUS.md` for governance and gates.

## What works

The static prototype has a homepage, Explore search and filters, problem and project detail pages, a BuildTree coverage demonstration, and a Studio with builder, owner, member, and staff demonstration panels. Its fictional fixtures illustrate claimed and owner-confirmed coverage. Navigation and local demonstration interactions work in the browser; the homepage now directs visitors to the Studio and Explore demos instead of simulating a waitlist registration. Local saved-state buttons are restored on refresh when browser storage is available. No real account, beta invitation, or publication is created.

## What is simulated

GitHub repository facts and badges are fixture data, not API verification. The outbound-link dialog is advisory and does not call Web Risk or enforce the server-side `/out/{linkId}` policy. The sample secret warning is a limited client-side regex demonstration, not a comprehensive scan or a publishing control. Staff moderation, switches, reviews, verification, and publishing are demonstrations only.

There is no production authentication, authorization, backend persistence, GitHub App connection, live URL screening, email delivery, image upload processing, or production security enforcement. Do not enter real secrets or personal data into the prototype. External image and Google Fonts requests may contact third-party origins; production browser-origin rules are not implemented here.

## Run and build

Use Node 24 and pnpm 11.7.0. From the repository root:

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build:prototype
pnpm verify:publication
```

`build:prototype` copies an explicit allowlist of 15 public HTML, CSS, JavaScript, and favicon assets into ignored `dist/`. `verify:publication` rejects extra files and checks byte identity. A static server may serve `dist/`; the five entry points are `index.html`, `explore.html`, `problem.html?slug=tamil-voice-recognition`, `project.html?slug=kuralvoice`, and `prototype.html`.

The tracked `vercel.json` configures the static build and publishes only `dist/`. A review-branch push produced a protected Vercel preview marked READY on 2026-10-29. This is deployment metadata, not browser-based verification or production approval. Do not promote a preview or replace the more advanced local V4 baseline without reconciliation and founder acceptance.

## Verification limits

JavaScript syntax, browser viewport checks, and axe-core route scans have been run for this prototype. Passing scans do not establish full WCAG 2.2 AA conformance. `pnpm test` currently runs the bootstrap verifier, not unit, integration, or production security suites. T-000 is in progress; T-001 and T-002 remain in review. M0, M1, and M2 are NOT PASSED.
