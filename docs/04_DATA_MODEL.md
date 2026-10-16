# 04 — Data Model

Conventions: PostgreSQL 16+. Extensions: `citext`, `pg_trgm`. Every table has `created_at timestamptz not null default now()`. Mutable tables also have `updated_at timestamptz not null default now()`, maintained by the app or a trigger. Primary keys are `uuid` v7 generated in the app unless noted. `→ x` marks a foreign key (`on delete restrict` unless noted). Text limits are enforced in zod **and** with `check (char_length(..) <= n)`. Enums are Postgres enums, or text with a check constraint (Codex: pick one approach and use it consistently; record the choice in STATUS).

Legend: **PK** primary key · **UQ** unique · **IX** index · **P** = public-surface data (may be copied to snapshots) · **S** = sensitive (never in public DTOs).

## 1. Enums

| Enum | Values |
|---|---|
| `user_state` | active, locked, restricted, suspended, deletion_pending, deleted |
| `project_state` | draft, in_review, published, unpublished, archived, soft_deleted |
| `project_stage` | idea, prototype, working_demo, released |
| `code_status` | public_github, private_source, not_on_github |
| `demo_kind` | none, try_it, video |
| `repo_link_state` | pending, verified, unverified, source_gone |
| `repo_unverified_reason` | privatized, transferred, removed_from_installation, installation_deleted, installation_suspended, owner_mismatch, authorization_revoked |
| `problem_state` | draft, in_review, published, archived, removed |
| `problem_visibility` | public, unlisted |
| `link_state` | queued, visible, hidden, removed |
| `official_state` | none, requested_by_project, requested_by_problem, confirmed, suspended |
| `member_role` | owner, maintainer |
| `problem_role` | author, co_owner |
| `follow_target` | user, project, problem |
| `content_target` | project, problem, update, solution_link, comment, suggestion, user |
| `update_type` | release, new_demo, feature, fix, milestone, retrospective, outcome |
| `suggestion_kind` | bug, idea, question |
| `report_category` | harassment, hate, impersonation, copyright, private_info, secret_exposed, fraud, malicious_link, misleading_relationship, spam, synthetic_media, ncii, child_safety, other_legal |
| `case_type` | report, legal_order, grievance, appeal, data_request, recovery, dispute, security_incident |
| `case_priority` | p0, p1, p2, p3 |
| `case_state` | open, in_progress, waiting, resolved, closed |
| `case_decision` | no_action, hidden, removed, label_corrected, restricted, suspended, restored, referred, data_provided |
| `staff_role` | moderator, senior_moderator, admin |
| `webrisk_status` | pending, safe, unsafe, error |
| `media_purpose` | project_image, avatar, update_image, suggestion_image, evidence, export |
| `media_state` | pending, ready, rejected, deleted |

## 2. Identity and access

**users**
- `id` uuid PK
- `github_user_id` bigint not null UQ (**S** — staff only)
- `github_login` text not null (**P**; refreshed)
- `github_created_at` timestamptz (trust signal; **S**)
- `handle` citext not null UQ, check regex (docs/01 F-01) (**P**)
- `display_name` text 1–60 (**P**)
- `avatar_url` text (GitHub avatar URL or our media URL) (**P**)
- `bio` ≤160 (**P**) · `location_text` ≤60 (**P**) · `links` jsonb ≤5 items `[{label≤30, outbound_link_id}]` (**P**)
- `open_to_collaborate` bool default false (**P**)
- `email` citext null (**S**) · `email_verified_at` timestamptz null (**S**)
- `trust_level` smallint not null default 0, check 0–3
- `state` user_state not null default 'active' · `restricted_until` timestamptz null
- `pinned_project_ids` uuid[] ≤6
- `last_seen_at`, `deletion_requested_at`, `deleted_at`
- IX: (`state`), trigram on `handle`, `display_name` (search uses `public_profiles` view/snapshot, §6)

**terms_acceptances** — `id`, `user_id` → users (cascade), `terms_version`, `privacy_version`, `guidelines_version` text, `adult_confirmed` bool not null, `accepted_at`, `ip_hash` bytea. IX (`user_id`, `accepted_at desc`).

