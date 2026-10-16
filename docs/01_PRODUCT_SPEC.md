# 01 — Product Specification (BuildSocial V2)

Status: baseline for implementation · Scope labels: **MVP** = closed beta · **LATER** = after beta evidence · **NO** = excluded

## 1. Positioning and users

**One line:** Real problems. Independent solutions. Lasting proof of work.

| User | Job to be done | MVP success signal |
|---|---|---|
| **Builder** (student / indie developer, 18+) | "Turn my code into a credible, shareable project page; find real problems worth building; get feedback." | Publishes in ≤5 min; shares the page; returns after a review |
| **Problem owner** (faculty, club lead, NGO, small business, startup, maintainer) | "Post a challenge with clear requirements, see which solutions cover what, review and feature the best." | Gets ≥2 solutions per problem; posts again |
| **Viewer** (guest or member) | "See what people built, whether it works, how to try it, which problem it solves." | Understands stage/demo/code status in ≤10 s |
| **Staff** (moderator / senior moderator / admin) | "Keep the platform lawful and safe in limited time." | P0 actions <1 h, P1 <24 h |

**Terminology (UI labels → internal names):** Problems (ideas / Idea Pitch) · Solutions (BuildTree) · Project facts (Project Passport) · Updates (BuildLog) · Spark (appreciation).

## 2. Scope summary

| Area | MVP | LATER | NO (V1) |
|---|---|---|---|
| Sign-in | GitHub (identity only), invite codes | Email accounts for problem owners | Passwords, other social logins |
| Projects | Public personal repo import; manual entry incl. private-source | Private repo linking (security-gated), org repos | Code hosting |
| Problems | Requirements, success criteria, windows, unlisted, co-owners, outcome, staff-assisted posting | Reusable challenge programmes, templates library | Paid/sponsored challenges (until validated) |
| Solutions | Solves links + coverage, owner review/confirm, featured, official, related, credits, intents, matrix | Comparison extras | Auto-linking, voting, leaderboards |
| Social | Follow, save, spark, comments, suggestions, updates | Collections, mentions | DMs, public follower counts on cards |
| Discovery | Home sections, Explore, Postgres search | Personalised ranking | Ads |
| Media | Images (upload), YouTube/Loom links opened externally | Sandboxed allowlisted embeds | User video upload, SVG, iframes |
| Safety | Reports, blocks, mutes, trust levels, queues, cases, clocks, switches, appeals | Transparency page | — |
| Analytics | Private creator counters | Richer analytics | Third-party trackers |

---

## 3. Features

Each feature lists **rules** (behaviour the code must enforce) and **acceptance criteria** (AC). The backlog task that implements each one references these IDs.

### F-01 Accounts and sign-in — MVP
**Rules**
1. Sign-in only via the GitHub App user-authorization flow (docs/07 Flow A). No repository permission is requested at sign-in.
2. During beta (`BETA_MODE=invite_only`), a new account requires a valid invite code (single- or multi-use, expiring). Existing members sign in without a code.
3. First sign-in shows: privacy notice summary (what GitHub data is read: numeric ID, login, avatar, account creation date, public name/bio), Terms + Privacy + Community Guidelines acceptance, and an age confirmation "I am 18 or older" (`MIN_AGE` config, default 18 — D-013). Record versions + timestamp.
4. Handle: defaults to the GitHub login lower-cased; must match `^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$`; unique case-insensitively; reserved list (admin, administrator, support, help, security, official, moderator, mod, staff, team, buildsocial, github, api, www, root, system, null, undefined, about, legal, terms, privacy, settings, login, logout, signup, problems, projects, explore, u, p, out, og, badge). The handle is independent of later GitHub login changes.
5. Display name 1–60 chars; bio ≤160; up to 5 profile links (https only, via outbound link policy); optional city-level location ≤60; "Open to collaborate" toggle.
6. GitHub login/avatar are refreshed at each sign-in and weekly (job), keyed by numeric GitHub ID.

**AC**
- AC-01.1 Sign-in without a valid invite (beta) creates no user row and shows "Invite required".
- AC-01.2 A user cannot reach any member page before accepting Terms and confirming age.
- AC-01.3 Reserved or duplicate handles are rejected with a clear message.
- AC-01.4 Changing the GitHub login (fixture) updates `github_login` but not `handle`.

