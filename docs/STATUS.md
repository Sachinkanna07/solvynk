# STATUS — BuildSocial V2

> Living log. Codex updates the task table, assumptions, conflicts, open questions and deviations at the end of every task. **Only the founder changes gate status.**

## Current phase
**Phase P — Pre-build** (design system, clickable prototype, concierge tool, GitHub App spike)

## Gates
| Gate | Status | Date | Evidence / notes |
|---|---|---|---|
| M0 — Spec & validation freeze | NOT PASSED | — | See docs/10_BACKLOG.md §Gate M0 |
| M1 — Closed beta readiness | NOT PASSED | — | See docs/10_BACKLOG.md §Gate M1 |
| M2 — Public launch readiness | NOT PASSED | — | See docs/10_BACKLOG.md §Gate M2 |

## Task log
| Task | Status (todo / in progress / review / done / blocked) | PR / commit | Notes |
|---|---|---|---|
| T-000 Repo bootstrap | done | local `a21bbc1` on `review/t001-separation`; original changes remain uncommitted on `main` | Founder explicitly accepted T-000 on 2026-10-17 after reviewing the acceptance evidence below. |
| T-001 Design system | review | uncommitted on `main` | 33 of 34 current browser tests pass; new reverse-Tab dialog-containment regression fails. Evidence and limitations below; founder acceptance pending. |
| T-002 Clickable prototype | review | | Fixture prototype is review evidence only; execution waits for T-001 acceptance. Browser and accessibility criteria remain unverified. |
| T-003 Concierge page tool | todo | | Blocked on T-000 |
| T-004 GitHub App spike | todo | | needs founder: dev GitHub App created (docs/15 §A3) |

## Assumptions made (by Codex; founder to confirm or overrule)
| # | Task | Assumption | Constant / config name | Founder decision |
|---|---|---|---|---|
| 1 | UI/UX and branding | Solvynk dark theme tokens and 64-surface IA in docs/08_UI_SPEC.PROPOSAL.md are adopted for Phase P; Solvynk is the configurable working name | `BRAND_NAME="Solvynk"` | Founder approved 2026-10-17; trademark/domain/logo clearance remains pending |
| 2 | T-001 | Increase the muted text token from the approved palette proposal's `#6C7D93` to `#9AAEC5` on dark cards. The former measured 3.98:1, below the 4.5:1 normal-text target. | `--text-muted` in `@app/ui/tokens.css` | Founder approved retention on 2026-10-20, subject to applicable contrast checks; measured at least 6.46:1 on the approved dark surfaces |

## Spec conflicts found
| # | Docs involved | Conflict | Resolution applied |
|---|---|---|---|
| 1 | D-044 in docs/02_DECISIONS.md vs docs/08_UI_SPEC.PROPOSAL.md header | D-044 records founder approval of the Phase P UI baseline, while the proposal header still says it awaits review. | Follow D-044 for Phase P; retain the historical proposal label without treating it as recovered original. |

## Open questions for founder
| # | Raised in | Question | Answer (→ move to docs/02_DECISIONS.md) |
|---|---|---|---|
| 1 | Phase P review | Does the founder approve the recovery plan to authoritatively unblock T-000? | Branding/UI direction approved 2026-10-17; T-000 authority is recorded in the founder-approved replacement backlog |
| 2 | T-001 review | Does the founder accept the T-001 design-system evidence? | Pending; the muted-token adjustment is approved, but the dialog containment test fails |

## Deviations from spec
| # | Task | What differs | Why | Approved? |
|---|---|---|---|---|
| 1 | T-000 | `dev`, `test:e2e`, `test:security`, and `db:*` root commands are absent. | The T-000 skeleton has no runnable app, E2E suite, security suite, or database; placeholder success scripts would misstate verification. Add each when its implementation task exists. | Pending review |

## T-000 acceptance review — 2026-10-17

