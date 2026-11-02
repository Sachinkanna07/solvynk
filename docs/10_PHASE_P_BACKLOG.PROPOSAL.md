# Solvynk Phase P Backlog — Recovery Proposal

Status: PROPOSAL ONLY — NOT AUTHORITATIVE
Version: 0.1
Date: 2026-10-16

This document is a proposed replacement for the missing authoritative docs/10_BACKLOG.md. It must not be used to pass a gate, authorize implementation, or mark a task complete until the founder approves it and records the decision in docs/02_DECISIONS.md.

## Authority and boundaries

The source-of-truth order remains:

1. docs/06_SECURITY_INVARIANTS.md
2. docs/02_DECISIONS.md
3. docs/04_DATA_MODEL.md, docs/05_API_AND_ROUTES.md, and the missing docs/07_GITHUB_APP.md
4. docs/01_PRODUCT_SPEC.md
5. The missing authoritative UI, test, operations, content, and human-task documents
6. Proposal documents, including this file, docs/08_UI_SPEC.PROPOSAL.md, docs/10_BACKLOG.PROPOSAL.md, and docs/RECOVERY_PROPOSAL.md

Nothing in this proposal overrides an authoritative document. Where the recovered pack is incomplete, the task is gated on founder approval or records the uncertainty.

M0, M1, and M2 remain NOT PASSED. T-000, T-001, and T-002 are not complete based solely on prototype reports. This proposal authorizes no deployment, cloud resource, merge, push, or spend.

## Recovered gaps requiring founder approval

Missing historical materials:

- docs/07_GITHUB_APP.md
- authoritative docs/08_UI_SPEC.md
- docs/09_TEST_PLAN.md
- docs/10_BACKLOG.md
- docs/11_CODEX_PROMPTS.md
- docs/12_OPERATIONS.md
- docs/13_VALIDATION_KIT.md
- docs/14_CONTENT_AND_COPY.md
- docs/15_HUMAN_TASKS.md
- directory-specific AGENTS.md files

The existing docs/10_BACKLOG.PROPOSAL.md explicitly says it cannot authorize T-000. The existing docs/08_UI_SPEC.PROPOSAL.md is not an approved UI specification. The current docs/STATUS.md contains local uncommitted task-log changes and must be reviewed separately from application code.

## Phase P operating rules

- One task per review cycle.
- Read the task Read first list before implementation.
- Do not begin a dependent task until its dependency is accepted.
- Do not mark a task done until all acceptance criteria and required tests pass.
- Prototype behavior must be labeled simulated and must not imply production security, identity, persistence, moderation, or integration.
- Fixture data must not contain real credentials, personal data, or production identifiers.
- No user-controlled value may be inserted into HTML without escaping or a reviewed safe renderer.
- All interactive controls must be keyboard reachable and visibly focused.
- If a required gate is not PASSED, stop and report the blocker.

## T-000 — Repository bootstrap and authority reconciliation

Status: Blocked pending founder approval of this proposal and recovery decisions.
Dependencies: founder approval; authoritative task acceptance criteria; repository ownership confirmation.
Read first: AGENTS.md, README_START_HERE.md, docs/STATUS.md, docs/01_PRODUCT_SPEC.md, docs/02_DECISIONS.md, docs/03_ARCHITECTURE.md, docs/04_DATA_MODEL.md, docs/05_API_AND_ROUTES.md, docs/06_SECURITY_INVARIANTS.md.

Scope:

- Create the documented monorepo foundation: apps/web, apps/admin, apps/worker, apps/prototype, packages/core, packages/ui, packages/testing, packages/config, infra, and docs.
- Use only the approved stack from AGENTS.md: Node.js 24 LTS, pnpm workspaces, TypeScript strict mode, patched Next.js 16, React, Tailwind CSS v4, PostgreSQL, Drizzle, zod, Radix UI, lucide, Vitest, and Playwright.
- Keep prototype code isolated from packages/core.
- Do not implement product features, authentication, GitHub integration, database behavior, moderation, or deployment.

Acceptance criteria:

- Founder has approved this replacement backlog or supplied the authoritative historical backlog.
- Repository branch, remote, working-tree ownership, and baseline are documented.
- Workspace configuration uses pnpm workspaces.
- TypeScript strict configuration exists.
- Documented apps and packages exist with clear ownership boundaries.
- No secrets, credentials, private repository data, or unapproved dependencies are introduced.
- pnpm install, pnpm lint, pnpm typecheck, and applicable bootstrap tests run with actual results recorded.
- git status is recorded.
- No M0/M1/M2 gate is changed.

Required tests: workspace/package-manager validation, TypeScript strict check, lint, import-boundary check, secret scan, and Git diff review.
Permitted edits: bootstrap files explicitly required by approved architecture, task tests/config, and status evidence after approval.
Stop conditions: missing acceptance criteria, unresolved authority documents, gate changes, stack conflicts, credentials, cloud resources, deployment, or production data.

## T-001 — Design system and accessible shared UI foundation

