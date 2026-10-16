# 03 — Architecture

## 1. Topology

```
Browser ──https──▶ Cloudflare (DNS · CDN · WAF · optional Turnstile)
   │                     │
   │                     ├──▶ apps/web     (APP_ORIGIN)        Next.js 16, Node runtime
   │                     ├──▶ apps/admin   (ADMIN_ORIGIN)      Next.js 16, behind Cloudflare Access
   │                     └──▶ R2 public bucket (USERCONTENT_ORIGIN, cookieless, images only)
   │
   └── GitHub OAuth / App installation pages (github.com) ── redirect back to APP_ORIGIN

apps/web, apps/admin ──SQL (TLS, pooled)──▶ PostgreSQL (Mumbai)
apps/worker (long-lived Node) ──SQL──▶ PostgreSQL  (pg-boss queue lives in the same DB, schema "pgboss")
apps/worker ──▶ GitHub REST API (installation tokens) · Google Web Risk · Email provider · R2 · Cloudflare purge API
Observability: Sentry (scrubbed) · uptime checks · structured logs → 180-day store (India primary, D-019)
```

The browser never talks to the database host, the storage API (except signed PUT uploads to the R2 upload endpoint fronted on our domain, see §6.3), Web Risk, the email provider or Sentry ingestion **directly**. Sentry browser SDK is disabled in V1. Client errors are posted to our own `/api/client-errors` endpoint and forwarded server-side.

## 2. Repository layout

```
.
├─ AGENTS.md
├─ README.md                      (created by T-000; short; points to README_START_HERE.md)
├─ package.json / pnpm-workspace.yaml / .nvmrc (24) / .npmrc (engine-strict=true)
├─ apps/
│  ├─ web/
│  │  ├─ AGENTS.md
│  │  ├─ app/                     routes (see docs/05)
│  │  ├─ actions/                 server actions (thin; call @app/core)
│  │  ├─ components/              app-specific composites (use @app/ui)
│  │  ├─ messages/en.json         UI strings
│  │  └─ next.config.ts           security headers, images config (no remote patterns except USERCONTENT_ORIGIN)
│  ├─ admin/                      same structure; AGENTS.md
│  ├─ worker/
│  │  ├─ AGENTS.md
│  │  └─ src/index.ts             registers job handlers from @app/core/jobs, schedules cron jobs
│  └─ prototype/                  static export; fixtures in /fixtures; imports @app/ui only
├─ packages/
│  ├─ core/
│  │  ├─ AGENTS.md
│  │  └─ src/
│  │     ├─ index.ts              PUBLIC EXPORTS ONLY (services, types, DTO types, errors, ctx helpers)
│  │     ├─ ctx.ts                Ctx type + builders (guest/member/staff/system)
│  │     ├─ errors.ts
│  │     ├─ config.ts             zod-validated env loading (server-only)
│  │     ├─ brand.ts
│  │     ├─ db/                   INTERNAL: drizzle schema/*.ts, client.ts, migrations/
│  │     ├─ authz/                policy.ts (actions × roles), authorize.ts, trust.ts
│  │     ├─ dto/                  public.ts, owner.ts, staff.ts
│  │     ├─ validation/           zod schemas per service input
│  │     ├─ services/             accounts, sessions, invites, github, projects, publishing, problems,
│  │     │                        solutions, intents, updates, social, comments, suggestions, security-reports,
│  │     │                        notifications, email, stats, search, feed, reports, cases, moderation,
│  │     │                        legal, privacy, transfers, switches, audit, media, links, staff, broadcasts
│  │     ├─ integrations/         github/, webrisk/, storage/, email/, cdn/  (each with interface + live + stub)
│  │     ├─ security/             markdown.ts, url-policy.ts, secret-scan.ts, rate-limit.ts, crypto.ts, redact.ts
│  │     ├─ jobs/                 job names, payload schemas, handlers
│  │     └─ routes/registry.ts    every action/route with its authz action + resource factory (for BOLA matrix)
│  ├─ ui/                         tokens.css, components/*, icons.ts (lucide re-exports), fonts/
│  ├─ testing/                    factories.ts, canary.ts, github-fixtures/*.json, bola-matrix.ts, crawler.ts
│  └─ config/                     eslint/, tsconfig/, tailwind/
├─ spikes/github-app/             scripts + REPORT.md (T-004)
├─ tools/concierge/               static page generator (T-003)
├─ content/legal/                 counsel-supplied markdown (placeholders first)
├─ infra/
│  ├─ docker-compose.yml          postgres:16, mailpit, minio (S3-compatible for dev)
│  ├─ env/.env.example            every variable from §5 with dummy values
│  └─ backup/                     pg_dump → encrypted → bucket scripts; restore checklist
└─ .github/workflows/ci.yml       lint, typecheck, unit/integration (service container postgres), security suites, e2e (on main), gitleaks, audit
```

## 3. Module rules

