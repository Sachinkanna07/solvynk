# BuildSocial V2 — Codex Build Pack (start here)

Version 1.0 · 16 October 2026 · Working name "BuildSocial" (pending clearance — see D-002)

This folder is the **seed of a new code repository**. It contains no application code — only the instructions, specifications, decisions, tests-to-write and ordered tasks that let an AI coding agent (OpenAI Codex, or similar) build BuildSocial V2 safely, one reviewed step at a time.

---

## 1. What is in the pack

| Path | Purpose | Who reads it |
|---|---|---|
| `AGENTS.md` | Root rules Codex loads automatically at the start of every session (kept short — Codex caps combined AGENTS files at 32 KiB by default) | Codex (auto) |
| `apps/*/AGENTS.md`, `packages/*/AGENTS.md` | Directory-specific rules (Codex loads the nearest ones) | Codex (auto) |
| `docs/STATUS.md` | Living progress log: phase, gates, task status, assumptions, open questions | Codex + you |
| `docs/01_PRODUCT_SPEC.md` | What the product does — features, rules, acceptance criteria | Codex + you |
| `docs/02_DECISIONS.md` | Decision log with status (Accepted / Provisional / Needs founder / Needs counsel / Needs spike) | Codex + you |
| `docs/03_ARCHITECTURE.md` | Stack, repo layout, module boundaries, env vars, flows | Codex |
| `docs/04_DATA_MODEL.md` | Tables, columns, constraints, indexes, state machines | Codex |
| `docs/05_API_AND_ROUTES.md` | Pages, service functions, authorization actions, errors | Codex |
| `docs/06_SECURITY_INVARIANTS.md` | Non-negotiable security rules, each mapped to a test | Codex + reviewer |
| `docs/07_GITHUB_APP.md` | GitHub App settings, sign-in/install flows, webhooks, spike plan | Codex + you |
| `docs/08_UI_SPEC.md` | Design tokens, components, screens, states, accessibility | Codex |
| `docs/09_TEST_PLAN.md` | Test suites, release blockers, fixtures, CI gates | Codex |
| `docs/10_BACKLOG.md` | Ordered tasks (T-000 …) with scope and acceptance criteria | Codex + you |
| `docs/11_CODEX_PROMPTS.md` | Paste-ready prompts for each task + review/fix templates | You |
| `docs/12_OPERATIONS.md` | Moderation, incident and recovery runbooks (draft, counsel to review) | You |
| `docs/13_VALIDATION_KIT.md` | Interviews, concierge pages, pilot challenge, metrics, kill criteria | You |
| `docs/14_CONTENT_AND_COPY.md` | UI microcopy, warnings, notification/email templates, legal placeholders | Codex + you |
| `docs/15_HUMAN_TASKS.md` | Everything only you can do (accounts, GitHub Apps, secrets, legal, people) | You |
| `docs/reference/` | Background: the independent audit (never overrides the docs above) | Optional |

## 2. How to start (today)

1. **Create a new, empty private Git repository** (do not reuse the DOT repo). Copy every file in this folder to the repository root. Commit: `chore: add BuildSocial V2 build pack`.
2. Optionally copy `BuildSocial_Audit/BuildSocial_Independent_Audit_2026-10-16.md` into `docs/reference/AUDIT.md`.
3. Read `docs/15_HUMAN_TASKS.md` §A (things to do this week) and `docs/02_DECISIONS.md` (scan for **NEEDS-FOUNDER** items — the defaults let Codex start, but you should confirm or change them).
4. Open Codex at the repository root. Paste the prompt for **T-000** from `docs/11_CODEX_PROMPTS.md`.
5. Review the result with the checklist in `docs/11_CODEX_PROMPTS.md` §R. Merge only if it passes.
6. Continue in order: T-001 → T-002 → T-003 → T-004. These are the **pre-build track** (design system, clickable prototype, concierge page generator, GitHub App spike). They support validation and do **not** depend on unresolved decisions.
7. **Do not start M1 tasks (T-101 onward)** until Gate M0 in `docs/STATUS.md` is marked PASSED by you. Codex is instructed to refuse otherwise.

## 3. The phases

```
Phase P (now)        Phase M1a/b/c (after Gate M0)          Beta (after Gate M1)      Launch (after Gate M2)
─────────────        ───────────────────────────────        ────────────────────      ──────────────────────
T-000 repo           Foundation → Core product → Social,     Invite-only, pre-          Public, after evidence,
T-001 design system  safety & ops                            moderated, measured         pentest, counsel review
T-002 prototype
T-003 concierge tool        ▲ Gate M0 = validation evidence + decisions closed + spike report + prototype tested
T-004 GitHub spike
```

