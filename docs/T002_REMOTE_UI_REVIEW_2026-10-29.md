# T-002 remote UI/trust review — 2026-10-29

## Scope
This is a Phase-P **static prototype** improvement pass on `review/t002-ui-trust-20261029`, branched from `codex/t002-polish` (PR #1). It is **not** the later local V4 candidate reported at `db2770ee`, which is not on GitHub. Do not use this branch to overwrite or silently replace the V4 worktree. Reconcile changes file by file before merging or publishing a new canonical baseline.

## User-facing changes
- Replace the homepage's locally simulated beta signup with authentic demo entry actions.
- Label the sample-fixture prototype consistently on all pages.
- Remove links posing as published legal policies and remove misleading live-safety and hosted-badge claims.
- Refine display typography, visual contrast, responsive cards, CTA and tablet/mobile navigation.
- Make saved-button states survive refresh in supported browsers, including dynamically rendered detail pages.
- Restrict outbound demo links to HTTPS, provide an informative invalid-link state, and improve modal focus, Escape handling, and focus return.
- Clarify that copying a project link does not generate an OG image.

## Checks actually performed
- Source JS syntax parsing succeeded for `app.js`, `fixtures.js`, `explore.js`, and `prototype.js`.
- Source link/ID consistency checks found no missing internal pages or static anchors across the five HTML routes.
- The former simulated homepage email form is absent; the false legal-policy links identified in this pass are absent.
- Vercel reported READY for the review-branch preview after the latest `app.js` commit.

These checks **do not** constitute a local `pnpm` run or confirm Chromium, Firefox, WebKit, screen-reader, Lighthouse, Playwright, WCAG, or manual pixel-perfect verification. Vercel READY does not demonstrate functional correctness.

## Required before acceptance or integration
1. Recover and compare the local V4 candidate `db2770ee` against this remote branch and PR #1; port only applicable changes.
2. Run `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build:prototype`, and `pnpm verify:publication` from the reconciled source.
3. Manually inspect Home, Explore, Problem, Project, and Studio at 360/390/768/1024/1440, and test all meaningful interactions with keyboard and assistive technology.
4. Check protected Vercel preview through an authenticated browser and test link, console, layout, and accessibility failures.
5. Have the founder review and explicitly accept T-001/T-002; do not change M0/M1/M2 or promote production without their separate criteria.

## Limits
No backend, GitHub integration, authentication, permanent user accounts, real submissions, invites, external-link Web Risk checking, live hosting badges, or legal-service representation was implemented. The current branch is a review candidate, not production.
