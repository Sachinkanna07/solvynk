# Solvynk Phase P Backlog

Version: 1.0 replacement approved by founder on 2026-10-16
Historical status: Newly authored replacement; not a recovered historical document.
Authority: Applies only to Phase P T-000 through T-004 and remains subordinate to AGENTS.md, docs/06_SECURITY_INVARIANTS.md, docs/02_DECISIONS.md, docs/03_ARCHITECTURE.md, docs/04_DATA_MODEL.md, docs/05_API_AND_ROUTES.md, and docs/01_PRODUCT_SPEC.md.

The missing historical backlog and docs/07_GITHUB_APP.md through docs/15_HUMAN_TASKS.md remain unavailable. This replacement does not fabricate those documents.

M0, M1, and M2 remain NOT PASSED. The pre-build track permitted before M0 is T-000 through T-004 only. One task is executed per review cycle.

## T-000 — Repository bootstrap

Status: Authorized for execution after founder approval on 2026-10-16.
Dependencies: Founder approval recorded here; D-016 stack; existing authoritative specifications.
Read first: AGENTS.md, README_START_HERE.md, docs/STATUS.md, docs/01_PRODUCT_SPEC.md, docs/02_DECISIONS.md, docs/03_ARCHITECTURE.md, docs/04_DATA_MODEL.md, docs/05_API_AND_ROUTES.md, docs/06_SECURITY_INVARIANTS.md.

Scope: Create only the documented foundation: pnpm workspace configuration, strict TypeScript base configuration, root package scripts, secure example configuration, and the documented directories apps/web, apps/admin, apps/worker, apps/prototype, packages/core, packages/ui, packages/testing, packages/config, infra, spikes, tools/concierge, and docs. Preserve existing prototype files. Do not implement product features, authentication, GitHub integration, database behavior, moderation, deployment, or cloud resources.

Acceptance criteria:

1. Root workspace uses pnpm workspaces and package-manager/version constraints.
2. Node 24 and strict TypeScript configuration are documented.
3. Required app/package/infra/tool directories exist with ownership README files where needed.
4. Prototype remains isolated and does not import packages/core.
5. No secrets or credentials are added; secure example configuration contains placeholders only.
6. Only approved dependencies are introduced, with licenses recorded in D-016 when applicable.
7. pnpm install, lint, typecheck, bootstrap tests, configuration validation, and secret scanning are run with actual results recorded.
8. Local startup is checked only if the bootstrap skeleton includes a runnable app.
9. Git status and diff are reviewed.
10. M0, M1, and M2 remain NOT PASSED.

Permitted edits: bootstrap configuration, empty package manifests, placeholder source/readme files, tests/configuration required by this scope, and task evidence in docs/STATUS.md. Do not edit recovered authoritative specifications.
Stop conditions: missing acceptance criteria, stack conflict, need for credentials/cloud resources, production data, feature implementation, or any request to change a gate.

## T-001 — Design system

Status: Proposed; not started by this execution.
Dependency: T-000 accepted.
Scope: Shared token/component/accessibility foundation using the founder-approved dark Solvynk direction and the subordinate docs/08_UI_SPEC.PROPOSAL.md.
Acceptance: Keyboard access, visible focus, accessible dialogs/tabs, reduced motion, responsive five-viewport checks, token usage, and component/axe tests.
Stop: UI proposal conflict, backend dependency, or unresolved accessibility failure.

## T-002 — Clickable prototype

Status: Proposed; existing local prototype is review evidence, not accepted completion.
Dependency: T-001 accepted.
Scope: Homepage, Explore, problem/project detail, Project Passport, BuildTree matrix, builder wizard, owner studio/review, member states, admin prototype, and outbound-link interstitial using clearly fictional fixtures.
Acceptance: Fixture-only boundaries, honest simulated labels, working route links, empty/error/success states, zero route console errors, JavaScript syntax, keyboard/focus, link/asset, and five-viewport tests.
Stop: Real-looking credentials, misleading production claims, unsafe rendering, or backend dependency.

## T-002-QA — Prototype remediation

Status: Proposed follow-up; not started by this execution.
Dependency: T-002 review and founder-approved UI baseline.
Scope: Remediate misleading production claims, add mobile navigation, add Explore empty state, remove Studio tab overflow, replace unsafe innerHTML, replace credential-shaped fixtures, and complete 360/390/768/1024/1440 browser/accessibility verification.
Acceptance: No simulated control is described as production enforcement; mobile routes are keyboard/touch reachable; no-match feedback is accessible; six panels are discoverable; dynamic values are safely rendered; secret scan is clean; five-viewport, axe, keyboard, dialog, and console checks pass.
Stop: Authentication, authorization, persistence, GitHub credentials, real secret discovery, or unapproved brand change.

## T-003 — Concierge showcase tool

Status: Proposed; blocked until missing validation/content/human-task authority is recovered or approved.
Dependency: T-000 and approved validation plan.
Scope: Validation-only static showcase generator for consenting pilot builders, with escaped content, no account creation, no email sending, and no production persistence.
Acceptance: Static output, numbered requirements, build window, clear consent/handoff, XSS tests, accessibility, and link audit.

## T-004 — GitHub App feasibility spike

Status: Proposed; blocked on missing docs/07_GITHUB_APP.md and founder-created development App.
Dependency: T-000 and approved App settings.
Scope: Public personal repository metadata only; installation binding, permission minimization, revocation, visibility change, webhook authenticity and deduplication, and API failure behavior.
Acceptance: No stored/logged user tokens, no private metadata persistence, no GitHub writes, verified installation ownership, HMAC-before-parse, duplicate delivery handling, and an honest spike report.

## Gate references

M0 remains founder-controlled and requires the validation evidence described in README_START_HERE.md and the eventual approved validation plan. This backlog does not pass M0 or authorize production MVP work. M1 and M2 remain NOT PASSED.

## Approval record

Founder authorization was provided in the 2026-10-16 conversation for this newly authored replacement backlog, the Phase P UI proposal, the Solvynk working name, and the dark navy direction. This record does not assert historical recovery and does not waive higher-priority security, architecture, product, legal, or missing-document requirements.
