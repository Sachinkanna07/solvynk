# 05 — Routes, Services and Authorization

Every service listed here must be registered in `packages/core/src/routes/registry.ts` with:
- its **authz action**,
- a **resource factory** (so the BOLA matrix can create "someone else's" resource),
- its **switch** (if any),
- its **rate-limit bucket**.

## 1. Web app pages (`apps/web/app`)

| Route | Who | Renders from | Notes |
|---|---|---|---|
| `/` | all | public snapshots + member data | Guest vs member variants (docs/01 F-12). Guest variant is CDN-cacheable. |
| `/explore` | all | public snapshots | `?q&type=problems\|projects\|people\|updates&facets…&cursor` |
| `/problems` | all | `public_problems` | Hub + collections |
| `/problems/new` | member | — | Multi-step form; staff-assisted creation lives in admin |
| `/problems/[slug]` | all | `public_problems` + public solution DTOs | Sections: problem, requirements, solutions (cards/matrix), discussion, updates |
| `/problems/[slug]/edit` | author / co-owner | owner DTO | Creates a revision on publish |
| `/problems/[slug]/manage` | author / co-owner | owner DTO | Co-owners, window, outcome, CSV export, review queue for flags |
| `/p/[slug]` | all | `public_projects` | Project detail |
| `/projects/new` | member | — | `?step=source\|details\|media\|review`; autosave |
| `/projects/[id]/edit` | owner / maintainer | owner DTO | `id` = uuid (not slug) |
| `/projects/[id]/preview` | owner / maintainer | owner DTO → public-shape preview | Publication preview + checklist |
| `/projects/[id]/manage` | owner (some sections maintainer) | owner DTO | Members, transfer, visibility, share/badge, stats, links, delete |
| `/projects/[id]/link` | owner / maintainer | — | Link to a problem with coverage |
| `/u/[handle]` | all | `public_profiles` + snapshots | `?print=1` print view |
| `/saved` · `/notifications` | member | member DTOs | |
| `/settings/{profile,email,notifications,github,sessions,security-log,privacy,blocked,delete}` | member | member DTOs | Step-up where required |
| `/github/connect` | member | — | Explainer → install redirect |
| `/auth/github/start` | all | — | Route Handler |
| `/auth/github/callback` | all | — | Route Handler: sign-in **and** install branches |
| `/auth/logout` | member | — | POST only |
| `/out/[linkId]` | all | `outbound_links` (safe + not disabled) | Interstitial page; "Continue" is a plain link to the stored URL |
| `/og/project/[slug]` · `/og/problem/[slug]` | all | snapshots | 1200×630 PNG; 404 if not public |
| `/badge/[slug].svg` | all | `public_projects` | Fixed templates, escaped text |
| `/api/github/webhook` | GitHub | — | Route Handler (raw body) |
| `/api/uploads/*` | member | — | Request slot / complete |
| `/api/client-errors` | all | — | Rate-limited; no PII |
| `/legal/{terms,privacy,guidelines,grievance,copyright}` · `/security` · `/.well-known/security.txt` · `/help` · `/help/glossary` | all | `content/legal/*.md` | Versioned |
| `/robots.txt` · `/sitemap.xml` | all | public snapshots (indexable only) | Disallow-all when `INDEXING_ENABLED=false` |

## 2. Admin app pages (`apps/admin/app`, separate origin)

`/` dashboard · `/review` (pre-moderation: projects, problems, indexing) · `/links` (link queue) · `/cases` and `/cases/[id]` · `/legal` (legal orders) · `/grievances` · `/appeals` · `/data-requests` · `/recovery` · `/users` (lookup by handle, GitHub ID or email; every lookup logged) · `/invites` · `/intake` (staff-assisted problems) · `/staff-picks` · `/broadcasts` · `/switches` · `/audit` · `/ops` (jobs, webhook deliveries, backups, budget) · `/staff` (roles; admin only) · `/oncall` (mobile view: clocks + one-tap actions).

## 3. Authorization actions and policy

Policy lives in `packages/core/src/authz/policy.ts`. The tables below are the canonical summary (docs/01 has the behaviour).

