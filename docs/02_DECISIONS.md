# 02 — Decision Log (ADR-lite)

**Status values**
- **ACCEPTED** — the founder accepted it in the V2 review.
- **PROVISIONAL** — the default lets Codex proceed; the founder may change it.
- **NEEDS-FOUNDER** — the founder must decide before the stated gate.
- **NEEDS-COUNSEL** — legal review is required; the code implements it as configuration.
- **NEEDS-SPIKE** — to be confirmed by T-004.

Codex: never change a decision. If one seems wrong, add an "Open question" in `docs/STATUS.md`.

| ID | Decision | Status | Rationale / consequence | Revisit when |
|---|---|---|---|---|
| D-001 | **Product wedge V2.** Real problems with requirements + builders with existing incentives + owner review + permanent project pages. India-first; Tamil Nadu pilot. | ACCEPTED | Avoids the "empty idea board" failure mode | Gate M0 evidence |
| D-002 | **Working name.** "BuildSocial" is a placeholder. Brand name, domain and logo come from config (`BRAND_NAME`, `BRAND_DOMAIN`); there is no wordmark in code assets. Dev domains are `*.localhost`; staging and prod domains are TBD. | NEEDS-COUNSEL (clearance) / NEEDS-FOUNDER (final name) | Same-name entities exist (buildsocial.nl; buildsocial.co pending clearance review) | Before any brand spend; before M2 |
| D-003 | **Public personal repos only, plus manual private-source projects.** No private repo data is collected. | ACCEPTED | Removes the top security and legal risk for V1 | ≥30% of creators request it **and** the V1.1 security gate passes |
| D-004 | **No organization-repo import in V1.** Org installations are refused server-side. | ACCEPTED | Repo access ≠ publication authority | ≥5 org requests + publisher-approval design |
| D-005 | **No stored GitHub user tokens.** Tokens are used in-request, then discarded. | ACCEPTED (verify) | Smaller breach blast radius | Never without a security review |
| D-006 | **Public snapshot tables** (`public_projects`, `public_problems`) back all public surfaces. Defence-in-depth, not a guarantee; canary tests are release blockers. | ACCEPTED | Structural separation of draft and public data | — |
| D-007 | **Relationship model.** Solves (project→problem, with requirement coverage), Featured flag, Owner review, Official (two-sided), Related (project↔project), Credits text. No typed "Derived from" / "Inspired by". | ACCEPTED | An evaluated solution map instead of a link list | Matrix proves insufficient |
| D-008 | **Optional build windows + outcome posts.** | ACCEPTED | Rhythm, deadlines and return visits | — |
| D-009 | **Staff-assisted problem posting** for owners without GitHub, with recorded consent and an "on behalf of" label. | ACCEPTED (pilot) | Unlocks the best supply of problems | Operator load >5 h/week → email accounts (LATER) |
| D-010 | **Home = transparent sections** (Following · Open challenges · New · Staff picks). No personalised ranking. | ACCEPTED | Honest, cheap, explainable | ≥2,000 weekly active users |
| D-011 | **Trust levels TL0–TL3 + link queue + account-based limits.** IP is a weak signal (campus NAT). | ACCEPTED (test fairness in beta) | Spam control without AI | Beta false-positive rate >5% |
| D-012 | **Invite-only, pre-moderated beta; `noindex` by default.** | ACCEPTED | Contains abuse and legal exposure | Gate M2 |
| D-013 | **Minimum age 18** (self-declaration + Terms), via config `MIN_AGE`. | PROVISIONAL / NEEDS-COUNSEL | DPDP children's provisions commence 13 May 2027 | Counsel advice; demand from under-18 students |
| D-014 | **No embeds, iframes, raw HTML or SVG uploads.** Video links open externally. | ACCEPTED | Removes XSS, clickjacking and tracking vectors | Sandboxed allowlist review |
| D-015 | **Operations staffing.** At least 2 named on-call people before public content; exact SLAs and legal timelines are config set with counsel. | NEEDS-FOUNDER / NEEDS-COUNSEL | 3 h / 2 h legal windows per the 2026 IT Rules amendment (to be confirmed by counsel) | Before Gate M1 |
| D-016 | **Stack:** Node 24 LTS; pnpm; TypeScript strict; Next.js 16 (latest patched, ≥16.4.1); PostgreSQL 16+ (`pg_trgm`, `citext`); Drizzle ORM + drizzle-kit; pg-boss; zod; Tailwind v4 + CSS variables; Radix UI primitives; lucide-react; Octokit (`@octokit/core`, `@octokit/rest`, `@octokit/auth-app`, `@octokit/webhooks`); sharp; remark/rehype + `rehype-sanitize`; AWS S3 SDK v3 (R2-compatible); Vitest; Playwright + axe; Sentry. | PROVISIONAL | Mainstream, single language, no Redis or microservices | Node 26 LTS move after 28 Oct 2026 once sharp is confirmed |
| D-017 | **Auth = custom GitHub App OAuth web flow** (PKCE S256 + single-use state) with DB-backed opaque sessions. **No Auth.js / NextAuth** (its DB adapter stores tokens by default and the install-verification flow is custom anyway). | PROVISIONAL | Full control of token handling | — |
| D-018 | **Hosting.** "Option A" target: web on a managed Next.js host with commercial use permitted (e.g. Vercel Pro; Mumbai functions region if available); managed Postgres in Mumbai (Data API / REST features disabled, server-side connections only); Cloudflare DNS/CDN/WAF; Cloudflare R2 for media; worker as a long-lived Node container on any host. **Code must stay provider-agnostic** (`DATABASE_URL`, S3-compatible storage, email adapter). | NEEDS-FOUNDER (accounts, final providers) | Low-ops beta; avoid non-commercial free tiers | 1,000 MAU or cost review |
| D-019 | **Region.** DB and primary logs in India (Mumbai) where available. | PROVISIONAL / NEEDS-COUNSEL (CERT-In log location) | CERT-In 180-day logs "within Indian jurisdiction" | Counsel advice |
| D-020 | **Email.** Optional, verified, double opt-in. Provider adapter: `console` (dev), `smtp` (Mailpit in dev), `resend` or `ses` (prod). | PROVISIONAL | Avoid requesting the GitHub email permission | — |
| D-021 | **Analytics** = first-party Postgres counters only (creator stats + product metrics). No third-party trackers or cookies for analytics. | PROVISIONAL | Privacy, simplicity | — |
| D-022 | **Search** = Postgres full-text + `pg_trgm` over public snapshot tables. | PROVISIONAL | No extra service | >100k items or p95 >300 ms |
| D-023 | **IDs.** UUIDv7 primary keys; slugs assigned at first publish (`title-slug` + 6-char suffix if needed); no sequential IDs exposed. | PROVISIONAL | Reduces enumeration; stable URLs | — |
| D-024 | **Rate limiting** = Postgres fixed-window counters keyed per account (plus per-IP for anonymous endpoints). | PROVISIONAL | No Redis | Write contention observed |
| D-025 | **URL safety** = Google Web Risk Lookup API (commercial terms) behind an adapter; `WEBRISK_MODE=stub` in dev/test. Fail closed for **new** links (stay `pending`, not clickable); existing safe links keep working if Web Risk is down. | PROVISIONAL / NEEDS-FOUNDER (GCP account) | Safe Browsing API is non-commercial only | — |
| D-026 | **Markdown** = CommonMark + GFM (tables, task lists, strikethrough, autolinks). No raw HTML. Links `https:`/`mailto:` only. Images only from `USERCONTENT_ORIGIN`. Headings shifted to start at h3 inside content. | ACCEPTED | XSS and tracking prevention | — |
| D-027 | **Media.** Input JPEG/PNG/WebP ≤8 MB and ≤25 MP. Output WebP at widths 480/960/1600 (+ 1200×630 share images as PNG). EXIF and metadata stripped. Random keys. Served from `USERCONTENT_ORIGIN` (separate registrable domain in prod, cookieless). | ACCEPTED | Upload safety, data cost | — |
| D-028 | **i18n.** English message catalog from day 1 (`apps/web/messages/en.json`); content in any language; Noto Sans Tamil/Devanagari fallbacks. | PROVISIONAL | Tamil/Hindi UI later | Beta demand |
| D-029 | **Theme.** Dark default; theme-agnostic token names; light theme LATER. | ACCEPTED | — | V1.1 |
| D-030 | **Admin = separate Next.js app on its own origin**, behind Cloudflare Access (infra) + GitHub sign-in + WebAuthn passkey step-up (`@simplewebauthn/server` + `/browser`). | PROVISIONAL / NEEDS-FOUNDER (Access setup) | Isolation of privileged functions | — |
| D-031 | **Codebase licence.** Proprietary, all rights reserved (founder). Dependencies must be permissively licensed; fonts OFL. | NEEDS-FOUNDER | IP clarity for incubation and incorporation | Incorporation |
| D-032 | **Unlisted problems** for classes (link-only, `noindex`). | PROVISIONAL | Faculty use case | — |
| D-033 | **Deleted accounts.** Comments are anonymised to "Deleted user" (content kept) unless the user chooses "delete my comments too"; projects and problems are deleted. | PROVISIONAL / NEEDS-COUNSEL | Conversation integrity vs erasure | Counsel advice |
| D-034 | **Retention values are config** (`docs/12` §Retention). Defaults: security log 12 months; app logs 180 days; moderation evidence ≥180 days after removal; notifications 90 days; email outbox 30 days; soft-delete grace 14 days; backups 30 daily + 12 monthly. | PROVISIONAL / NEEDS-COUNSEL | IT Rules / CERT-In / DPDP alignment | Counsel advice |
| D-035 | **GitHub sync.** Webhooks enqueue jobs; payloads are hints (re-fetch state); hourly redelivery of failed deliveries; nightly reconciliation; weekly identity refresh. | ACCEPTED | GitHub doesn't auto-redeliver; 3-day redelivery window | — |
| D-036 | **Next.js usage rules.** Server Actions and Route Handlers are thin adapters that call `@app/core` services. No authorization in middleware/proxy. Webhooks, OAuth, `/out`, `/og`, `/badge` and the media upload callback are Route Handlers. | ACCEPTED | Framework CVE history; public-endpoint semantics | — |
| D-037 | **GitHub install flow.** "Request user authorization (OAuth) during installation" is **enabled**; one callback route handles both sign-in (with PKCE) and install (`installation_id` present). The Setup URL is unused. | NEEDS-SPIKE (S-03, S-04) | GitHub redirects installs to the callback URL in this mode | Spike result |
| D-038 | **README import.** Default: no README import (the creator pastes an excerpt). Alternative only if spike S-06 shows a safe Metadata-only path. | NEEDS-SPIKE | Avoid requesting Contents: read | Spike result |
| D-039 | **Problem categories (initial).** Agriculture, Education, Health, Civic & government, Accessibility, Environment & climate, Finance & commerce, Developer tools, Data & AI infrastructure, Languages & localisation, Transport & mobility, Other. | PROVISIONAL | Pilot-relevant | After pilot |
| D-040 | **Project categories** = the same list + "Personal / learning project". | PROVISIONAL | Lets learning projects exist without being treated as spam | — |
| D-041 | **Pre-build track allowed before Gate M0:** T-000 to T-004 only. | ACCEPTED | Supports validation without locking unvalidated decisions into production code | — |
| D-042 | **Grievance officer and legal contacts** live in config (`GRIEVANCE_OFFICER_NAME`, `…_EMAIL`, `LEGAL_ORDERS_EMAIL`, `SECURITY_EMAIL`), rendered on legal pages. | NEEDS-FOUNDER / NEEDS-COUNSEL | Statutory display requirement | Before Gate M1 |

## D-016 appendix — dependency register (Codex appends; founder reviews)
| Package | Purpose | License | Added in task | Notes |
|---|---|---|---|---|
| | | | | |
