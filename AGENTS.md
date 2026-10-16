# AGENTS.md — BuildSocial V2 (working name)

Product: a developer-first web platform. Problem owners publish real problems with numbered requirements and optional build windows. Builders link GitHub-backed or manually described projects and claim which requirements they cover. Owners review and feature solutions. Every project gets a permanent, shareable page. India-first, invite-only beta.

## 0. Before every task (mandatory)
1. Read `docs/STATUS.md` (phase, gates, open questions).
2. Read your task in `docs/10_BACKLOG.md` and every file listed under its "Read first".
3. If the task belongs to a phase whose gate is not `PASSED` in `docs/STATUS.md`, STOP and reply: "Blocked: gate <X> not passed."
4. Work on exactly one task. Do not start the next task.

## 1. Source-of-truth precedence (highest first)
1. `docs/06_SECURITY_INVARIANTS.md`
2. `docs/02_DECISIONS.md`
3. `docs/04_DATA_MODEL.md`, `docs/05_API_AND_ROUTES.md`, `docs/07_GITHUB_APP.md`
4. `docs/01_PRODUCT_SPEC.md`
5. `docs/08_UI_SPEC.md`, `docs/14_CONTENT_AND_COPY.md`
6. `docs/reference/*` (background only; never overrides)

If two docs conflict, follow the higher one and record the conflict in `docs/STATUS.md` → "Spec conflicts".

## 2. Hard rules (never break; see docs/06 for details and tests)
- **Authorization** happens only in `@app/core` services via `authorize()`. Never authorize only in middleware/proxy, layouts or client code. Next.js Server Actions and Route Handlers are public endpoints: each one calls a core service that authorizes.
- **Hidden means 404.** A non-public resource the actor may not see returns NotFound, never 403.
- **No raw rows to clients.** Never pass DB rows/ORM objects to React client components or responses. Map them through audience DTOs in `@app/core/dto` (public, owner, staff).
- **Public surfaces read public data only.** Public pages, search, feeds, sitemap, share images, badges, emails and notifications read only `public_*` snapshot tables or public DTOs.
- **No stored GitHub user tokens.** Never store user access or refresh tokens and never request `offline_access`. Never log tokens, OAuth codes, cookies, Authorization headers or request bodies.
- **Never trust GitHub IDs from URLs** (e.g. `installation_id`). Verify them with a fresh user token via `GET /user/installations` and require `account.id == user.github_user_id`.
- **Private repos:** never persist their names or metadata. Filter in memory and keep a count only.
- **GitHub permissions:** request nothing beyond repository Metadata: read. Make no GitHub write calls anywhere.
- **Webhooks:** verify HMAC-SHA256 (`X-Hub-Signature-256`) over the raw body with a constant-time compare *before* parsing. Dedupe on `X-GitHub-Delivery`. Respond quickly; process in jobs.
- **User content:** no raw HTML. Markdown goes through the sanitizer allowlist. Link schemes are `https:` and `mailto:` only. Images come only from `USERCONTENT_ORIGIN`. No embeds or iframes.
- **Outbound links** go only via `/out/{linkId}`. There is no `/out?url=`. The server never fetches user-supplied URLs (no unfurling).
- **Uploads:** JPEG/PNG/WebP only (checked by magic bytes), with size and pixel limits. Re-encode server-side, strip metadata, use random keys and serve from `USERCONTENT_ORIGIN`. No SVG uploads.
- **Input validation:** every input goes through a strict zod schema (`.strict()`). Privileged fields (owner, state, trust level, featured, official, roles) change only through dedicated service functions.
- **Audit:** every publishing, GitHub-connection, link, moderation, staff and account-security change writes an `audit_events` row.
- **Emergency switches** (`switches` table) are checked by the services they govern.
- **Secrets** never go in code, tests, fixtures, logs or client bundles. Only `NEXT_PUBLIC_*` variables listed in `docs/03_ARCHITECTURE.md` may reach the browser.
- **Browser origins:** the browser may contact only our origins (`APP_ORIGIN`, `ADMIN_ORIGIN`, `USERCONTENT_ORIGIN`) plus the GitHub OAuth/installation pages.
- **Brand name:** never hardcode the product name. Use `brand` config and message placeholders.