**invites** — `id`, `code_hash` bytea UQ (SHA-256 of the code), `created_by` → users, `max_uses` int ≥1, `used_count` int default 0, `expires_at`, `note` ≤200, `revoked_at`. **invite_redemptions** — `invite_id` → invites, `user_id` → users UQ, `redeemed_at`.

**oauth_states** — `state_hash` bytea PK, `purpose` text check in ('signin','install'), `pre_session_hash` bytea (from a short-lived HttpOnly cookie set at start), `user_id` uuid null (install), `code_verifier_enc` bytea null (signin; AES-GCM), `return_to` text (validated relative path), `expires_at` (now+10 min), `consumed_at` null. Purge job hourly.

**sessions** — `id_hash` bytea PK (HMAC-SHA256(token, pepper)), `user_id` → users (cascade), `created_at`, `last_seen_at`, `idle_expires_at`, `absolute_expires_at`, `reauth_at` (last fresh GitHub auth), `ua_summary` ≤80, `ip_country` char(2), `revoked_at`. IX (`user_id`) where `revoked_at` is null.

**security_events** (user-visible log) — `id`, `user_id` → users (cascade), `type` text, `details` jsonb (non-sensitive), `ip_country`, `created_at`. IX (`user_id`, `created_at desc`). Retention 12 months.

**staff_users** — `user_id` PK → users, `role` staff_role, `active` bool, `granted_by` → users, `granted_at`, `revoked_at`. **staff_webauthn_credentials** — `id`, `user_id` → staff_users, `credential_id` bytea UQ, `public_key` bytea, `counter` bigint, `transports` text[], `created_at`, `last_used_at`. **staff_sessions** — same shape as sessions plus `webauthn_verified_at`; admin app only.

## 3. GitHub integration

**github_installations** — `installation_id` bigint PK, `account_id` bigint, `account_login` text, `account_type` text check in ('User','Organization'), `bound_user_id` → users null, `state` text check in ('active','suspended','deleted','refused_org'), `permissions` jsonb, `updated_at`. IX (`bound_user_id`).

**eligible_repos** (cache; **public repos owned by the bound user only**) — `github_repo_id` bigint PK, `installation_id` → github_installations (cascade), `owner_github_id` bigint, `full_name` text, `description` ≤350, `html_url`, `homepage` text null, `language` text null, `is_fork` bool, `pushed_at`, `fetched_at`. Rows with `private=true` or `owner_github_id ≠ bound user` are **never inserted** (SI-07).

**repo_links** — `id`, `project_id` → projects UQ (cascade), `github_repo_id` bigint not null, `installation_id` bigint null, `owner_github_id` bigint, `full_name`, `html_url`, `is_fork` bool, `parent_full_name` null, `license_spdx` null, `languages` jsonb (name→bytes), `topics` text[], `stars` int, `repo_created_at`, `pushed_at`, `state` repo_link_state, `unverified_reason` null, `etag` text null, `verified_at`, `last_reconciled_at`. **Partial UQ** (`github_repo_id`) where `state in ('pending','verified','unverified')`. IX (`installation_id`), (`state`, `last_reconciled_at`).

**webhook_deliveries** — `delivery_guid` uuid PK, `event` text, `action` text null, `installation_id` bigint null, `received_at`, `status` text check in ('queued','processed','ignored','failed'), `attempts` int, `last_error` ≤500, `processed_at`. Retention 30 days. **No payload stored** (re-fetch from the API instead).

## 4. Projects