Legend: ✓ allowed · O own only · Q queued · — denied (NotFound if the resource isn't visible to the actor, Forbidden if it is visible) · 2P second staff approver required.

| Action | Guest | TL0 | TL1+ | Maintainer | Owner / Author | Co-owner | Mod | Sr Mod | Admin |
|---|---|---|---|---|---|---|---|---|---|
| `public.read` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `project.create` | — | ✓ (≤1 draft) | ✓ (≤10) | | | | | | |
| `project.readDraft` | — | O | O | ✓ | ✓ | | break-glass | break-glass | — |
| `project.edit` | — | | | ✓ | ✓ | | | | |
| `project.submit` / `project.publish` | — | Q | Q (TL1) / ✓ (TL2+) | — | ✓ | | | | |
| `project.unpublish` · `project.archive` · `project.delete` · `project.transfer` · `project.manageMembers` · `project.setVisibility` | — | | | — | ✓ | | | | |
| `project.connectRepo` | — | | | — | ✓ (own repo account) | | | | |
| `project.postUpdate` | — | | | ✓ | ✓ | | | | |
| `project.viewStats` | — | | | ✓ | ✓ | | | | |
| `project.readSecurityReports` | — | | | ✓ | ✓ | | case only | case only | — |
| `solution.create` | — | Q | ✓ (limits) | ✓ | ✓ | | | | |
| `solution.withdraw` | — | | | ✓ | ✓ | | | | |
| `solution.feature` · `solution.review` · `solution.confirmCoverage` · `solution.flagNotRelevant` | — | | | | ✓ (problem author) | ✓ | | | |
| `solution.requestOfficial` | — | | | | ✓ (either side owner) | ✓ (problem side) | | | |
| `solution.hide` / `solution.restore` | — | | | | | | ✓ | ✓ | |
| `problem.create` | — | Q | ✓ | | | | | | |
| `problem.edit` · `problem.setWindow` · `problem.postOutcome` · `problem.exportCsv` · `problem.manageCoOwners` | — | | | | ✓ | ✓ (except manageCoOwners, delete) | | | |
| `problem.delete` | — | | | | ✓ | — | | | |
| `intent.create` / `intent.remove` | — | ✓ (≤3) | ✓ (≤5) | | | | | | |
| `comment.create` | — | ✓ (5/day) | ✓ (30/day) | ✓ | ✓ | ✓ | | | |
| `comment.editOwn` (15 min) · `comment.deleteOwn` | — | O | O | | | | | | |
| `comment.hide` | — | | | | | | ✓ | ✓ | |
| `suggestion.create` | — | ✓ (3/project/day) | ✓ | | | | | | |
| `suggestion.manage` | — | | | ✓ | ✓ | | | | |
| `securityReport.create` | — | ✓ | ✓ | | | | | | |
| `social.follow` · `social.save` · `social.spark` | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `report.create` | ✓ (form, rate-limited) | ✓ | ✓ | ✓ | ✓ | ✓ | | | |
| `user.block` · `user.mute` | — | ✓ | ✓ | ✓ | ✓ | ✓ | | | |
| `case.read` · `case.act` | — | | | | | | ✓ | ✓ | |
| `case.removePermanent` · `user.suspend` | — | | | | | | — | 2P | |
| `legal.process` | — | | | | | | hide only | ✓ | |
| `recovery.rebind` | — | | | | | | | 2P | 2P |
| `switch.toggle` | — | | | | | | | ✓ | ✓ |
| `staff.grant` | — | | | | | | | | 2P |
| `audit.read` | — | own security log | own | | | | own actions | ✓ | ✓ |

### Trust-level limits (config `TRUST_LIMITS`)

| Limit | TL0 | TL1 | TL2 | TL3 |
|---|---|---|---|---|
| Draft projects | 1 | 10 | 20 | 50 |
| Solution links (new per week / total) | 0 visible, ≤3 queued | 3 / 10 | 10 / 30 | 30 / 100 |
| Comments per day | 5 | 30 | 60 | 200 |
| Problems per week | 1 (queued) | 3 | 5 | 20 |
| Uploads per month | 20 | 50 | 100 | 300 |
| Report weight | 1 | 1 | 2 | trusted (1 report hides P0 categories) |

### Trust-level promotion (daily job; demotion on upheld violations)

| Level | Criteria |
|---|---|
| **TL1** | ≥1 published item **and** account ≥3 days **and** GitHub account ≥30 days **and** 0 upheld reports |
| **TL2** | TL1 for ≥30 days **and** (≥3 published items **or** ≥5 owner-confirmed coverages) **and** 0 upheld reports in 90 days |
| **TL3** | Staff grant only |

### Block effects (user A blocks user B)

- B cannot comment or suggest on A's content.
- B's comments are collapsed for A.
- No notifications from B to A.
- B's follow of A is removed and B cannot re-follow.
- Profiles stay viewable.
- B's content is hidden in A's feeds.
- B's lawful solution links on A's problems **remain**. A may decline to feature them and may flag them.

## 4. Service catalogue (core)

Format: `service.name(input)` → result · authz action · switch · rate bucket · audit event · notes.

**Accounts & sessions**
- `auth.startSignin({returnTo})` → redirect URL · none · `signups` (new users only, checked at callback) · `ip:auth:start` 10/min · — · creates `oauth_states`.
- `auth.completeCallback({code, state, installation_id?, setup_action?})` → session/redirect · none · — · `ip:auth:cb` 20/min · `auth.signed_in` / `github.installation_bound` · branches sign-in vs install (docs/07).
- `auth.logout()` · `sessions.revoke({sessionId})` · `sessions.revokeAll()` · audit `session.revoked`.
- `accounts.acceptTerms({versions, adultConfirmed})` · `accounts.updateProfile({...})` · `accounts.setHandle({handle})` (once per 30 days) · `accounts.requestEmailVerification({email})` · `accounts.verifyEmail({token})`.
- `invites.redeem({code})` (during sign-in) · staff: `invites.create`, `invites.revoke`.

**GitHub**
- `github.listEligibleRepos()` → public repos owned by the user (from `eligible_repos`) + hidden-private count.
- `github.importRepo({githubRepoId})` → draft project with pre-filled fields + repo_link `verified` · `project.connectRepo` · audit `repo.linked`.
- `github.disconnectRepo({projectId})` → code_status `not_on_github` or `private_source` per user choice · audit `repo.unlinked`.
- Jobs: `github.webhook`, `github.refreshEligibleRepos`, `github.reconcileLinks` (nightly), `github.redeliverFailed` (hourly), `github.refreshIdentities` (weekly).

**Projects & publishing**
- `projects.createDraft({source, idempotencyKey})` · `projects.updateDraft({projectId, patch})` (autosave; partial; strict schema) · `projects.setMedia({projectId, mediaIds, coverId, altTexts})`.
- `projects.preview({projectId})` → public-shape DTO built by the same builder as the snapshot (dry run).
- `projects.publish({projectId, attestations, publicFields})` · switch `publishing` · secret scan · beta rules · audit `project.submitted` / `project.published`.
- `projects.unpublish` · `projects.archive` · `projects.unarchive` · `projects.softDelete` · `projects.restore` · audit for each.
- `projects.inviteMaintainer` · `projects.acceptInvite` · `projects.removeMember` · `projects.leave`.
- `projects.proposeTransfer` · `projects.respondTransfer` (step-up both sides).
- `projects.postUpdate({projectId, type, title, bodyMd, mediaId?, versionTag?})` · cap 2 follower notifications/day.
- `projects.addRelation` · `projects.removeRelation`.
- `stats.getProjectStats({projectId, range})` · `stats.recordEvent({target, metric})` (public beacon; deduped; no PII).

**Problems**
- `problems.createDraft` · `problems.updateDraft` · `problems.publish({problemId, disclosureAck})` (switch `publishing`; beta rules) · `problems.edit({problemId, patch, changeNote})` → new revision · `problems.setWindow` · `problems.setOpenForSolutions` · `problems.archive` / `unarchive` · `problems.delete` · `problems.inviteCoOwner` / `acceptCoOwner` / `removeCoOwner` · `problems.postOutcome` · `problems.exportSolutionsCsv`.

**Solutions & intents**
- `solutions.link({projectId, problemId, coveredRids, relevanceNote})` · switch `linking` · limits · audit `solution.linked`.
- `solutions.withdraw` · `solutions.updateCoverage` (linker; new claim resets confirmations for changed rids).
- `solutions.feature` / `unfeature` · `solutions.review({linkId, text})` · `solutions.confirmCoverage({linkId, rids})` · `solutions.flagNotRelevant({linkId, reason})` → case.
- `solutions.requestOfficial` / `respondOfficial` / `withdrawOfficial` · `solutions.dispute({linkId, category, evidence})` → case.
- `intents.add({problemId, note})` · `intents.remove`.

**Social & content**
- `social.follow` / `unfollow` · `social.save` / `unsave` · `social.spark` / `unspark`.
- `comments.create` / `edit` / `delete` · switch `comments`.
- `suggestions.create` / `update` / `setState` · switch `suggestions`.
- `securityReports.create` / `acknowledge` / `resolve` / `markAbusive`.
- `safety.block` / `unblock` · `safety.mute` / `unmute` · `reports.create({targetType, targetId, category, body})` → creates/attaches case; P0-category auto-hide rules (docs/06 SI-24).

**Notifications & email**
- `notifications.list` · `notifications.markRead` · `notifications.updatePrefs`.
- Jobs: `notifications.fanout`, `notifications.batch`, `email.send`, `digest.weekly`, `window.reminders`, `broadcast.send`.

**Search & feed**
- `search.query({q, type, facets, cursor})` (public snapshots only).
- `feed.home({section, cursor})` (sections: following, open, new, picks).
- `feed.yourProblems()`.

**Links & media**
- `links.register({url, kind})` → `outbound_links` row (normalise + policy + queue Web Risk check).
- `links.resolveForInterstitial({linkId})` → public DTO or NotFound/disabled state.
- `media.requestUpload({purpose, mime, bytes})` → presigned PUT (quota, mime allowlist) · `media.complete({mediaId})` → job `media.process`.

**Privacy**
- `privacy.requestExport` → job · `privacy.requestDeletion({deleteComments})` (step-up) · `privacy.cancelDeletion`.
- Jobs: `privacy.buildExport`, `privacy.executeDeletion`, `privacy.purgeSoftDeleted`, `retention.sweep`.

**Staff (admin app only; Staff ctx required + WebAuthn-verified staff session)**
- `review.approve` / `reject` (projects, problems, indexing).
- `links.approveQueued` / `rejectQueued`.
- `cases.list` / `get` / `assign` / `decide({decision, reasonCode, note})` / `requestSecondApproval` / `approve` / `addNote` / `attachEvidence`.
- `legal.intakeOrder({authority, reference, receivedAt, via, targets})` → case with `statutory_due_at` per config.
- `grievances.create` / `acknowledge` / `resolve` (clocks per config).
- `appeals.decide`.
- `dataRequests.*`.
- `recovery.propose` / `approve` (2P).
- `users.lookup({by, value, caseId, justification})` (logged).
- `users.restrict` / `suspend` (2P) / `restore`.
- `breakGlass.view({caseId, resourceType, resourceId, justification})`.
- `switches.set({key, enabled, reason})`.
- `invites.*`.
- `intake.create` / `verifyConsent` / `createProblemOnBehalf` / `handover`.
- `staffPicks.add` / `remove`.
- `broadcasts.create` / `schedule`.
- `macros.*`.
- `staff.grant` / `revoke` (2P).
- `ops.status()`.

## 5. Notification types (batch key → default channels)

| Type | Batch key | In-app | Email (default) |
|---|---|---|---|
| `solution.new_on_my_problem` | problem | ✓ | off (digest) |
| `solution.new_on_followed_problem` | problem | ✓ | off |
| `solution.featured` / `solution.reviewed` / `solution.coverage_confirmed` | link | ✓ | off |
| `solution.link_status` (queued → visible / rejected) | link | ✓ | off |
| `official.requested` / `official.confirmed` | link | ✓ | off |
| `problem.revised` (to linkers) | problem | ✓ | off |
| `window.opened` / `window.closing` / `window.closed` / `outcome.posted` | problem | ✓ | off |
| `project.update` (followers) | project | ✓ | off |
| `comment.reply` / `comment.on_my_content` / `suggestion.new` | thread | ✓ | off |
| `securityReport.new` | project | ✓ | **on** (if verified email) |
| `member.invite` / `transfer.request` / `coowner.invite` | item | ✓ | on |
| `moderation.notice` (decision on your content, appeal outcome) | case | ✓ | on |
| `account.security` (new sign-in, sessions revoked, GitHub revoked, deletion scheduled) | user | ✓ | **on** |
| `rules.quarterly_notice` | broadcast | ✓ | on |
| `digest.weekly` | — | — | opt-in |

## 6. HTTP and error conventions
- **Mutations:** POST, or Server Actions (which are POSTs). An `Idempotency-Key` header or field is required for create actions.
- **Origin check:** all non-GET Route Handlers verify the `Origin` header equals `APP_ORIGIN` (admin: `ADMIN_ORIGIN`). Server Actions rely on the framework check **plus** this same helper.
- **Error envelope:** `{ error: { code, message, fields?, requestId } }`. Messages are user-safe; never include internal identifiers of other users.
- **Pagination:** cursor-based (`cursor` = opaque base64 of sort key + id); limit default 20, max 50.