1. **Layering inside `@app/core`:** `services` → (`authz`, `dto`, `validation`, `security`, `integrations`) → `db`. `db` is imported only by services, jobs, authz resource loaders and the testing package.
2. **Apps** import only from `@app/core` (index) and `@app/ui`. ESLint `no-restricted-imports` blocks `@app/core/src/*` deep imports and `drizzle-orm` in apps.
3. **Every service function** has the shape:
   ```
   export async function publishProject(ctx: Ctx, rawInput: unknown): Promise<PublishResult>
     1. const input = PublishProjectInput.parse(rawInput)        // zod .strict()
     2. await assertSwitch(ctx, 'publishing')
     3. const project = await loadProjectForUpdate(ctx, input.projectId)   // NotFound if missing
     4. await authorize(ctx, 'project.publish', project)                    // NotFound if not visible; Forbidden if visible but not allowed
     5. await rateLimit(ctx, 'project.publish')
     6. ...domain logic in a transaction...
     7. await audit(ctx, 'project.published', project, { before, after })
     8. await enqueue(ctx, 'snapshot.rebuild', { projectId })
     9. return toOwnerProjectDTO(updated)
   ```
   (Illustrative shape, not code to copy verbatim.)
4. **`Ctx`** = `{ actor, requestId, now, db/tx handle, ip (hashed), userAgentSummary }` where `actor` is one of `Guest`, `Member{ userId, trustLevel, githubUserId, state }`, `Staff{ userId, role, caseId? }`, `System{ job }`.
5. **Errors** map to HTTP: NotFound→404, Forbidden→403 (owner-scope only), Validation→422 with field errors, RateLimit→429 with `Retry-After`, Conflict→409, SwitchOff→503 with a user-safe message. Unexpected errors → 500 with an error ID; details only in logs.

## 4. Key request flows

**Sign-in (Flow A)**: `/auth/github/start?returnTo=/p/x` → create `oauth_states` row (purpose signin, PKCE verifier encrypted, returnTo validated) → redirect to GitHub authorize → `/auth/github/callback?code&state` → consume state (single use, ≤10 min, same pre-session cookie) → exchange code with `code_verifier` → `GET /user` → upsert user by numeric ID (invite check if new) → create session → discard token → redirect to returnTo or onboarding.

**Connect repo (Flow B)**: `/github/connect` (explainer) → create `oauth_states` (purpose install, bound to session user) → redirect `https://github.com/apps/{slug}/installations/new?state=…` → GitHub → `/auth/github/callback?code&installation_id&setup_action&state` → consume state → exchange code (no PKCE on install-originated codes; confirm in S-03) → `GET /user/installations` → find installation; require `account.type == 'User'` and `account.id == user.githubUserId` → upsert `github_installations` (bound) → discard token → enqueue `github.refreshEligibleRepos` → redirect to `/projects/new?step=source`.

**Publish**: owner action → service validates + secret scan + attestations → state `in_review` (beta TL0/TL1) or `published` → job `snapshot.rebuild` writes `public_projects` from an explicit field allowlist → jobs `og.render`, `search.reindex`, `sitemap.mark`, `cdn.purge`.

**Unpublish/delete/restrict**: service → job `snapshot.remove` (delete row) → `cdn.purge` (page, og, badge, media variants if deleted) → `search.reindex`. Completion checked by test (AC-04.1).

**Solution link**: service validates coverage IDs against the problem's current revision → limits/trust → state `queued` or `visible` → snapshot of both sides refreshed (counts) → notifications batched to problem owners and followers.

**Webhook**: `POST /api/github/webhook` reads raw body → verify signature (current or previous secret during rotation) → insert `webhook_deliveries` (unique GUID; duplicate → 200 no-op) → enqueue `github.webhook` → 202 in <1 s. Job re-fetches authoritative state via the API and applies the state machine (docs/07 §6).

## 5. Environment variables (server-only unless marked PUBLIC)