**projects** — `id`, `owner_user_id` → users, `state` project_state default 'draft', `stage` project_stage default 'idea', `code_status` code_status, `category` text, `title` 3–60, `value_line` 10–120, `overview_md` ≤10000, `overview_html` (sanitised cache), `features` jsonb ≤12×≤120, `works_today` 10–500, `limitations` ≤1000, `platforms` text[], `stack` text[] ≤12×≤24, `demo_kind` demo_kind default 'none', `demo_link_id` → outbound_links null, `video_link_id` → outbound_links null, `credits_md` ≤2000, `credits_html`, `cover_media_id` → media_assets null, `contains_ai_media` bool default false, `comment_policy` text check in ('everyone','tl2','followed') default 'everyone', `public_fields` jsonb default `{"repo_name":true,"languages":true,"licence":true,"topics":true,"stars":false}`, `attested_at` null, `attestation_version` null, `slug` citext UQ null (set at first publish, never reused), `published_version` int default 0, `review_note` (staff) **S**, `indexing_approved` bool default false, `restricted` bool default false, `legal_hold` bool default false, `published_at`, `archived_at`, `soft_deleted_at`, `idempotency_key` text UQ null. Checks: `stage='working_demo' ⇒ demo_kind <> 'none'`; `code_status='public_github' ⇒ exists repo_link`, enforced in the service. IX (`owner_user_id`, `state`).

**project_media** — `project_id` → projects (cascade), `media_id` → media_assets, `position` smallint, `is_cover` bool. PK (`project_id`, `media_id`). Partial UQ (`project_id`) where `is_cover`.

**project_members** — `id`, `project_id` → projects (cascade), `user_id` → users, `role` member_role, `invited_by` → users, `invited_at`, `accepted_at` null, `removed_at` null. Partial UQ (`project_id`, `user_id`) where `removed_at is null`. Partial UQ (`project_id`) where `role='owner' and removed_at is null`. Limit 10 maintainers (service).

**project_transfers** — `id`, `project_id`, `from_user_id`, `to_user_id`, `state` text check in ('pending','accepted','declined','expired','cancelled'), `expires_at` (+14 d), `decided_at`. Partial UQ (`project_id`) where `state='pending'`.

**project_relations** — `from_project_id`, `to_project_id` (check ≠), `created_by`, `created_at`. PK (`from`, `to`).

**project_updates** — `id`, `project_id` → projects (cascade), `author_user_id`, `type` update_type, `title` ≤80, `body_md` ≤2000, `body_html`, `media_id` null, `version_tag` ≤40 null, `state` text check in ('published','hidden','deleted'), `published_at`. IX (`project_id`, `published_at desc`).

## 5. Problems and solutions

**problems** — `id`, `author_user_id` → users, `state` problem_state default 'draft', `visibility` problem_visibility default 'public', `category`, `open_for_solutions` bool default true, `window_start` null, `window_end` null (check `window_end ≥ window_start` and `≤ window_start + 180 days`), `current_revision_id` → problem_revisions null, `slug` citext UQ null, `posted_on_behalf` bool default false, `on_behalf_org_name` ≤100 null (**P**), `intake_id` → operator_intakes null, `outcome_md` ≤3000, `outcome_html`, `outcome_posted_at`, `indexing_approved`, `restricted`, `legal_hold`, `published_at`, `archived_at`, `removed_at`, `idempotency_key` UQ null. IX (`state`, `window_end`), (`author_user_id`).

**problem_revisions** — `id`, `problem_id` → problems (cascade), `version` int, `title` 10–100, `summary` 20–200, `body_md` ≤8000, `body_html`, `requirements` jsonb `[{rid: 1–8, text ≤140, retired: bool}]` (1–8 non-retired; `rid` values never reused), `success_criteria_md` ≤2000, `success_criteria_html`, `change_note` ≤200, `created_by`, `created_at`. UQ (`problem_id`, `version`). A draft problem has a single mutable "draft revision" (version 0); publishing freezes it as v1. Later published edits always insert a new row.

**problem_owners** — `problem_id` → problems (cascade), `user_id`, `role` problem_role, `invited_by`, `accepted_at`, `removed_at`. Partial UQ (`problem_id`, `user_id`) where `removed_at is null`. Exactly one author. ≤3 co-owners.

**operator_intakes** (staff-assisted posting; **S**) — `id`, `owner_name_enc` bytea, `owner_org` ≤100, `owner_contact_enc` bytea, `consent_method` text (email/form/signed), `consent_evidence_id` → evidence null, `verified_by` → staff_users, `verified_at`, `problem_id` null, `handover_user_id` null, `handover_at`, `notes_enc` bytea.