### F-02 Sessions and security log — MVP
**Rules**
1. Opaque random session token in cookie `__Host-session` (`HttpOnly; Secure; SameSite=Lax; Path=/`); only its SHA-256 hash stored. Rotate on sign-in. Idle expiry 30 days, absolute 90 days (config).
2. Settings → Sessions lists devices (UA summary, country, last seen) with "Sign out" per session and "Sign out everywhere".
3. Step-up: delete account, transfer project, unpublish all, change email require a fresh GitHub sign-in within the last 10 minutes (`REAUTH_WINDOW_MIN`).
4. `github_app_authorization.revoked` webhook revokes all sessions of that user.
5. Security log (user-visible, 12 months): sign-ins, sign-outs, session revocations, GitHub connect/disconnect, publish/unpublish/delete/transfer, maintainer changes, moderation notices, data exports.

**AC**
- AC-02.1 Session cookie flags verified by test; raw token never stored.
- AC-02.2 "Sign out everywhere" invalidates all sessions within one request.
- AC-02.3 A revoked-authorization webhook fixture invalidates sessions.

### F-03 Project creation and editing — MVP
**Rules**
1. Two sources: **Import a public GitHub repository** (requires F-05) or **Manual entry** with code status `private_source` ("Code: Private — not linked") or `not_on_github`.
2. Fields and limits: title 3–60 · value line 10–120 · category (fixed list, docs/14) · stack chips ≤12 (each ≤24) · overview Markdown ≤10,000 · features ≤12 × ≤120 · "What works today" 10–500 (required) · limitations ≤1,000 (required unless stage = released) · platforms (web, android, ios, windows, macos, linux, cli, api, other) · stage (idea, prototype, working_demo, released) · demo link (optional https) · video link (optional; YouTube/Loom hosts only; opened externally) · credits Markdown ≤2,000 · "Contains AI-generated media" toggle · comment policy (everyone / TL2+ / people I follow).
3. Stage definitions are shown inline (docs/14). Stage `working_demo` requires a demo or video link.
4. Media: 0–6 images; alt text required (≤250); one cover; if none, a generated typographic cover (title + stack + brand gradient) is used and labelled "Generated cover".
5. Draft autosave every 5 s of inactivity and on blur; "Saved Xs ago" indicator; local fallback if offline.
6. Per-user limits: TL0 1 draft project, TL1+ 10 drafts; published projects unlimited in beta (config).

**AC**
- AC-03.1 Import pre-fills title, description → value line (truncated), topics → stack chips, languages → stack, homepage → demo link (validated) — all editable.
- AC-03.2 Manual entry never requests GitHub permissions.
- AC-03.3 Network loss during editing loses no text (e2e with offline emulation).
- AC-03.4 Double-submitting create produces one project (idempotency key).

### F-04 Publication preview, publish and lifecycle — MVP
**Rules**
1. Preview shows exactly what the public will see and a checklist: visible fields, repo-derived fields with toggles (repo name/URL, languages, licence, topics, stars default **off**), "never shown" list, secret-scan result, attestations: "I created this project or am authorised by its owners to present it, and the media is mine or licensed" and "I checked images for keys, emails, customer data", IP/patent notice.
2. Publish is disabled until attestations are ticked and the secret scan passes (docs/06 SI-17).
3. Beta pre-moderation: publishing by TL0/TL1 moves the project to `in_review` (visible only to members of the project); staff approve → `published`. TL2+ publish directly but remain `noindex` until staff approve indexing (config `INDEXING_ENABLED`).
4. Publish builds/refreshes the `public_projects` snapshot (docs/04) and enqueues share-image render, search re-index, sitemap update, CDN purge.
5. Unpublish: snapshot deleted, CDN paths purged (page, share image, badge), search de-indexed; followers keep the follow but see "Unavailable". Draft remains editable.
6. Archive: read-only page with "Archived" banner; links remain; no new links.
7. Delete: soft delete 14 days (restorable by owner), then hard delete of content and media (except legal hold); links on problem pages show a tombstone "Solution removed by its creator".
8. Transfer: owner proposes → recipient accepts within 14 days (step-up both sides). If GitHub-linked and recipient doesn't own the repo account, the link converts to "Not linked".
9. Maintainers: owner invites (0–10); invitee accepts; maintainers edit content and post updates; only owner publishes/unpublishes/deletes/transfers/manages members/creates Official requests.