| Criterion | Evidence | Result |
|---|---|---|
| 1. Workspace and versions | pnpm workspace includes all eight app/package manifests; `packageManager` is `pnpm@11.7.0`, Node range is `>=24 <25`, `.nvmrc` is 24. | PASS |
| 2. Strict TypeScript | Shared base config has `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`; Node reports `v24.11.1`. | PASS |
| 3. Ownership directories | All required app/package/infra/tool directories and ownership README files are present. | PASS |
| 4. Prototype isolation | Static root prototype remains; no `@app/core` import found in its HTML/JS/CSS. | PASS for bootstrap |
| 5. Placeholder secrets | `.env.example` uses local placeholder origins and a local-only database URL; local origin hostnames are separate. No real credential was added. | PASS |
| 6. Approved dependencies | Only TypeScript 5.9.3 is installed; its installed package declares Apache-2.0 and D-016 appendix records it. | PASS |
| 7. Commands and checks | `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:bootstrap` exit 0. Bootstrap verifier validates paths, manifests, strict config, workspace globs, origin separation, and license registration. A repository token-pattern scan found only two intentional fake values in the existing prototype; no full gitleaks run occurred because it is unavailable locally. | PASS with scanner limitation |
| 8. Startup | Skeleton app directories contain no runnable apps. Local startup is not applicable under the backlog criterion. | N/A |
| 9. Git review | Original worktree is `main` at `e7c86b0` with mixed uncommitted prototype and bootstrap changes. Review worktree is `preview/solvynk-dark-ui` at `9f979da`; it has separate uncommitted specification changes. The prototype files exist in both; hashes differ. Scoped bootstrap and README `git diff --check` exit 0. Full `git diff --check` finds whitespace in other existing prototype edits and CRLF conversion warnings. No commit, push, merge, or deployment was performed. | PASS with existing worktree cleanup pending |
| 10. Gates | M0, M1, M2 remain NOT PASSED. | PASS |

T-001 evidence map: dark palette and responsive CSS are present; shared accessible components, keyboard tab interaction, local font/origin policy, axe/component checks, and five-viewport evidence are still unverified. T-002 evidence map: homepage, Explore, detail pages, and Studio fixtures exist; simulated controls, fake credential-shaped fixtures, browser console/link/asset checks, and complete keyboard/error-state verification remain for its own review cycle. The root README now labels simulations and accessibility status accurately.

Integration order after acceptance: review T-001 against its accessibility and visual criteria; after its acceptance, review T-002 and the proposed remediation task. Preserve the V3 preview branch and both dirty worktrees. Integrate the bootstrap and prototype through a reviewed branch/commit with path-specific staging; do not merge or overwrite either tree implicitly.

## T-001 design-system review — 2026-10-18

| Criterion | Evidence | Result |
|---|---|---|
| Shared visual foundation | `packages/ui/tokens.css`, `components.css`, and `accessibility.css` are exported from `@app/ui` and imported by the static V3 prototype. Button, badge, link, focus, and touch primitives use tokens. | PASS for Phase P |
| Keyboard and focus | Mobile menu opens from a button, focuses its first link, closes on Escape, and restores focus. Studio tabs use roving Tab focus and Arrow/Home/End selection. The native outbound dialog traps focus, closes on Escape/Cancel, and restores the trigger. Source cards are buttons. | PASS in Chrome browser tests |
| Responsive | Homepage, Explore, problem detail, project detail, and Studio have no page-level horizontal overflow at 320, 360, 390, 768, 1024, 1440, or 1920px. Mobile menu and Studio tabs remain reachable. Touch targets checked at 390px with touch emulation. | PASS in Chrome browser tests |
| Fonts and browser origins | Inter and JetBrains Mono font files are served locally with copied OFL licenses. Fixture stock images were replaced by first-party developer-interface SVG illustrations. All five tested routes requested only the local origin. | PASS |
| Accessibility automation | axe-core reports zero violations for the selected WCAG 2/2.1/2.2 A/AA tags on five initial pages, all six Studio panels, the open mobile navigation, and the open dialog. Reduced-motion transition suppression passes. | PASS for automated coverage; manual screen-reader review not yet performed |
| Screenshots | 15 files in `artifacts/t001/`: seven homepage widths and 390/1440px captures for Explore, problem, project, and Studio. Visual review found no clipping after the narrow-screen fixes. | PASS |
| Commands | `pnpm test` passes 25 Playwright tests plus bootstrap check. `pnpm lint` runs bootstrap and JavaScript syntax checks; `pnpm typecheck` and `pnpm audit --audit-level=critical` pass. Playwright used installed Chrome because the Chromium CDN failed with DNS/connection errors. | PASS; full ESLint is future monorepo work |
| Git review | Original worktree remains `main` at `e7c86b0` with pre-existing mixed, uncommitted V3 and T-000 changes plus T-001 changes. Review worktree remains `preview/solvynk-dark-ui` at `9f979da` with separate uncommitted spec edits. `git diff --check` exits 0 (Git reports only LF/CRLF conversion warnings). No local commit was created: it cannot cleanly contain only T-001 until the pre-existing work is separated. No push, PR, merge, or deployment occurred. | REVIEW BLOCKER for isolated commit |

