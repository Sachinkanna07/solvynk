# 06 — Security Invariants (release-blocking)

These rules outrank every other document.

Each invariant has:
- an ID,
- the rule,
- the threat it addresses (V-xx = audit vulnerability register),
- the test(s) that prove it (docs/09),
- the milestone by which it must hold.

**Honesty clause:** these controls *reduce* risk. They do not guarantee the absence of vulnerabilities. Snapshot tables, sanitisers and URL checks can still fail through bugs, misconfiguration or stale caches. That is why the detection tests (canary, purge, matrix) are release blockers, and why independent review is required before public launch.

## A. Authorization and data exposure

| ID | Invariant | Threat | Tests | By |
|---|---|---|---|---|
| SI-01 | Every service that reads non-public data or mutates anything calls `authorize(ctx, action, resource)` after loading the resource, inside `@app/core`. No authorization decision is made only in middleware/proxy, layouts, route segment config or client code. | V-01, V-41 (CVE-2025-29927 class) | T1, T2 | M1a |
| SI-02 | A resource the actor may not see returns **NotFound** with a response indistinguishable from a missing resource (same status, body shape, approximate timing). Forbidden is used only when the actor can see the resource but lacks the action (e.g. maintainer → delete). | V-01, V-06 | T2 (oracle check) | M1a |
| SI-03 | Public surfaces read only `public_*` snapshot tables or public DTO builders. This covers public pages, `/og`, `/badge`, search, feeds, sitemap, robots, email digests, notification payloads and the CSV export. Snapshot builders use explicit field allowlists (no spreads, no `select *`). Defence-in-depth, verified by the canary suite. | V-02, V-04 | T3 | M1b |
| SI-04 | DB rows/ORM objects never cross into client components, Server Action return values or JSON responses. Only DTOs do, and DTO types are distinct from DB types. An ESLint rule bans importing Drizzle table types in `apps/*`. | V-02 | T3, lint | M1a |
| SI-05 | Inputs are parsed with zod `.strict()`. Unknown keys → 422. Privileged fields change only via dedicated services: owner, state, trust_level, featured, official_state, roles, restricted, legal_hold, indexing_approved, slug. | V-03 | T4 | M1a |
| SI-06 | Unpublish, delete, restrict and repo-privatize remove or refresh every public artefact (snapshot row, CDN page, share image, badge, search document, sitemap entry) within 5 minutes. The purge job is verified by test. | V-04, V-19 | T3-purge, T7 | M1b |
| SI-07 | Data from private repositories is never persisted: names, descriptions, IDs and metadata. Installation repo lists are filtered in memory (`private === false && owner.id === boundUser.githubUserId`); only a count may be stored or shown. | V-05 | T3 (DB/log scan), T6 | M1b |
| SI-08 | Staff can view private user content only through break-glass. That requires a case ID and a justification of 20+ characters, writes a `break_glass_access` row, and shows a visible banner. | V-07 | T1, T12 | M1c |

## B. Identity, sessions, GitHub