**AC**
- AC-04.1 Unpublish → page 404, share image 404, badge shows "unavailable", search excludes, sitemap excludes within 5 minutes (job test).
- AC-04.2 Untoggled stars never appear in snapshot or share image.
- AC-04.3 A maintainer calling delete/transfer gets ForbiddenError; a stranger gets NotFound.
- AC-04.4 Text containing a fake `ghp_` token blocks publish with an explanation.

### F-05 GitHub connection and repo facts — MVP (public personal repos only)
**Rules**
1. Pre-screen explains: install the App on **your personal account**, choose "Only select repositories", read-only metadata, no code access, no writes.
2. Install round-trip and verification per docs/07 Flow B. Organization installations are refused ("Organization repositories aren't supported yet").
3. Eligible repos = repos in the installation with `private == false` **and** `owner.id == user.github_user_id`. Private repos: only a count is shown ("2 private repositories hidden — not supported yet"). Forks are eligible but always disclosed ("Fork of owner/repo").
4. One active project per `github_repo_id` platform-wide.
5. Project facts panel separates **From GitHub (checked)** — repo owner verified, created, last push, languages, licence, fork status, topics, stars (if toggled) — and **From the creator (stated)**.
6. Lifecycle handling per docs/07 §6 (renamed, transferred, privatized, publicized, deleted, archived, installation removed/suspended, authorization revoked) and nightly reconciliation.

**AC**
- AC-05.1 Forged `installation_id` cannot bind (T6).
- AC-05.2 After a `privatized` event the repo-derived fields disappear from the public page, share image and search within 5 minutes (T7).
- AC-05.3 No private repo name is persisted anywhere (DB/log scan in T3).

### F-06 Project page — MVP
**Rules**
1. Above the fold: breadcrumb, title, value line, identity line (avatar, display name, `GitHub @login` if linked, team count), stage rail, demo badge, code status, updated date, hero media, actions (Try demo → `/out/{id}`, Follow, Save, Share, overflow: Report, Mute), "Solves" card with coverage dots for each linked problem.
2. Sections: Overview · Project facts · Updates · Feedback (comments + suggestions) · Related (related projects + other solutions to the same problems).
3. Owner/maintainer controls live in a separate "Manage" menu.
4. "Not updated since <date>" chip after 120 days without edits/updates.

**AC**
- AC-06.1 A guest can read everything public; any action prompts sign-in with intent resume.
- AC-06.2 No external href on the page except `/out/*` and the linked GitHub profile/repo URLs (allowlisted host `github.com`).

### F-07 Sharing: share image, README badge, share sheet — MVP
**Rules**
1. Share image (1200×630 PNG) rendered from the public snapshot only: title, value line, stage, stack chips, creator handle, brand. Regenerated on publish/update; purged on unpublish.
2. README badge: `/badge/{slug}.svg` — generated by the server from fixed templates (escaped text): "On {brand} · Solves N problems" or "On {brand}". Cached 1 h; "unavailable" variant when unpublished. Copyable Markdown snippet in Manage → Share.
3. Share sheet: native Web Share API where available; fallbacks: copy link, WhatsApp (`https://wa.me/?text=`), LinkedIn share URL, X intent URL.
4. Badge and share clicks increment private counters (F-18).

**AC**
- AC-07.1 Badge SVG contains no user-controlled markup (escaping test with `<script>` in title).
- AC-07.2 Share image for an unpublished project returns 404.

