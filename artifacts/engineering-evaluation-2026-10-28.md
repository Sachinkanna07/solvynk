# Solvynk V4 engineering evaluation — 2026-10-28

## Scope and evidence

Accepted candidate: `review/t002-qa-2026-10-24` at `4bf986b84189ee9c5930b0fe5e95b0a0e8a4a2d5`. This is a static, fixture-only prototype plus an isolated, uncommitted T-004 GitHub App spike. `apps/web`, `apps/admin`, `apps/worker`, and `packages/core` are package skeletons, not running product services. Scores below apply only to the named prototype or spike. **N/S** means there is no defensible current score. No production score is implied.

Current checks: `pnpm lint` PASS; `pnpm typecheck` PASS; `pnpm test` PASS (197 browser tests passed, one existing Windows WebKit skip, 12 GitHub spike tests passed, and 33 publication assets verified byte-identical). Chromium, Firefox, and WebKit each ran. The skip is the WebKit skip-link keyboard traversal case that depends on macOS Full Keyboard Access; it passes in Chromium and Firefox. `git diff --check` PASS with line-ending warnings. No current Lighthouse run or production performance sample was taken. The 2026-10-24 Lighthouse desktop 100/100/100/100 and mobile 94/100/100/100 are historical local-server measurements.

Visual review used the local 1440px and 390px homepage captures in `artifacts/t001/`. Both show the established dark developer-first hierarchy, clear primary action, and stacked mobile sections. This review is representative, not a full manual review of every route. Browser tests cover five entry routes, six Studio panels, seven widths from 320px to 1920px, keyboard interactions, axe checks, and JavaScript console/asset checks. Manual NVDA journeys (14) and VoiceOver remain NOT TESTED.

## Scorecard

| Area | Score / scope | Current evidence | Confirmed defect or gap | Unverified risk | Priority |
|---|---|---|---|---|---|
| Visual design | 8/10 prototype | Reviewed 1440px/390px homepage; consistent dark tokens, card hierarchy and primary action | No material defect confirmed in reviewed captures | Other routes lack fresh human visual review | P3 |
| Branding | 7/10 prototype | Distinct proof-of-work and requirement-coverage language; approved Phase P dark direction | Working name is hardcoded across static HTML/JS instead of brand config | Trademark, domain and logo clearance pending | P2 before production |
| User experience | 7/10 prototype | Builder, owner and member fixtures; clear simulated labels; form recovery and duplicate-link tests | Legal/privacy footer destinations are placeholder anchors | Real-user comprehension and friction untested | P1 before publishing |
| Navigation | 7/10 prototype | Five entry routes, mobile menu, Studio tabs and unknown-slug state exercised | Placeholder footer links lead back into the page | Full site map and real-account journeys untested | P2 |
| Desktop responsiveness | 8/10 prototype | Browser checks at 1024, 1440 and 1920px; reviewed desktop homepage | None confirmed | Large-screen content density on every panel not manually assessed | P3 |
| Mobile responsiveness | 8/10 prototype | Checks at 320, 360, 390 and 768px, including no horizontal page overflow and menu access | None confirmed | Physical-device touch/zoom behavior untested | P2 |
| Accessibility | 6/10, provisional prototype automation | axe/keyboard/focus tests pass; reduced-motion and dialog checks pass | Manual NVDA journeys and VoiceOver are still untested, so usability and conformance are unproven | Actual announcements, reading order and macOS keyboard behavior | P1 before deployment |
| Functional correctness | 7/10 fixture prototype | Local drafts, Explore filters, BuildTree linking/review, saves, gallery and reset covered | No real account, publish or data service exists | Multi-user and network failure behavior untested | P1 for production track |
| Cross-browser reliability | 8/10 prototype | 197 current passes across three engines; one documented WebKit skip | WebKit skip-link behavior not manually verified on macOS | Browser/OS combinations beyond this host | P2 |
| Performance | N/S current | Historical local Lighthouse only; 33 static assets verified | No current production bundle, p95 or deployed load measurement | Network, cache, server and mobile-device behavior | P2 before beta |
| SEO | 4/10 prototype | Static titles and descriptions on five pages | Detail/share metadata are generic; no Open Graph/Twitter tags, sitemap or robots files found | Search indexing policy and preview rendering on a deployed origin | P2 before publication |
| Code quality | 6/10 Phase P source | Small static files, automated syntax/TS checks and 12 spike tests | Detail pages use large inline template scripts; brand strings are duplicated | Maintainability as fixtures become dynamic | P2 |
| Architecture | 6/10 Phase P separation | Prototype is isolated; T-004 receiver lives under `spikes/`; planned packages exist | Product apps/core are skeletons; approved service/DTO/queue boundaries have no implementation | Production scaling and authorization architecture | P1 for production track |
| Security | N/S production; 6/10 isolated spike | State/PKCE, ownership, private filtering, HMAC, GET allowlist, timeout tests | Static detail links bypass the specified `/out/{linkId}` path; local receiver has no production controls by design | Live webhook, revocation, BOLA, persistence, secrets and CSP release gates | P1 before beta |
| GitHub integration | 6/10 T-004 spike | Real App identity and Metadata permission checked today; one selected personal installation visible; earlier real OAuth and metadata preview recorded | Automatic install callback returned `state_invalid`; no successful D-037 handoff | Live revocation/webhook and production token/session behavior | P1 for T-004 closure |
| Data integrity | 6/10 fixture | Local state versioning, reset and duplicate-link prevention tested | Browser storage is local demonstration state; no transaction or cross-user uniqueness | Concurrent writes and durable restore | P1 for production track |
| Testing | 8/10 Phase P | Current browser suite, 12 spike tests, publication verification | No production service, security matrix or CI pipeline found | Manual AT, provider lifecycle and deployment tests | P1 before beta |
| Error handling | 6/10 prototype/spike | Invalid slug, form validation, provider 503 and timeout fail-closed paths tested | User-facing recovery for automatic install state failure is only a generic 400 response | Rate limits, partial failures and live outage flows | P2 |
| Privacy | 5/10 prototype | Fixtures disclose local-only state; spike does not persist user tokens/private repo metadata | Privacy footer is a placeholder; no real notice/retention implementation | Production deletion, export, logging and consent | P1 before public use |
| Moderation | 4/10 fixture | Admin controls are visibly a simulation | No server-side enforcement, audit chain or legal case handling | Abuse, appeal and operational clocks | P1 for production track |
| Operational readiness | N/S production | Vercel preview has SSO protection; latest listed deployment is older SHA `7b33eb4` | No production app, CI/security suite, jobs, backups or restore drill found | Deploy SHA, monitoring, rollback and recovery | P1 before beta |
| Production readiness | N/S; **not ready** | M0/M1/M2 all NOT PASSED; only Phase P candidate exists | Required production system is unbuilt | Founder validation, legal, security, manual accessibility and operational gates | P1 gate |