| ID | Invariant | Threat | Tests | By |
|---|---|---|---|---|
| SI-09 | The OAuth sign-in uses single-use `state` (≤10 min, bound to a pre-session cookie) and PKCE S256. Code reuse, a state mismatch or an expired state → reject and write a security event. | V-09 | T5 | M1a |
| SI-10 | `returnTo` accepts only relative paths matching `^/(?!/)[A-Za-z0-9/_\-?=&.%]*$` and not starting with `//`, `/\` or containing a scheme. Otherwise redirect to `/`. | V-10 | T5 | M1a |
| SI-11 | GitHub user access and refresh tokens are never persisted, logged or sent to the client. `offline_access` is never requested. The OAuth code and token exist only in request memory. | V-11 | T3 (DB dump grep for `ghu_`/`ghr_`/`gho_`), log capture | M1a |
| SI-12 | An installation is bound to a user only after `GET /user/installations` with that user's fresh token contains the `installation_id`, and `account.type === 'User'`, and `account.id === user.githubUserId`. `installation_id` from any URL is untrusted. Org installations are marked `refused_org`. | V-08, V-16 | T6 | M1b |
| SI-13 | The GitHub App requests repository **Metadata: read** only. The app code contains no GitHub write calls. A CI test asserts the Octokit wrapper exposes only an allowlisted set of GET endpoints. | V-12 (blast radius) | T7-allowlist | M1b |
| SI-14 | Sessions use an opaque 256-bit random token. Only its HMAC is stored. Cookie is `__Host-session; HttpOnly; Secure; SameSite=Lax; Path=/`. The ID rotates at sign-in. Idle expiry 30 d, absolute 90 d. All sessions are revoked on `github_app_authorization.revoked` and on "sign out everywhere". | V-13 | T5, T7 | M1a |
| SI-15 | Step-up (fresh GitHub sign-in ≤`REAUTH_WINDOW_MIN`) is required for: account deletion, project transfer (both sides), unpublish-all, email change, and staff 2P approvals. Admin sessions additionally require a WebAuthn assertion at sign-in and every 12 h. | V-13, V-43 | T5, T12 | M1a / M1c |
| SI-16 | Identity is keyed on the numeric `github_user_id`. Displayed GitHub logins are refreshed at sign-in and by a weekly job. Account recovery (rebinding to a new GitHub ID) requires two staff approvals, a 7-day hold and notice to the old verified email. | V-14, V-15 | T12 | M1c |

## C. Content, links, uploads

| ID | Invariant | Threat | Tests | By |
|---|---|---|---|---|
| SI-17 | The secret scan runs on all user text at publish, update, comment and suggestion time. Patterns include GitHub tokens (`ghp_`, `gho_`, `ghu_`, `ghs_`, `ghr_`, `github_pat_`), AWS keys (`AKIA[0-9A-Z]{16}`), `sk-` style API keys, Slack tokens (`xox[abprs]-`), PEM private-key headers and generic high-entropy `key=…` assignments. A match blocks the action with an explanation (no echo of the full secret). | V-26 | T8-secrets | M1b |
| SI-18 | Markdown is rendered via remark → rehype → `rehype-sanitize` with a strict schema. No raw HTML. Link protocols are `https`/`mailto` only. Images only from `USERCONTENT_ORIGIN`. External links get `rel="noopener noreferrer nofollow ugc"` and are rewritten to `/out/{linkId}`. Rendering happens server-side; the stored `*_html` is re-sanitised on schema change. | V-21 | T8 (≥200 payloads) | M1b |
| SI-19 | CSP is nonce-based, with `frame-ancestors 'none'`, `object-src 'none'` and `base-uri 'none'`. No `unsafe-inline` scripts. The admin app has its own stricter CSP. | V-21, V-28 | T10 | M1a |
| SI-20 | Outbound URLs pass the URL policy (https, no IP-literal host, no non-default port, no userinfo, no shortener, no internal TLD, length ≤2,048). They are stored in `outbound_links` and checked with Web Risk. New links stay non-clickable until `safe`. The interstitial resolves only stored link IDs; there is no route accepting a raw URL. | V-22, V-23 | T8-links | M1b |
| SI-21 | The server never fetches user-supplied URLs (no unfurl, favicon or preview fetch). Any future outbound fetch must go through an egress allowlist with private-range blocking. | V-27 | Code search in CI (`fetch(` with non-constant URL in core → fail); T8 | M1b |
| SI-22 | Uploads are accepted only as JPEG/PNG/WebP by magic bytes, ≤8 MB, ≤25 MP, via presigned PUT with exact content-type and length limits. They are re-encoded server-side with sharp (metadata stripped), given random keys and served from `USERCONTENT_ORIGIN` with `X-Content-Type-Options: nosniff` and `Content-Disposition: inline; filename="image.webp"`. No SVG and no animated images in V1. | V-25 | T9 | M1b |
| SI-23 | Feed cards contain no external hrefs (demo buttons appear only on detail pages). Profile links and Markdown links also go through `/out`. | V-24 | T3-crawler (href audit) | M1b |

## D. Abuse and moderation

| ID | Invariant | Threat | Tests | By |
|---|---|---|---|---|
| SI-24 | Automatic hides happen only for: Web Risk `unsafe`; secret-pattern match; `ncii` reports (1 report → hide pending review); `malicious_link` / `secret_exposed` / `private_info` reports at threshold (1 trusted or 2 distinct TL1+ reporters); exact-duplicate spam. Each writes `moderation_actions` with a `rule_id`. All other outcomes need a human decision. | V-30, V-36 | T11 | M1c |
| SI-25 | Limits are account-based. IP-based limits apply only to anonymous endpoints and are generous enough for campus NAT (sign-in start: 10/min/IP; anonymous report form: 10/h/IP). | V-29, V-34 | T11 (campus case) | M1a |
| SI-26 | Permanent removal, account suspension, recovery rebind and staff-role grants require a second, different senior staff approver. A single staff member cannot approve their own request. | V-43, V-07 | T12 | M1c |
| SI-27 | `audit_events` and `case_events` are append-only at the DB-grant level (no UPDATE/DELETE for app roles). They are hash-chained (`prev_hash`, `row_hash`) and exported daily. | V-43 | T12 (grant test) | M1c |
| SI-28 | Emergency switches are enforced in services (not just hidden in the UI): signups, publishing, linking, comments, suggestions, outbound_links, webhook_processing, emails, read_only. A toggle takes effect within 10 s and is audit-logged. | V-35 ops | T14 (switch drill) | M1c |

## E. Integrations, operations, supply chain

| ID | Invariant | Threat | Tests | By |
|---|---|---|---|---|
| SI-29 | The webhook handler verifies `X-Hub-Signature-256` (HMAC-SHA256 over the raw bytes) with a timing-safe comparison against the current secret (and the previous one during a ≤1 h rotation window) **before** JSON parsing. Missing or invalid → 401. `X-GitHub-Delivery` is unique in `webhook_deliveries`, so duplicates → 200 no-op. Handlers re-fetch state from the API. Hourly redelivery and nightly reconciliation jobs exist. | V-17, V-18, V-19 | T7 | M1b |
| SI-30 | Secrets come only from the environment / secret store and are validated at boot. Gitleaks (or equivalent) runs in CI. Logs and Sentry pass through the redaction list (docs/03 §6.4). Only allowlisted `NEXT_PUBLIC_*` variables exist. | V-12 | CI, T3 (log capture) | M1a |
| SI-31 | Dependencies are pinned via lockfile. CI fails on known critical vulnerabilities (`pnpm audit --audit-level=critical`) unless there is a documented exception. Next.js stays on the latest patched 16.x (≥16.4.1). Critical framework advisories are patched within 48 h. | V-41, V-42 | CI | M1a (ongoing) |
| SI-32 | The browser contacts only our origins and GitHub's OAuth/install pages (`connect-src 'self'`). No browser SDK of a third-party backend (DB, storage API, analytics). Media is served from our user-content domain. | V-40 | T10 (CSP), T13 (network audit in Playwright) | M1a |
| SI-33 | Backups: nightly encrypted logical dump to a separate bucket, plus provider backups. A restore drill must pass before beta and every quarter after. | V-39 | T14 | M1c |
| SI-34 | No GitHub, Web Risk or email API call happens during a public page request. Public pages render from the DB only. | V-20, availability | T13 (GitHub mocked 503) | M1b |

## Mapping: audit vulnerability register → invariants

| V-ID | Invariant(s) | | V-ID | Invariant(s) |
|---|---|---|---|---|
| V-01 BOLA | SI-01, SI-02 | | V-24 Feed amplification | SI-23 |
| V-02 BOPLA | SI-03, SI-04 | | V-25 Uploads | SI-22 |
| V-03 Mass assignment | SI-05 | | V-26 Secrets in content | SI-17 |
| V-04 Stale public copies | SI-03, SI-06 | | V-27 SSRF | SI-21 |
| V-05 Private repo data | SI-07 | | V-28 CSRF/clickjacking | SI-19, docs/05 §6 Origin check |
| V-06 Existence oracle | SI-02 | | V-29 Link spam | SI-25, F-09 limits |
| V-07 Insider browsing | SI-08 | | V-30 Brigading | SI-24 |
| V-08 Setup-URL spoof | SI-12 | | V-31 Impersonation | F-01 reserved handles, identity line |
| V-09 Login CSRF | SI-09 | | V-32 Harassment | F-16, F-19 |
| V-10 Open redirect | SI-10 | | V-33 Notification abuse | F-17 caps |
| V-11 Stored tokens | SI-11 | | V-34 Engagement manipulation | SI-25, no like-ranking |
| V-12 App key leak | SI-13, SI-30 | | V-35/36 Legal clocks | SI-24, SI-28, docs/12 |
| V-13 Sessions | SI-14, SI-15 | | V-37 CERT-In / logs | docs/12, D-019 |
| V-14 Recovery social engineering | SI-16, SI-26 | | V-38 Under-18 | D-013, F-01 |
| V-15 Username recycling | SI-16 | | V-39 Data loss | SI-33 |
| V-16 Repo misattribution | SI-12, partial UQ on repo_links | | V-40 ISP blocking | SI-32 |
| V-17/18/19 Webhooks | SI-29 | | V-41 Framework CVEs | SI-01, SI-31 |
| V-20 API exhaustion | SI-34, docs/07 §7 | | V-42 Supply chain | SI-31 |
| V-21 XSS | SI-18, SI-19 | | V-43 Admin takeover | SI-15, SI-26, SI-27, D-030 |
| V-22/23 Phishing / open redirect | SI-20 | | V-44 Cost blow-up | upload quotas, budget alarms |
| | | | V-45 Brand conflict | D-002 |