### F-08 Problems — MVP
**Rules**
1. Create/edit fields: title 10–100 · summary 20–200 · problem body Markdown ≤8,000 (who is affected, what fails today, desired outcome) · requirements 1–8 items (each ≤140; numbered R1…R8; stable IDs) · success criteria Markdown ≤2,000 · category · optional build window (start ≤ end; end ≤ start + 180 days) · visibility public/unlisted · "Open for solutions" toggle.
2. Fixed banner on every problem: "Posting a problem does not create ownership of solutions. Anyone may build independently, subject to law and licences." Publishing requires acknowledging the disclosure warning (confidential info, third-party data, patents — docs/14).
3. Text mentioning "patent pending", "exclusive", "©" or "all rights reserved" shows a reminder (not a block).
4. Every published edit to title, body, requirements or success criteria creates a new revision (v1, v2…) with an optional change note and a public changelog. Requirements can be added or marked "retired" but never deleted once referenced by any link.
5. Co-owners: author invites ≤3 (TL2+ or staff-approved); co-owners can edit, feature, review and post outcome; only the author deletes or transfers authorship.
6. Unlisted: reachable by link, `noindex`, excluded from Explore/search/feeds, labelled "Unlisted — anyone with the link can view".
7. Staff-assisted posting (D-009): staff create the problem from an intake record with recorded consent; the page shows "Posted on behalf of {org}"; the owner's contact details are never public; handover to the owner's account when they sign up.
8. Owner tools: CSV export of solutions (public data only: project title, URL, creator handle, stage, demo yes/no, claimed and confirmed requirements, featured, linked date).
9. Lifecycle: draft → (in_review in beta for TL0/TL1) → published → archived; removed (tombstone). Archived: read-only, no new links, existing solutions remain.

**AC**
- AC-08.1 Editing requirement text after links exist creates v(n+1); linked solutions show "Linked to v(n) — problem updated since".
- AC-08.2 Deleting a referenced requirement is impossible; retiring it keeps coverage dots with a "retired" style.
- AC-08.3 Unlisted problems never appear in search, sitemap or feeds (T3 variant).
- AC-08.4 CSV export contains only public fields (snapshot-based test).

### F-09 Solutions (BuildTree) — MVP
**Rules**
1. **Solves link** (project → problem): created by the project owner/maintainer; requires ≥1 covered requirement and a relevance note 80–600 chars; one link per project–problem pair; stores the problem revision it was made against.
2. Eligibility: project must be published (or in review, then the link waits); problem must be published, open for solutions, not archived; if a window is set and closed, new links are labelled "Linked after the window closed".
3. Visibility: TL0 → `queued` (visible only to the linker, with status "In review — usually under 24 hours"); TL1+ → `visible` immediately unless limits or checks fail.
4. Limits: TL0 0 visible (queued, max 3 pending) · TL1 3 new/week, 10 total · TL2 10/week, 30 total · TL3 config. Identical relevance notes across a user's links are rejected.
5. Owner (author/co-owner) actions: Feature/unfeature; write an **owner review** ≤280 chars; **confirm** individual requirement coverage; flag "Not relevant" (→ moderation queue; link stays visible); cannot delete a lawful link.
6. **Official**: requested by either side, confirmed by the other → "Official solution" badge with both names. A false-Official dispute suspends the badge immediately pending review.
7. **Related projects** (project ↔ project): one-way by either owner; "mutual" when both add it.
8. **Credits**: free-text Markdown on the project (attribution, inspiration, licences). No typed "derived from" edge.
9. Display on the problem page: Featured (with owner review) → Community solutions (sortable: most coverage, recently updated, stage; filters: demo available, covers Rx) → In progress (intents, F-10). Toggle Cards | Matrix. Disclaimer (docs/14): coverage is creator-declared until confirmed; a review is an assessment, not certification of safety, ownership or reliability.
10. Disputes: "Dispute this relationship" (category + evidence) → case; link shows "Under review" (stays visible) except false Official (badge suspended).

**AC**
- AC-09.1 A TL0 account linking to 10 problems produces 0 publicly visible links (T11).
- AC-09.2 The 4th link in a week by a TL1 account is rejected with the next allowed date.
- AC-09.3 Blocking a builder does not remove their lawful link (F-19 rule).
- AC-09.4 Matrix renders as an accessible `<table>` on desktop and as per-solution coverage lists on mobile.

### F-10 "I'm building this" intents — MVP
**Rules:** Member (TL0+, max 3 active for TL0, 5 for TL1+) marks intent on a problem with an optional note ≤140; shown under "In progress" with avatar + start date; expires 30 days after last activity unless converted by linking a project; user can remove it anytime. Not exclusive; copy says so.
**AC:** AC-10.1 Expired intents disappear via daily job; AC-10.2 Linking a project converts the intent.