| Gate | You mark it PASSED when… (details in `docs/10_BACKLOG.md`) |
|---|---|
| **M0** | Validation signals collected (interviews, concierge share rate, ≥10 real problems, pilot partner), NEEDS-FOUNDER decisions answered, spike report complete, prototype tested with 6–8 people |
| **M1** | All M1 tasks done, release-blocking test suites green, restore drill passed, policies drafted and reviewed for beta, two named on-call people, ≥30 seeded projects and ≥8 problems |
| **M2** | Beta evidence thresholds met, external pentest fixed, counsel-reviewed policies, name cleared |

## 4. Working rules for you (the human reviewer)

- **One task per Codex session and per pull request.** Small PRs are reviewable; large ones hide security mistakes.
- **Never paste secrets** (keys, tokens, `.env` contents) into a Codex prompt. Secrets go only into your hosting provider's secret store or a local `.env` that is git-ignored.
- **Read the diff, not only the summary.** Use the review checklist (§R in `docs/11_CODEX_PROMPTS.md`). The release-blocking suites (authorization matrix, canary leak, webhook, XSS) must pass before merge.
- **Decisions belong to you.** If Codex logs an "Assumption made" or "Open question" in `docs/STATUS.md`, answer it and move the answer into `docs/02_DECISIONS.md`.
- **Keep validation running in parallel** (`docs/13_VALIDATION_KIT.md`). Code without evidence is the main failure mode the audit warned about.

## 5. Corrections applied since the audit

| Topic | Correction | Effect on the pack |
|---|---|---|
| Public snapshot tables | They **reduce**, not eliminate, leakage risk (wrong-table writes, stale caches, job bugs remain possible) | Snapshots are defence-in-depth; canary-leak tests and purge checks are release blockers (SI-03, T3) |
| URL safety checks | Web Risk cannot guarantee a demo is safe | Interstitial copy says so; reports + disabling remain essential |
| Staffing / legal timelines | Exact obligations and staffing must be set with counsel | Code provides switches, clocks and queues configurable by policy; values are config, not hard-coded |
| Supabase India block | Access was restored on **3 March 2026** after MeitY rescinded a s.69A order triggered by misuse of a single hosted project ([Supabase](https://supabase.com/blog/navigating-regional-network-blocks)) | Two lessons kept: browsers talk only to our own domains, and **our own domain could be blocked because of one user's content** → fast legal-order response and a separate user-content domain (see `docs/12_OPERATIONS.md` RB-09) |
| Framework versions | Next.js 15 support ends 21 Oct 2026; Next.js 16.4.1 fixed critical RCE and DoS issues ([npm](https://www.npmjs.com/package/next), [versionlog](https://versionlog.com/nextjs/)) | Pin the latest patched **Next.js 16.4.x or later 16.x**; verify with `npm view next version` |
| Node.js | Node 24 leaves Active LTS on 20 Oct 2026; Node 26 becomes Active LTS on 28 Oct 2026 ([NodeSource](https://nodesource.com/blog/nodesource-weekly-oct-6-2026-nodejs-26-lts-nsolid-6-3-8-jsconf-mexico)) | Start on **Node 24 LTS** (supported to Apr 2028); plan the Node 26 move once native deps (sharp) are confirmed |
| GitHub install flow | With "Request user authorization during installation" enabled, GitHub skips the Setup URL and redirects to the Callback URL with `code`, `installation_id`, `setup_action`, and the `state` passed on the `/installations/new?state=` URL ([GitHub Docs](https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-using-url-parameters), [community](https://github.com/orgs/community/discussions/61291)) | Single callback route branching on `installation_id`; verified in spike S-03 |
| Codex instructions | Codex loads `AGENTS.md` files from repo root down to the working directory, capped at 32 KiB by default ([OpenAI](https://developers.openai.com/codex/guides/agents-md)) | Root `AGENTS.md` is short; details live in `docs/` and are read per task |

## 6. What this pack still cannot do for you

It cannot validate demand, choose your co-founder, clear the trademark, sign contracts, draft enforceable legal policies, or replace a penetration test. Those are tracked in `docs/15_HUMAN_TASKS.md` and in the gates.