| Variable | Example (dev) | Notes |
|---|---|---|
| `APP_ENV` | `local` | `local`/`staging`/`production` |
| `APP_ORIGIN` | `http://app.localhost:3000` | PUBLIC (as `NEXT_PUBLIC_APP_ORIGIN`) |
| `ADMIN_ORIGIN` | `http://admin.localhost:3001` | |
| `USERCONTENT_ORIGIN` | `http://media.localhost:9000/bs-public` | PUBLIC; prod must be a different registrable domain |
| `BRAND_NAME` / `BRAND_DOMAIN` | `BuildSocial (working name)` / `localhost` | PUBLIC |
| `DATABASE_URL` | `postgres://app:app@localhost:5432/app` | app role (no DDL) |
| `DATABASE_URL_MIGRATOR` | `postgres://migrator:…` | DDL role, CI/deploy only |
| `DATABASE_URL_ADMIN` | `postgres://admin_app:…` | admin app role |
| `SESSION_TOKEN_PEPPER` | 32+ random bytes (base64) | HMAC pepper for session token hashing |
| `APP_ENCRYPTION_KEYS` | `k2:base64,k1:base64` | AES-256-GCM keys, first = active; for PKCE verifiers, security reports, intake contacts |
| `GITHUB_APP_ID`, `GITHUB_APP_SLUG` | | per environment App |
| `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET` | | |
| `GITHUB_APP_PRIVATE_KEY_B64` | base64 PEM | never logged |
| `GITHUB_WEBHOOK_SECRET`, `GITHUB_WEBHOOK_SECRET_PREVIOUS` | | previous optional (rotation ≤1 h) |
| `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | minio in dev | |
| `S3_BUCKET_PUBLIC`, `S3_BUCKET_UPLOADS`, `S3_BUCKET_EVIDENCE`, `S3_BUCKET_EXPORTS`, `S3_BUCKET_BACKUPS` | | evidence/exports/backups private |
| `EMAIL_PROVIDER`, `EMAIL_FROM`, `SMTP_URL`, `RESEND_API_KEY`, `SES_REGION` | `smtp`, Mailpit | |
| `WEBRISK_MODE`, `WEBRISK_API_KEY` | `stub` | |
| `CDN_PROVIDER`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN` | `none` in dev | purge only |
| `SENTRY_DSN`, `SENTRY_ENVIRONMENT` | empty in dev | server only |
| `BETA_MODE` | `invite_only` | |
| `INDEXING_ENABLED` | `false` | |
| `MIN_AGE` | `18` | D-013 |
| `REAUTH_WINDOW_MIN` | `10` | |
| `GRIEVANCE_OFFICER_NAME`, `GRIEVANCE_OFFICER_EMAIL`, `LEGAL_ORDERS_EMAIL`, `SECURITY_EMAIL` | placeholders | D-042 |
| `MONTHLY_BUDGET_USD` | `60` | budget alarms |

`packages/core/src/config.ts` validates all variables with zod at startup and refuses to boot on missing/invalid values (except optional ones listed as such).

## 6. Cross-cutting implementation rules

### 6.1 Caching
- Public snapshot pages: `Cache-Control: public, s-maxage=300, stale-while-revalidate=60`; versioned by snapshot `version`; purged on change.
- Anything with a session or owner data: `private, no-store`. Pages that render differently for members must not be CDN-cached unless the variant is guest-only (`Vary: Cookie` is insufficient — use separate guest rendering or no CDN cache).
- `/og/*` and `/badge/*`: `public, max-age=3600`; purged on change.

### 6.2 Security headers (set in `next.config.ts` and admin equivalent)
`Content-Security-Policy` (nonce-based scripts; `default-src 'self'`; `img-src 'self' {USERCONTENT_ORIGIN} data:`; `connect-src 'self'`; `frame-ancestors 'none'`; `form-action 'self' https://github.com`; `base-uri 'none'`; `object-src 'none'`), `Strict-Transport-Security` (prod), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Cross-Origin-Opener-Policy: same-origin`.

### 6.3 Uploads
Client requests an upload slot (service checks quota, mime, size) → server returns a presigned PUT to `S3_BUCKET_UPLOADS` with exact content-length range and content-type → client uploads → client calls `media.complete` → job `media.process` validates magic bytes and pixel count with sharp, re-encodes to WebP variants, strips metadata, writes to `S3_BUCKET_PUBLIC` under a random key **only when the owning item is public** (draft media stays in uploads bucket and is served to owners through a short-lived signed GET) → deletes the original. In dev the presigned endpoint is MinIO; in prod R2 (CORS restricted to `APP_ORIGIN`).

### 6.4 Logging and redaction
Structured JSON (`level, time, requestId, actorId?, route, msg, …`). Redact keys matching: `authorization, cookie, set-cookie, token, access_token, refresh_token, code, code_verifier, client_secret, private_key, password, secret, email, body, x-hub-signature-256`. Never log request bodies or GitHub API responses wholesale. Sentry `beforeSend` applies the same redaction and drops request bodies and cookies.

### 6.5 Time and clocks
Servers use NTP-synchronised hosts (provider default; document in ops). Store UTC; display Asia/Kolkata by default with the user's locale formatting.

## 7. Environments

| | Local | Staging | Production |
|---|---|---|---|
| GitHub App | "BS Dev" (callback `http://app.localhost:3000/auth/github/callback`; webhook via a tunnel such as smee.io for dev only) | "BS Staging" | "BS" (prod) |
| Data | docker Postgres, seeded fixtures | separate DB, synthetic seed, **no prod data** | real |
| Access | — | Cloudflare Access on all origins, `noindex` | public web (beta: invite-only) |
| Email | Mailpit | provider sandbox / allowlist | provider |
| Web Risk | stub | live (low volume) | live |
| Secrets | `.env` (git-ignored) | host secret store | host secret store; two-person access |

Deploy pipeline: PR → CI (lint, typecheck, unit, integration, security suites, axe on prototype/web) → preview → staging (migrations, e2e, ZAP baseline) → production (manual approval, automatic pre-migration backup, expand/contract migrations, rollback = previous build).