**solution_links** — `id`, `project_id` → projects, `problem_id` → problems, `problem_revision_id` → problem_revisions, `covered_rids` smallint[] (≥1, each must exist and be non-retired in that revision), `relevance_note` 80–600, `state` link_state, `queued_reason` text null, `featured` bool default false, `featured_at`, `featured_by`, `owner_review` ≤280 null, `owner_reviewed_at`, `owner_reviewed_by`, `confirmed_rids` smallint[] default '{}' (⊆ covered_rids), `official_state` official_state default 'none', `official_requested_by` null, `linked_after_window` bool default false, `created_by`, `updated_at`, `hidden_reason` null. UQ (`project_id`, `problem_id`). IX (`problem_id`, `state`), (`project_id`, `state`), (`created_by`, `created_at`) for limits.

**build_intents** — `user_id`, `problem_id`, `note` ≤140, `project_id` null, `created_at`, `last_activity_at`, `expires_at`. PK (`user_id`, `problem_id`). IX (`problem_id`, `expires_at`).

## 6. Public snapshots (the only data public surfaces read)

**public_projects** — `project_id` PK, `slug` UQ, `version` int, `title`, `value_line`, `overview_html`, `facts` jsonb (allowlisted: stage, code_status, demo {kind, link_id, host}, stack, platforms, works_today, limitations, features, category, contains_ai_media, repo {full_name?, html_url?, languages?, licence?, topics?, stars?, is_fork, parent_full_name, created?, pushed?} per `public_fields`), `media` jsonb `[{url, width, height, alt}]`, `cover` jsonb, `owner` jsonb {handle, display_name, avatar_url, github_login?}, `team` jsonb [{handle, display_name}], `solves` jsonb [{problem_slug, title, covered_rids, confirmed_rids, featured, official}], `updated_at_public`, `published_at`, `indexable` bool, `search_tsv` tsvector (generated from title, value_line, stack, category, overview text). IX GIN(`search_tsv`), trigram(`title`), (`published_at desc`).

**public_problems** — `problem_id` PK, `slug` UQ, `version`, `visibility`, `state` (published/archived), `title`, `summary`, `body_html`, `requirements` jsonb, `success_criteria_html`, `category`, `owner` jsonb {handle, display_name, on_behalf_org_name?}, `co_owners` jsonb, `window` jsonb, `open_for_solutions`, `counts` jsonb {solutions, featured, intents}, `outcome_html`, `published_at`, `indexable`, `search_tsv`. Unlisted rows are excluded from search, feeds and sitemaps by query predicate **and** by `indexable=false`.

**public_profiles** — `user_id` PK, `handle` UQ, `display_name`, `avatar_url`, `bio`, `location_text`, `links` jsonb (link IDs + labels + hosts), `github_login`, `open_to_collaborate`, `pinned` jsonb, `search_tsv`. Rebuilt on profile change; removed on suspension or deletion.

**Snapshot builder rule:** each builder function lists output fields explicitly (allowlist). There is no `select *` and no object spread from source rows.

## 7. Social and content

