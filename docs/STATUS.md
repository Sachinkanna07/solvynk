# STATUS — BuildSocial V2

> Living log. Codex updates the task table, assumptions, conflicts, open questions and deviations at the end of every task. **Only the founder changes gate status.**

## Current phase
**Phase P — Pre-build** (design system, clickable prototype, concierge tool, GitHub App spike)

## Gates
| Gate | Status | Date | Evidence / notes |
|---|---|---|---|
| M0 — Spec & validation freeze | NOT PASSED | — | Founder has authorized continued Phase-P prototype work only |
| M1 — Closed beta readiness | NOT PASSED | — | Backend, security, operations and legal evidence not complete |
| M2 — Public launch readiness | NOT PASSED | — | Production launch is not authorized |

## Task log
| Task | Status (todo / in progress / review / done / blocked) | PR / commit | Notes |
|---|---|---|---|
| T-000 Repo bootstrap | in progress | | Founder-authorized source-of-truth reconciliation remains required |
| T-001 Design system | review | | Prototype design system and responsive surfaces exist |
| T-002 Clickable prototype | in progress | review/t002-ui-trust-20261029 | Remote UI/trust improvements committed for review; founder acceptance, browser QA and local V4 reconciliation still outstanding |
| T-003 Concierge page tool | todo | | Requires its own validation plan |
| T-004 GitHub App spike | todo | | Requires founder-created development GitHub App and specifications |

## Founder authorization
The founder authorizes work on T-002 within Phase P: improve the clickable prototype, UI/UX, responsive behavior, keyboard accessibility, content clarity, and local demo interactions; run available checks; preserve the prototype boundary.

This authorization does not authorize production backend work, authentication, database work, real GitHub integration, T-002-QA, deployment promotion, or changing M0/M1/M2 gate values.

## Assumptions made (by Codex; founder to confirm or overrule)
| # | Task | Assumption | Constant / config name | Founder decision |
|---|---|---|---|---|
| 1 | T-002 | The preview branch is the current prototype source of truth for this authorized pass | BRANCH=preview/solvynk-dark-ui | Authorized by founder request on 2026-10-21 |

## Spec conflicts found
| # | Docs involved | Conflict | Resolution applied |
|---|---|---|---|
| 1 | docs/STATUS.md, remote branch history | Main and preview branches report different task states | Preview branch is used for this authorized prototype pass; gates remain unchanged |

## Open questions for founder
| # | Raised in | Question | Answer (→ move to docs/02_DECISIONS.md) |
|---|---|---|---|
| 1 | Release planning | Which branch should become the long-term authoritative branch after prototype review? | Pending |

## Deviations from spec
| # | Task | What differs | Why | Approved? |
|---|---|---|---|---|
| 1 | T-002 | Prototype-only implementation remains fixture/local-state based | Production authority is gated by M0 | Yes, within this authorization |

## Remote UI review work (2026-10-29)
The founder's latest request authorizes practical UI/UX improvements on the connected GitHub/Vercel project. An isolated review branch descended from `codex/t002-polish` to avoid changing `main` or overwriting the local V4 worktree. Source-level checks and Vercel READY metadata are recorded in `docs/T002_REMOTE_UI_REVIEW_2026-10-29.md`. This is review evidence, **not** a T-001/T-002 acceptance, T-002-QA sign-off, or a passed M0/M1/M2 gate. The local V4 candidate must be recovered and reconciled before any merge.