Status: Proposed; not complete.
Dependencies: accepted T-000 and founder approval of the UI direction.
Read first: AGENTS.md, docs/01_PRODUCT_SPEC.md, docs/02_DECISIONS.md, authoritative docs/08_UI_SPEC.md when recovered; otherwise docs/08_UI_SPEC.PROPOSAL.md as non-authoritative input.

Scope:

- Implement brand configuration, typography, spacing, color, border, radius, motion, and focus tokens.
- Provide accessible buttons, links, inputs, dialogs, tabs, tags, metadata labels, cards, empty states, and feedback states.
- Provide responsive layout primitives and message-catalog integration.
- Resolve the conflict between the recovered warm-paper BuildSocial direction and the newer dark Solvynk proposal only through founder approval.

Acceptance criteria:

- Interactive components are keyboard reachable with visible focus.
- Icon-only controls have accessible names.
- Dialogs have correct roles, labels, focus entry, focus return, and escape behavior.
- Tabs expose selection and panel relationships.
- Color is not the sole status signal.
- Reduced motion is supported.
- Mobile layouts avoid unintended horizontal overflow at the approved viewport matrix.
- Tokens replace arbitrary component-level colors.
- Component and accessibility tests pass.

Required tests: Vitest, Playwright keyboard navigation, axe checks, responsive tests at 360/390/768/1024/1440, and reduced-motion smoke test.
Permitted edits: packages/ui, packages/config, approved design documentation, tests, and fixtures.
Stop conditions: unapproved UI proposal, backend dependency, or unresolved accessibility failure.

## T-002 — Clickable frontend prototype

Status: Proposed; current local implementation is review evidence only.
Dependencies: accepted T-001 and approved fixture architecture.
Read first: AGENTS.md, docs/01_PRODUCT_SPEC.md, docs/02_DECISIONS.md, docs/05_API_AND_ROUTES.md, docs/06_SECURITY_INVARIANTS.md, and authoritative UI/test documents when recovered.

Scope:

- Homepage, Explore/search/filter, problem detail, numbered requirements, project detail, Project Passport, BuildTree coverage matrix, owner review, builder wizard, problem-owner brief flow, member saved/following/notification/profile/recently-viewed states, admin prototype, and outbound-link safety interstitial.

Acceptance criteria:

- Every route has an explicit fixture-only boundary.
- Public cards do not present simulated security claims as verified facts.
- Stable fixture slugs drive problem and project detail routes.
- Coverage distinguishes owner-confirmed, creator-claimed, and unclaimed states.
- Save and draft behavior uses localStorage only and is labeled.
- No personal data is collected or transmitted.
- Route links resolve.
- Empty, loading, error, and success states exist for demonstrated flows.
- Prototype screens do not claim real authentication, authorization, moderation, GitHub integration, or persistence.
- Console errors are zero on the route smoke matrix.

Required tests: JavaScript syntax, route smoke, search/filter, form validation, local save/draft, share, outbound interstitial, keyboard/focus, five viewport responsive tests, link audit, and asset audit.
Permitted edits: apps/prototype, fixtures, shared UI consumed by prototype, prototype docs, and tests.
Stop conditions: real-looking credentials, misleading production claims, unsafe HTML rendering, or a route that needs a backend to appear functional.

## T-002-QA — Prototype quality remediation

Status: Proposed follow-up; not authorized until T-002 and the UI direction are approved.
Dependencies: T-002 review findings and founder approval of the UI proposal.

Scope:

1. Replace misleading claims such as verified server-side, pre-moderation active, and core service enforcement updated with explicit simulation language.
2. Add accessible mobile navigation where desktop navigation is hidden.
3. Add a visible Explore no-results state.
4. Make all six Studio panels discoverable without ambiguous desktop/mobile clipping.
5. Replace unsafe innerHTML rendering with escaped text/attribute construction or a reviewed safe renderer.
6. Replace credential-shaped fixtures with unmistakably synthetic values.
7. Run browser tests at 360, 390, 768, 1024, and 1440 pixels.
8. Verify focus rings, dialog focus management, touch targets, reduced motion, heading order, and contrast.

Acceptance criteria:

- No copy presents simulated controls as active production enforcement.
- Mobile navigation is touch and keyboard accessible and exposes primary routes.
- Explore displays an accessible no-match message.
- Six Studio panels remain discoverable.
- Dynamic rendering does not interpolate user-controlled values into HTML.
- No credential-shaped token patterns remain in fixtures.
- All five viewport checks pass without unintended horizontal overflow.
- Modal focus enters, remains usable, and returns to its trigger.
- No new console errors or broken links.

Required tests: Playwright five-viewport matrix, axe checks, keyboard-only navigation, DOM/XSS regression tests, secret scan, and git diff check.
Permitted edits: prototype HTML/CSS/JavaScript, fixtures, and prototype documentation only. No backend or production security implementation.
Stop conditions: authentication, server-side authorization, database persistence, GitHub credentials, real secret discovery, or an unapproved brand change.

## T-003 — Concierge validation page tool