### F-11 Build windows and outcome — MVP
**Rules:** Optional start/end; countdown shown with absolute date; followers get "window opened / closing in 48 h / closed" notifications (batched); after close the owner can post an **Outcome** (Markdown ≤3,000, may reference featured solutions) which is also posted as an update to followers of the problem; reminders to the owner at close and +3 days if no outcome.
**AC:** AC-11.1 Countdown accessible name includes absolute date; AC-11.2 outcome notification sent once per follower.

### F-12 Home — MVP
**Rules:** Guest home: one-line value proposition, "Open problems" strip, "Recently shipped" projects, "How it works" (3 steps), footer. Member home: segmented sections **Following · Open challenges · New · Staff picks (labelled)**; right rail "Your problems" (new solutions since last visit, reviews pending, window countdown) and "Problems matching your stack"; starter checklist for new users. Chronological within sections; "Load more" pagination (20/page); empty sections hidden; no algorithmic ranking.
**AC:** AC-12.1 With zero follows, Following shows an empty state with suggestions, not a blank list; AC-12.2 footer reachable on every page.

### F-13 Explore and search — MVP
**Rules:** Tabs Problems · Projects · People · Updates; Postgres full-text (`websearch_to_tsquery`) + trigram fallback over public snapshots only; facets shown only when non-empty (stage, demo available, open for solutions, window open, stack, category, platform, updated within); sorts: relevant (with query), newest, recently active, most solutions; no-results state offers "Post this as a problem"; cursor pagination.
**AC:** AC-13.1 p95 <300 ms at 10k public items (synthetic); AC-13.2 private/unlisted canaries never match (T3).

### F-14 Profiles — MVP
**Rules:** Header (avatar, display name, `GitHub @login` if linked, bio, location, links, Open to collaborate, Follow, Share, Report/Block); tabs Projects (≤6 pinned first) · Problems · Solutions · Updates; no public follower counts; private profile stats for the owner; print view `?print=1`.
**AC:** AC-14.1 Print view fits one A4 page for ≤6 projects.

### F-15 Follow, save, spark — MVP
**Rules:** Follow targets: creator, project, problem (semantics in docs/05 §Notifications); no implicit follows; Save: projects and problems; Spark: projects and updates (count shown on detail pages only, never on cards, never used for ranking).
**AC:** AC-15.1 Toggling is idempotent and rate-limited.

### F-16 Comments, suggestions, private security reports — MVP
**Rules:** Comments on projects, problems, updates (one reply level), Markdown ≤2,000, edit window 15 min with "edited" label, delete own; project comment policy respected. Suggestions on projects: kind Bug/Idea/Question with structured fields; visibility public or maintainers-only (project setting); maintainers can close/resolve/hide/convert to update; security keyword prompt. **Report a security issue** (private): visible to owner and maintainers only; no attachments; encrypted at rest; reporter guidance shown.
**AC:** AC-16.1 A non-maintainer cannot read a security report (404); AC-16.2 keyword prompt appears for "token"/"exploit" in a public suggestion.

### F-17 Notifications, digest, email — MVP
**Rules:** In-app on by default; email off by default except security/account notices and opt-in weekly digest; batching window 1 h per batch key; per-user cap 20 in-app/day (overflow → digest); per-project cap 2 update notifications/day to followers; per-type preferences; inline mute; email requires a verified address (double opt-in link, 24 h expiry).
**AC:** AC-17.1 Burst of 50 links → ≤3 notifications per follower; AC-17.2 unsubscribe link in every non-security email works without sign-in (signed token).

### F-18 Creator stats (private) — MVP
**Rules:** Daily counters per project/problem/profile: views (deduplicated per visitor per day using a salted hash that rotates daily and is not stored beyond the day), demo clicks, share clicks, badge referrals, follows, saves; shown to owners/maintainers only (7/30/90-day views); weekly "your stats" in digest if opted in. No visitor identities stored; bots filtered by UA heuristics.
**AC:** AC-18.1 Stats endpoint returns NotFound for non-members of the project.