## 3. Stack (pinned by D-016; don't substitute without a new decision)
| Area | Choice |
|---|---|
| Runtime / tooling | Node.js 24 LTS · pnpm workspaces · TypeScript `strict` |
| Web | Next.js 16 (latest patched 16.x, ≥16.4.1) App Router · React as pinned by Next |
| Data | PostgreSQL 16+ with `pg_trgm` and `citext` · Drizzle ORM + drizzle-kit migrations · pg-boss queue |
| Validation | zod |
| UI | Tailwind CSS v4 with CSS-variable tokens from `@app/ui` · Radix UI primitives · lucide-react |
| GitHub | `@octokit/core` / `@octokit/rest` / `@octokit/webhooks` / `@octokit/auth-app` |
| Content & media | `sharp` · `remark` + `remark-gfm` + `remark-rehype` + `rehype-sanitize` (never `rehype-raw`) · S3-compatible storage SDK (Cloudflare R2) |
| Testing | Vitest · Playwright + `@axe-core/playwright` |
| Monitoring | Sentry with PII scrubbing |

New runtime dependency? Add it to the D-016 appendix in `docs/02_DECISIONS.md` with its license. Allowed licenses: MIT, Apache-2.0, BSD, ISC, MPL-2.0; fonts must be OFL.

## 4. Repository layout and boundaries
```
apps/web        Next.js public + member app
apps/admin      Next.js staff app (separate origin)
apps/worker     Node process running pg-boss jobs
apps/prototype  Static clickable prototype (fixtures only; never imports @app/core)
packages/core   db schema, services, authz, dto, validation, integrations, jobs, security utils
packages/ui     tokens.css, accessible components (no data access)
packages/testing  factories, canary helpers, GitHub fixtures, BOLA matrix harness
packages/config   eslint, tsconfig, tailwind preset
spikes/         throwaway experiments + REPORT.md (never imported)
tools/concierge validation-only static page generator
infra/          docker-compose (postgres, mailpit, minio), backup scripts
docs/           specifications (read-only for Codex except STATUS.md and allowed appendices)
```
- Apps import `@app/core` **public exports only**. Importing `@app/core/src/db/*` from apps is forbidden (enforced with ESLint `no-restricted-imports`).
- `@app/ui` must not import `@app/core`.

## 5. Commands (keep these working; T-000 creates them)
```
pnpm install
pnpm dev                 # web on :3000 (admin :3001, worker, prototype :3002 via filters)
pnpm lint && pnpm typecheck
pnpm test                # vitest unit + integration (needs docker compose up)
pnpm test:e2e            # playwright
pnpm test:security       # BOLA matrix + canary + webhook + XSS suites (release blockers)
pnpm db:generate && pnpm db:migrate && pnpm db:seed
docker compose -f infra/docker-compose.yml up -d
```

## 6. Conventions
- **Service signature:** `fn(ctx: Ctx, input: unknown) → Promise<Result>`. Validate input first, then authorize, then act inside a transaction.
- **Errors:** use `NotFoundError`, `ForbiddenError` (owner-scope actions only), `ValidationError`, `RateLimitError`, `ConflictError`, `SwitchOffError`.
- **IDs and time:** UUIDv7 primary keys; slugs for public URLs; never expose sequential IDs. Times are stored in UTC and displayed in IST via `Intl`.
- **UI:** strings come from the message catalog (`apps/web/messages/en.json`). Tokens only — no hex values in components. Every interactive element is keyboard-reachable with a visible focus ring. Icon-only buttons need `aria-label`.
- **Cache-Control:** authenticated responses use `Cache-Control: private, no-store`. Only public snapshot routes may be cached.
- **Logs** are structured JSON with a redaction list (see `docs/03`). No PII beyond user ID and request ID.

## 7. Definition of done (every task)
- Acceptance criteria in `docs/10_BACKLOG.md` are met, with tests.
- `pnpm lint`, `pnpm typecheck` and `pnpm test` pass. `pnpm test:security` passes once it exists (from T-102).
- New routes/actions are registered in the route registry so the BOLA matrix covers them.
- `docs/STATUS.md` is updated: task row, assumptions made, open questions, deviations.
- **Final reply format:** (1) summary, (2) files changed, (3) tests added/run with results, (4) assumptions/deviations, (5) open questions, (6) manual steps the human must do (e.g. env vars, GitHub settings).

## 8. When unsure
Do not invent product or legal decisions. Pick the most restrictive safe behavior, put it behind a named constant or config value, and log it in `docs/STATUS.md` → "Assumptions made". Ask in "Open questions for founder".