Status: Proposed; blocked until T-000 authority is recovered.
Dependencies: accepted T-000, validation plan, and copy approval.
Read first: AGENTS.md, docs/01_PRODUCT_SPEC.md, docs/02_DECISIONS.md, missing docs/13_VALIDATION_KIT.md, missing docs/14_CONTENT_AND_COPY.md, and missing docs/15_HUMAN_TASKS.md.

Scope: create a validation-only static page generator for manually curated problem briefs. It must not become a production publishing system or store sensitive data.

Acceptance criteria:

- Generates a static reviewable brief with context, numbered requirements, owner disclosure, build window, and manual handoff copy.
- Does not expose private drafts, send email, or create accounts.
- Escapes or sanitizes all content.
- Documents consent, feedback handoff, and validation success measures.

Required tests: input validation, XSS/HTML injection, static link audit, accessibility, and responsive smoke tests.
Stop conditions: undefined consent, legal copy, contact handling, demand metrics, or production-like persistence/authentication.

## T-004 — GitHub App integration spike

Status: Proposed; founder-dependent and blocked on missing docs/07_GITHUB_APP.md and human-task decisions.
Dependencies: accepted T-000, a founder-created development GitHub App, and an approved GitHub specification.

Scope:

- Produce an isolated spike report for public personal-repository metadata.
- Verify installation callback assumptions, fresh-user authorization, repository filtering, Metadata: read-only permissions, token non-persistence, webhook signature verification, delivery deduplication, revocation, and failure cases.

Acceptance criteria:

- No user access or refresh token is stored or logged.
- Only public personal repositories are eligible.
- Private repository names, IDs, and metadata are not persisted.
- No GitHub write API calls exist.
- Installation IDs are verified against the authenticated user.
- HMAC verification occurs before JSON parsing.
- Duplicate deliveries are deduplicated.
- The report records unresolved assumptions and does not claim production readiness.

Required tests: GitHub fixtures, installation binding, private-repository filtering, token/log redaction, webhook HMAC, duplicate delivery, and API allowlist tests.
Stop conditions: missing founder App approval, permissions beyond Metadata: read, token persistence, production deployment, or real user data.

## Source-to-requirement traceability

| Requirement | Source |
|---|---|
| One task, gate checks, status evidence | AGENTS.md sections 0 and 7 |
| Approved stack and dependency licensing | AGENTS.md section 3; docs/02_DECISIONS.md D-016 |
| Monorepo boundaries | AGENTS.md section 4; docs/03_ARCHITECTURE.md |
| DTO-only public responses | AGENTS.md hard rules; docs/06_SECURITY_INVARIANTS.md SI-03/SI-04 |
| No stored GitHub tokens | AGENTS.md; SI-11 |
| Private repository filtering | AGENTS.md; SI-07 |
| Strict input validation | AGENTS.md; SI-05 |
| Secret scanning | SI-17 |
| Sanitized content and safe links | AGENTS.md; SI-18/SI-20/SI-21 |
| Upload restrictions | AGENTS.md; SI-22 |
| Audit and emergency switches | AGENTS.md; SI-24/SI-27/SI-28 |
| Product surfaces | docs/01_PRODUCT_SPEC.md; docs/05_API_AND_ROUTES.md; docs/08_UI_SPEC.PROPOSAL.md |
| M0 evidence thresholds | README_START_HERE.md and current docs/STATUS.md; historic backlog missing |
| T-000 blocked | docs/10_BACKLOG.PROPOSAL.md; docs/RECOVERY_PROPOSAL.md |
| QA remediation findings | Local uncommitted UI review findings; proposal-only input |

## Founder approval checklist

- [ ] Approve this as the replacement Phase P backlog, or provide docs/10_BACKLOG.md.
- [ ] Approve or reject docs/08_UI_SPEC.PROPOSAL.md.
- [ ] Decide whether dark Solvynk replaces the recovered warm-paper BuildSocial direction.
- [ ] Approve provisional BRAND_NAME and rename policy pending clearance.
- [ ] Confirm local UI changes may be reviewed as T-001/T-002 evidence.
- [ ] Approve T-002-QA remediation.
- [ ] Review local docs/STATUS.md changes separately from application code.
- [ ] Supply or reconstruct docs/07 and docs/09–15, or approve proposal replacements.
- [ ] Confirm development GitHub App ownership, callback URLs, permissions, and test account.
- [ ] Confirm validation participants, consent, and M0 success thresholds.
- [ ] Confirm no implementation task may change M0/M1/M2 without a founder decision.

## Exact remaining blockers

1. Authoritative docs/10_BACKLOG.md is missing.
2. T-000 acceptance criteria and permitted commands are unverified.
3. docs/07_GITHUB_APP.md and docs/09_TEST_PLAN.md are missing.
4. The authoritative UI specification is missing.
5. Operations, validation, content, and human-task documents 11–15 are missing.
6. Local docs/STATUS.md changes are uncommitted and require separate founder review.
7. The local prototype contains credential-shaped demo strings and misleading production-style claims.
8. Exact five-viewport browser verification remains outstanding.

Proposed disposition: stop for founder review. Do not mark tasks complete, change gates, modify application code, commit, push, merge, deploy, or spend money based on this proposal alone.