- **follows** — `user_id`, `target_type` follow_target, `target_id`, `created_at`. PK (all three). IX (`target_type`, `target_id`).
- **saves** — `user_id`, `target_type` ('project','problem'), `target_id`. PK.
- **sparks** — `user_id`, `target_type` ('project','update'), `target_id`. PK.
- **comments** — `id`, `target_type` ('project','problem','update'), `target_id`, `author_user_id`, `parent_id` null (one level only), `body_md` ≤2000, `body_html`, `state` ('visible','hidden','deleted'), `edited_at`, `anonymised` bool. IX (`target_type`, `target_id`, `created_at`).
- **suggestions** — `id`, `project_id`, `author_user_id`, `kind` suggestion_kind, `title` ≤100, `fields` jsonb {what_happened≤1000, expected≤500, steps≤1000, environment≤300}, `media_id` null, `visibility` ('public','maintainers'), `state` ('open','closed','resolved','hidden').
- **security_reports** (**S**) — `id`, `project_id`, `reporter_user_id`, `body_enc` bytea, `state` ('new','acknowledged','resolved','abusive'), `acknowledged_at`. Grants: app role only via service; never joined into public queries.
- **blocks** — `user_id`, `blocked_user_id`, PK pair. **mutes** — `user_id`, `target_type` ('user','project','problem','thread'), `target_id`, PK.
- **notifications** — `id`, `user_id`, `type`, `batch_key` text, `actor_count` int, `payload` jsonb (IDs + public titles only), `read_at`, `created_at`, `expires_at` (+90 d). IX (`user_id`, `created_at desc`); partial IX unread. **notification_prefs** — `user_id`, `type`, `in_app` bool, `email` bool, PK (`user_id`, `type`).
- **email_outbox** — `id`, `user_id` null, `to_email` citext (**S**), `template`, `payload` jsonb, `state` ('queued','sent','failed','suppressed'), `attempts`, `provider_message_id`, `sent_at`. Purge after 30 days. **email_suppressions** — `email_hash` PK, `reason`.
- **email_verifications** — `token_hash` PK, `user_id`, `email`, `expires_at` (+24 h), `used_at`.

## 8. Media, links, stats

- **media_assets** — `id`, `owner_user_id`, `purpose` media_purpose, `bucket` text, `storage_key` text UQ, `variants` jsonb [{w, key, bytes}], `mime`, `width`, `height`, `bytes`, `sha256` bytea, `alt_text` ≤250, `state` media_state, `rejected_reason`. IX (`owner_user_id`, `created_at`). Quota checks use this table.
- **outbound_links** — `id`, `url` text UQ (normalised), `host` text, `display_host` text (punycode), `kind` ('demo','video','profile','markdown'), `webrisk_status`, `webrisk_checked_at`, `disabled` bool, `disabled_reason`, `created_by`. IX (`host`), (`webrisk_status`, `webrisk_checked_at`).
- **daily_counters** — `target_type`, `target_id`, `day` date, `metric` text ('view','demo_click','share_click','badge_referral','follow','save','profile_view'), `count` int. PK (all four). **view_dedupe** — `key_hash` bytea, `day` date, PK; purged daily (the salt rotates daily and is held in memory/config only).
- **staff_picks** — `id`, `target_type` ('project','problem'), `target_id`, `note` ≤140, `picked_by`, `picked_at`, `expires_at`.

## 9. Trust, moderation, legal

- **reports** — `id`, `reporter_user_id` null, `reporter_contact_enc` null (guest form), `target_type` content_target, `target_id`, `category` report_category, `body` ≤2000, `case_id` → cases, `created_at`. IX (`target_type`, `target_id`), (`reporter_user_id`, `created_at`).
- **cases** — `id`, `type` case_type, `priority`, `state` case_state, `title` ≤140, `target_type` null, `target_id` null, `sla_due_at`, `statutory_due_at` null, `statutory_basis` text null (e.g. "IT Rules r.3(1)(d) as amended — confirm with counsel"), `assignee_id` → staff_users null, `decision` case_decision null, `reason_code` text null, `decision_note` ≤2000, `second_approver_id` null, `appeal_of_case_id` null, `legal` jsonb null {issuing_authority, order_reference, received_at, received_via, verified_authentic, verified_by}, `opened_at`, `resolved_at`. IX (`state`, `statutory_due_at`), (`state`, `priority`, `sla_due_at`).
- **case_events** — `id`, `case_id`, `actor_id`, `event`, `data` jsonb, `created_at` (append-only).
- **evidence** (**S**) — `id`, `case_id`, `bucket`, `storage_key`, `sha256`, `captured_at`, `retain_until`, `legal_hold` bool.
- **moderation_actions** — `id`, `case_id` null, `actor_type` ('staff','system'), `actor_id` null, `rule_id` text null (auto actions), `action` ('hide','restore','restrict_user','unrestrict_user','disable_link','disable_domain','queue','approve','reject','remove'), `target_type`, `target_id`, `reason_code`, `created_at`. Explains every automatic or manual action.
- **break_glass_access** — `id`, `staff_user_id`, `case_id` not null, `resource_type`, `resource_id`, `justification` 20–500, `created_at`.
- **macros** — `id`, `name`, `category`, `body_template`, `created_by`.
- **data_requests** — `id`, `user_id` null, `kind` ('export','deletion','correction','access','grievance_followup'), `state`, `due_at`, `case_id`. **data_exports** — `id`, `user_id`, `state`, `storage_key`, `ready_at`, `expires_at` (+24 h). **account_deletions** — `user_id` PK, `requested_at`, `scheduled_for` (+14 d), `delete_comments` bool, `cancelled_at`, `completed_at`.
- **broadcasts** — `id`, `kind` ('rules_notice','policy_update','maintenance'), `title`, `body_md`, `scheduled_for`, `sent_at`, `recipients_in_app`, `recipients_email`, `created_by`.