### F-19 Safety controls — MVP
**Rules:** Report (any content or user; categories docs/14; guests via form with rate limit); Block (effects table docs/05); Mute; trust levels and limits (docs/05 §Trust); brigading flag (≥5 actions from accounts <7 days old on one target within 1 h → moderator flag, no automatic action); limits are account-based (campus NAT: IP is a weak signal only).
**AC:** AC-19.1 100 sign-ups from one IP with distinct GitHub accounts are allowed; AC-19.2 20 reports from new accounts produce a flag, not a hide.

### F-20 Outbound links and URL policy — MVP
**Rules:** All user URLs are normalised and stored in `outbound_links`; https only; reject IP-literal hosts, non-default ports, credentials in URL, known shorteners (list in config), `localhost`/internal TLDs; display punycode for IDN hosts; Web Risk check at submit and weekly; new links `pending` until checked (not clickable); unsafe → rejected/disabled; interstitial `/out/{linkId}` shows full host, who shared it, last check date, "not a guarantee" copy, Continue/Back/Report; `rel="noopener noreferrer nofollow ugc"`; global switch disables all outbound links.
**AC:** AC-20.1 Google's test phishing URL is rejected (live mode) / flagged by stub (test mode); AC-20.2 `/out?url=` route does not exist.

### F-21 Administration and moderation — MVP (separate admin app)
**Rules:** Staff sign in with GitHub **and** a WebAuthn passkey step-up; admin origin is additionally protected by Cloudflare Access (infra). Modules: dashboard (statutory clocks, queues, system health, switches, recent privileged actions) · review queue (beta pre-moderation of projects/problems/indexing) · link queue · reports → cases · legal orders · grievances · appeals · data requests · account recovery · user lookup (logged) · invites · operator intake · staff picks · broadcasts (incl. quarterly rules notice) · switches · audit viewer · ops (jobs, webhooks, backups). Case decisions require a reason code; permanent removal, suspension, recovery and staff-role grants require a second approver; viewing private content requires a case ID + justification (break-glass) and is logged. Macros for notices. Mobile-friendly "on-call" view with one-tap hide item/user/domain and pause publishing.
**AC:** AC-21.1 Statutory clock turns warning at 50% elapsed; AC-21.2 permanent removal without second approver is impossible; AC-21.3 break-glass view without case ID is denied.

### F-22 Privacy rights and retention — MVP
**Rules:** Data export (JSON + Markdown + images zip, 24 h link); account deletion with 14-day grace and step-up; comments of deleted users anonymised to "Deleted user" (D-033, counsel to confirm); retention values in config (docs/12 §Retention); legal hold blocks hard deletion.
**AC:** AC-22.1 After hard delete + 24 h, no storage key, snapshot, search doc or cache entry for the user's content remains (scripted check).

### F-23 Legal, help, security pages — MVP
**Rules:** Footer on every page: Terms · Privacy · Community Guidelines · Grievance Officer · Report content · Copyright · Security · Help. Pages render counsel-supplied Markdown from `content/legal/*.md` with version + effective date (placeholders until counsel delivers). Grievance page shows officer name/contact/timelines from config. `/.well-known/security.txt` (RFC 9116). Quarterly rules notice broadcast (in-app + email to verified addresses), logged.
**AC:** AC-23.1 Every page renders the footer (e2e); AC-23.2 security.txt valid fields and expiry.

### F-24 Accessibility and performance — MVP (cross-cutting)
WCAG 2.2 AA on core journeys; axe 0 serious/critical; keyboard-only and screen-reader passes; LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 at p75 (mid-range Android, 4G); initial JS ≤170 KB gzip per route; images responsive WebP/AVIF; no autoplay; reduced-motion respected. Details docs/08 §9.

### F-25 Beta mode — MVP
`BETA_MODE=invite_only`: invites required; pre-moderation per F-04/F-08; `INDEXING_ENABLED=false` → `robots.txt` disallows all and pages send `noindex` except items staff approve; banner "Private beta".

---

## 4. Non-functional requirements
- **Security:** docs/06 (release blockers) · OWASP ASVS 5.0 L1 for all features before beta.
- **Reliability:** RPO 24 h / RTO 4 h in beta; restore drill passes before beta.
- **Privacy:** data minimisation; no third-party trackers; logs redacted.
- **Cost:** infrastructure budget alarm at 50/80/100% of the monthly cap (config).
- **Localisation:** English UI; user content any language with correct `lang`; Noto font fallbacks.