## Ranked findings

- **P0:** No P0 was confirmed in the local fixture/spike. This is not a claim of production safety.
- **P1 / T-004 blocker:** Automatic installation handoff returned `state_invalid` after GitHub reauthentication. Expiry is plausible but unproven. Preserve fail-closed handling; repeat only with a controlled fresh installation or obtain a founder decision on the separate Setup URL approach. D-037 remains NEEDS-SPIKE.
- **P1 / deployment blocker:** All 14 NVDA journeys and VoiceOver are NOT TESTED. Automated axe and keyboard passes do not satisfy the founder's manual acceptance condition.
- **P1 / deployment blocker:** Terms, Privacy, grievance and security footer links in the static prototype are placeholder anchors. Publish genuine approved destinations before any public use.
- **P1 / production boundary:** No server-backed identity, authorization, data, moderation, snapshots, audit, queue or restore path exists. This is future milestone work, not a failed Phase P task.
- **P2 / prototype-to-production defect:** `problem.html` embeds a direct demo URL in an anchor and `project.html` embeds a direct GitHub URL. These do not enforce the production `/out/{linkId}` policy; do not reuse them as production rendering.
- **P2 / T-004 hygiene:** GitHub shows two App key pairs, while the report records only one in active use. The unused extra pair needs founder-reviewed revocation; no key was revoked in this evaluation.
- **P2 / SEO:** Static detail pages lack per-item share metadata and no sitemap/robots/share-image route exists.
- **P2 / maintainability:** Static pages hardcode the working brand and render fixture detail templates in inline scripts. Keep the prototype isolated when production work starts.

## GitHub, preview and milestone boundary

Current read-only GitHub UI on 2026-10-28: `Solvynk Dev` (`solvynk-dev`, App ID `5465064`, Client ID `Iv23liMoxSkNLblBYBdl`) is owned by `Sachinkanna07`; callback is `http://app.localhost:3000/auth/github/callback`; wildcard matching off; automatic OAuth during installation on; Device Flow off; Setup URL disabled; webhook inactive. Optional features show expiring user-to-server tokens enabled. Permissions page shows repository Metadata read-only as the one selected repository permission; installation settings show **Only select repositories**, with only `Sachinkanna07/solvynk` selected. The App JWT check also returned Metadata: read only. Installation availability beyond the current owner's settings was not independently proved by this inspection.

Local receiver was started on `127.0.0.1:3000`: `/health` returned 200 through `app.localhost` loopback resolution and a callback without state returned 400. It was stopped after verification. The 2026-10-27 live sign-in, fresh `/user/installations` ownership check and one public metadata preview are prior observed evidence in `spikes/github-app/REPORT.md`; they were not rerun today. Today no live user OAuth, webhook or revocation was attempted.

GitHub PR #1 remains open and draft at `b1196388` against `preview/solvynk-dark-ui` `7b33eb4`. Its mobile/focus/local-demo changes are substantially represented in V4; the PR's `overflow-x: hidden` should not be ported because it can mask overflow. Vercel `solvynk-preview` remains SSO-protected; its latest READY deployment is from older `7b33eb4`, not the accepted V4 SHA. No push, merge, deployment or protection change was made.

T-000 is accepted; T-001 and T-002 are accepted with conditions; T-003 is pending validation authority and participant consent; T-004 remains in progress. M0/M1/M2 remain NOT PASSED. The next T-004 action is a tightly timed automatic handoff re-test under a founder-approved installation reset, or an explicit D-037 decision if the handoff cannot be verified. Do not use an unvalidated callback or installation ID as proof.