## 10. Platform

- **switches** — `key` text PK ('signups','publishing','linking','comments','suggestions','outbound_links','webhook_processing','emails','read_only'), `enabled` bool, `reason` ≤200, `updated_by`, `updated_at`. Defaults: all enabled except `read_only` (disabled). Cached in memory ≤10 s.
- **rate_limits** — `bucket` text, `window_start` timestamptz, `count` int, PK (`bucket`, `window_start`). Purge > 2 days.
- **audit_events** (append-only; the app role has INSERT + SELECT only) — `id`, `occurred_at`, `actor_type` ('guest','member','staff','system'), `actor_id` null, `action` text (dot-namespaced, e.g. `project.published`), `target_type`, `target_id`, `before_hash` bytea null, `after_hash` bytea null, `reason_code` null, `case_id` null, `request_id`, `ip_hash` null, `ua_hash` null, `prev_hash` bytea (hash chain), `row_hash` bytea. IX (`target_type`, `target_id`, `occurred_at`), (`actor_id`, `occurred_at`).
- **job tables** — managed by pg-boss in schema `pgboss`.

## 11. State machines (allowed transitions; services must reject others with ConflictError)

**Project:** draft→in_review (submit, beta TL0/TL1) · draft→published (TL2+) · in_review→published (staff approve) · in_review→draft (staff reject with note / owner withdraws) · published→unpublished · unpublished→published · published→archived · archived→published (owner unarchives) · {draft, unpublished, archived, published}→soft_deleted · soft_deleted→{previous state} (owner restore within 14 d) · soft_deleted→(hard delete job). Flags `restricted` and `legal_hold` overlay any state: restricted hides from public; legal_hold blocks hard delete.

**Repo link:** pending→verified · verified→unverified(reason) · unverified→verified (re-verify) · verified|unverified→source_gone (repo deleted) · any→(deleted with project or on "convert to manual").

**Problem:** draft→in_review|published · in_review→published|draft · published→archived · archived→published (author) · published|archived→removed (staff) · removed→published (staff restore on appeal).

**Solution link:** (create)→queued|visible · queued→visible (auto-promotion or staff) · queued→removed (staff reject / linker withdraws) · visible→hidden (moderation) · hidden→visible (restore) · visible|hidden→removed (linker deletes or staff removes).

**Official:** none→requested_by_project|requested_by_problem→confirmed · confirmed→suspended (dispute) → confirmed|none · any→none (either side withdraws).

**Account:** active↔locked (security hold) · active→restricted→active (auto at `restricted_until`) · active→suspended (two-person) → active (appeal) · active→deletion_pending→deleted (after 14 d) · deletion_pending→active (cancel) · any→recovery flow (two-person) → active with new github_user_id.

## 12. Database roles and grants
- `migrator`: DDL (CI/deploy only).
- `app`: DML on app tables; on `audit_events` and `case_events` only INSERT/SELECT; no access to `staff_*` tables except via admin views.
- `admin_app`: app grants + staff tables + evidence metadata.
- `readonly_ops`: SELECT on ops views (jobs, webhook_deliveries counts) without content tables.