Remaining limits: the automated checks do not establish full WCAG 2.2 AA conformance or screen-reader usability; that requires manual review. The pages remain a fixture prototype, and T-002 content claims and functional journeys have not been accepted. M0, M1, and M2 remain NOT PASSED.

## T-001 follow-up review — 2026-10-20

- Before editing, both dirty worktrees were inspected and recoverable source snapshots were created outside the repository at `E:\WEBSITE\solvynk-snapshots\solvynk-main-pre-t001-focus-20261020.tar.gz` and `E:\WEBSITE\solvynk-snapshots\solvynk-review-pre-t001-focus-20261020.tar.gz`. Git history and dependency/test-output directories are excluded; original branch and HEAD identities remain recorded above. Neither worktree was reset or overwritten.
- A new browser regression test reproduced focus remaining in a hidden mobile-navigation link after outside-click closure. `app.js` now restores focus to the mobile toggle, or to visible desktop navigation when a resize closes the menu. The test failed before the fix and passes after it.
- Current checks: `pnpm lint` PASS, `pnpm typecheck` PASS, `pnpm test` PASS (bootstrap plus 29 Playwright tests, including axe, seven-width responsive checks, and mobile-menu keyboard checks at 320/360/390/768px). This is T-001 evidence only, not a V4 functional acceptance or a complete WCAG audit.
- T-001 remains in review. The mixed uncommitted changes still prevent an isolated T-001 commit without a separate integration decision; manual screen-reader verification remains open. Founder acceptance of T-001 is required before T-002/V4 functional remediation starts. M0, M1 and M2 remain NOT PASSED.

## T-001 final review and local separation — 2026-10-20

- A fresh source snapshot of the current original worktree was saved at `E:\WEBSITE\solvynk-snapshots\solvynk-main-pre-separation-20261020.tar.gz` (SHA-256 `B04730DC80EBAF257AE951E2E1A99A1DF61C64522EC790D1244504340C7CF055`). Both older worktree snapshots were verified; the separate preview worktree was not edited.
- In a new isolated local worktree, `review/t001-separation` at `E:\WEBSITE\solvynk-integration`, a targeted, fully reviewed T-000-only bootstrap commit `a21bbc1` was created. Its frozen-lockfile install, lint, typecheck, and bootstrap tests pass. This commit does not include T-001 or T-002 prototype functionality. The original `main` worktree retains its meaningful uncommitted changes.
- T-001 could not be committed separately without semantic surgery: the one replacement hunk in `app.js` contains both design-system navigation/dialog logic and T-002 waitlist/save/share behavior; `prototype.js` similarly combines tabs/source accessibility with T-002 wizard and form interactions. Committing either whole file would violate scope; staging only source fragments would not preserve a functioning current prototype. No T-001 or T-002 commit was made.
- Added focused browser checks for all-route mobile navigation, source-selection keyboard activation, focus visibility, dialog focus cycling, and muted/focus-token contrast. The muted token is 8.44:1 on the base canvas, 7.91:1 on navigation, 7.37:1 on cards, and 6.46:1 on raised surfaces. The focus border exceeds 3:1 on those surfaces.
- `pnpm lint`, `pnpm typecheck`, and `git diff --check` pass in the original worktree. `pnpm test` runs bootstrap and 34 Playwright tests: 33 pass, 1 fails. The new dialog test consistently shows focus moving to `BODY` after reverse-Tab from the first modal control. The focused keyboard/mobile/reduced-motion/axe run likewise has 19 pass, 1 fail. Existing 29 tests remain passing. Manual screen-reader review remains NOT TESTED. T-001 stays REVIEW; M0, M1, and M2 remain NOT PASSED.
