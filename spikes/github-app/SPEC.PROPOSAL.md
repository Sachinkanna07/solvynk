# Solvynk GitHub App specification — proposal for founder review

Status: **PROPOSED, NOT AUTHORITATIVE** · 2026-10-25 · Phase P / T-004 preparation

This proposal uses the accepted product, security, architecture, data-model, and route records. It does not amend `docs/07_GITHUB_APP.md`; that accepted file was not found in the current worktrees or available Git history. No development GitHub App, callback receiver, webhook endpoint, account session, repository import, or live test is claimed here. The static V4 prototype remains separate.

## 1. Scope and authority

- Sign-in proves GitHub identity. It does not install the App or select repositories. New beta accounts remain subject to invite, Terms, and age checks in F-01. Production session creation waits for M0 and its authorized implementation task.
- Repository connection is a separate, explicit installation on the member's **personal** GitHub account. V1 imports only selected, public repositories owned by that same numeric GitHub user ID. Organization installations are refused. Manually entered private-source projects remain possible without importing private GitHub facts.
- The App requests repository **Metadata: read** only. No Contents, account email, organization, or write permission; no README import; no GitHub write API calls. GitHub Apps use fine-grained app permissions, not OAuth `repo` scopes. Never request `offline_access`.
- No user access or refresh token is persisted, logged, returned to the browser, or put in a URL. A fresh user token exists only during an authorized request and is discarded. Any installation token for later metadata reconciliation is also short-lived and memory-only.
- `Sachinkanna07` is the sole founder setup and initial real-test account. Product code must bind users by numeric `github_user_id`, not by that login string.

Authority: `docs/06_SECURITY_INVARIANTS.md` SI-01–07, SI-09–16, SI-29–32; `docs/02_DECISIONS.md` D-003–005, D-017, D-035, D-037, D-041; `docs/01_PRODUCT_SPEC.md` F-01 and F-05; `docs/03_ARCHITECTURE.md` §4; `docs/04_DATA_MODEL.md` §2–3; `docs/05_API_AND_ROUTES.md` §1, §4, §6.

## 2. Registration profile to prepare

| Setting | Proposed development value or rule |
|---|---|
| Owner | Personal account `Sachinkanna07` only. Confirm the GitHub account shown before creation. |
| Name | A unique, identifiable development name such as `Solvynk Dev Sachinkanna07` (availability must be checked by GitHub). This is a registration label, not a hardcoded product value. |
| Description | “Development test for Solvynk GitHub sign-in and public personal repository metadata import.” |
| Homepage URL | Use a verified development website URL when one exists. GitHub permits a public source-repository URL if there is no dedicated site; `https://github.com/Sachinkanna07/solvynk` is a candidate, not a claim that the website runs there. |
| Callback URL | The existing architecture proposes `http://app.localhost:3000/auth/github/callback`. This host resolves to loopback on this Windows machine, but port 3000 is not listening and `apps/web` has no runnable auth handler. It is a **planned registration value**, subject to GitHub form acceptance and founder approval, not a working callback. Disable callback wildcard matching. Do not run OAuth until the receiver is implemented and verified. |
| User authorization token expiry | Leave GitHub's expiring-token setting enabled. Do not request `offline_access`; discard any token response after the request. |
| Request user authorization during installation | D-037 provisionally says **on**. This sends the installer into an automatic OAuth flow and removes the Setup URL field. It is an S-03/S-04 spike question, not an accepted security result. |
| Device flow | Off; the product uses a web flow. |
| Setup URL | Unused under provisional D-037. If the founder later approves an explicit post-install OAuth flow instead, turn automatic authorization **off**, use a verified Setup URL, and retain a separate OAuth callback. |
| Webhook | Do not activate until a reachable HTTPS receiver and secret are ready. Then configure `/api/github/webhook`, enable SSL verification, and subscribe only to relevant metadata events. A local `*.localhost` URL is not reachable from GitHub. |
| Repository permissions | Metadata: read only. All other repository permissions: no access. |
| Organization/account permissions | No access. No organization repository import. |
| Installation availability | “Only on this account” for this development App. The eventual multi-user App needs a separate approved registration strategy. |
| Installation selection | Choose **Only select repositories**, with a public personal test repository. Do not choose “All repositories.” |

GitHub's UI states that installation selection limits the installation, but public repositories can still be generally readable by the App. Solvynk must enforce the user's selected-installation list in addition to GitHub API access. Test the exact API semantics before treating selection as proven.

## 3. Flow A — identity authorization

1. `GET /auth/github/start` validates a relative `returnTo`, creates a random single-use state expiring within 10 minutes, binds it to a short-lived pre-session cookie, and creates a PKCE S256 verifier/challenge. Only the state hash and encrypted verifier may be retained temporarily.
2. Redirect to GitHub's GitHub App user-authorization web flow with `client_id`, exact registered `redirect_uri`, `state`, `code_challenge`, and `code_challenge_method=S256`. Omit `offline_access`. This step requests identity, not installation or repository selection.
3. `GET /auth/github/callback` rejects missing, expired, mismatched, replayed, or wrong-purpose state and any pre-session mismatch. Consume state once, exchange the code with the verifier, and call `GET /user`. Treat the code and token as secret request memory.
4. Key identity on numeric GitHub user ID. A production implementation must enforce invite, Terms, age, and session rules before completing sign-in. A T-004 spike may prove `GET /user` and show a non-persistent identity result without creating a production user or session.
5. Discard the token and redirect only to an allowlisted relative path. Never log callback query strings or token exchange bodies.

GitHub says App user tokens are limited by both user and App permissions; authorization and installation are distinct. The exact consent-screen wording is a live-test observation, not a promise in this proposal.

## 4. Flow B — installation, binding, and repository selection

1. A signed-in member starts at `/github/connect`, reads the personal/public/selected-repository explanation, and initiates a random install-purpose state bound to their session and pre-session cookie. Redirect to the actual App slug's `/installations/new?state=…` URL.
2. Under provisional D-037, GitHub starts user authorization during installation and returns to the registered OAuth callback. **T-004 must verify** which parameters GitHub returns, whether install `state` survives, whether a separate `code` is present, and how PKCE can or cannot apply. A callback with a code or `installation_id` but no valid install-purpose state must fail closed.
3. The callback obtains a fresh user token in request memory, calls `GET /user` and `GET /user/installations`, and requires: GitHub user ID equals the existing Solvynk member ID; the candidate installation appears in the fresh list; `account.type === 'User'`; and `account.id === user.github_user_id`. A URL-supplied installation ID alone is never proof. Organization installations are marked/refused without importing repository data.
4. For an eligible installation, call `GET /user/installations/{installation_id}/repositories` using the fresh user token. Paginate the full list. In memory, reject every item unless `private === false` and `owner.id === user.github_user_id`. Persist no private repository name, ID, description, payload, or URL; a count only is allowed. Refuse or require correction if installation selection is not “selected,” subject to T-004 verification of GitHub's response fields.
5. Show only filtered, installation-selected public personal repositories. Revalidate the chosen repository by numeric ID, ownership, public visibility, and installation access immediately before an import. Prevent a second active project for the same GitHub repo ID. A T-004 import preview uses temporary spike state and makes no production draft.
6. Fetch only allowlisted public metadata with read-only GET calls. `GET /repos/{owner}/{repo}` and `GET /repos/{owner}/{repo}/languages` support the proposed facts; topics and licence identifiers may come from the repository response if present. The preview labels those facts “From GitHub (checked)” and keeps creator-entered claims separate. Do not fetch README or code content.
7. Discard the user token. Future user-scoped actions require a fresh web authorization, because user tokens are not stored. Installation-token use for reconciliation must be restricted to the bound installation and the same public/owner filters.

**Alternative for founder decision after S-03/S-04:** Disable automatic OAuth during installation, configure a separate Setup URL, verify its install state, then initiate a fresh explicit OAuth web flow with PKCE S256 before `GET /user/installations`. GitHub documents that the Setup URL receives a spoofable `installation_id`, and that automatic install OAuth disables the Setup URL. This alternative would change provisional D-037 and needs a recorded decision; it is not silently adopted here.

## 5. Webhooks and lifecycle

- Receiver: `POST /api/github/webhook` reads bounded raw bytes, verifies `X-Hub-Signature-256` using HMAC-SHA256 and a timing-safe comparison **before parsing**. Accept a previous secret only during the documented rotation window of at most one hour. Missing/invalid signatures receive 401.
- Dedupe on `X-GitHub-Delivery`; duplicate delivery returns 200 without reprocessing. Store only delivery metadata, never the raw payload. Enqueue quickly; workers re-fetch authoritative state rather than trusting event content.
- Relevant events: automatic `installation`, `installation_repositories`, and `github_app_authorization`; subscribe to `repository` and, if available with Metadata: read, `public` for visibility and lifecycle hints. Verify the exact registration UI in T-004. Do not add permissions to obtain an unavailable event.
- A removed/suspended installation, removed repository, privatization, transfer, deletion, or authorization revocation must make cached GitHub facts unverified or remove them as appropriate. Production public snapshot/share/search/badge purge must meet the five-minute invariant. T-004 verifies state transitions in an isolated spike and records the remaining production work.
- Failed-delivery redelivery is hourly; installation/repository reconciliation is nightly; identity refresh is weekly per D-035. Unavailable GitHub APIs fail closed for new imports while retaining safe, clearly marked prior state only as the accepted lifecycle rules permit.

## 6. Security and negative-path acceptance matrix

| Case | Required result |
|---|---|
| Expired, replayed, absent, wrong-purpose, or pre-session-mismatched OAuth state | Reject without token exchange or binding; security event where applicable. |
| Wrong PKCE verifier or reused authorization code | Reject; no identity or installation change. |
| Forged or other-user `installation_id` | Reject after fresh `GET /user/installations`; no binding. |
| Organization installation or owner ID mismatch | Refuse; no repository metadata persisted. |
| All-repositories selection, if GitHub reports it | Require selected-repository correction before import. Verify behavior in T-004. |
| Private, collaborator-owned, transferred, removed, or no-longer-selected repo | Exclude; do not log/store private metadata; invalidate any prior verified link. |
| Duplicate GitHub repo import | Conflict; no second active project. |
| Invalid webhook signature or modified raw body | 401 before JSON parse; no job. |
| Duplicate webhook delivery GUID | 200 no-op; one job at most. |
| Revoked authorization, uninstalled App, suspended App, GitHub 401/403/404/5xx/rate limit | Safe state transition or retry; no false “verified” claim. |
| GitHub write endpoint attempted or permission above Metadata: read | Static allowlist/permission check fails. |
| Token, code, cookie, request body, private repo name in DB/log output | Test failure and evidence cleanup. |

T-004 evidence must distinguish mocked negative-path tests from real GitHub observations with `Sachinkanna07`. It must report exact App settings, tested API behavior, request/response status and redacted facts, state/PKCE outcomes, webhook delivery handling, and limitations. No token, secret, private key, or private repository metadata may appear in the report.

## 7. Founder registration steps — prepare, then execute after approval

1. Confirm this proposal and approve the documented `app.localhost:3000` callback plan plus S-03/S-04 verification of D-037. `app.localhost` currently resolves to loopback, but port 3000 is not listening. The current `127.0.0.1:4173` process serves a static prototype; it cannot exchange OAuth codes or receive GitHub webhooks. If GitHub rejects the planned callback in its registration form, stop and bring back the exact validation error rather than substituting another URL.
2. Sign in to GitHub as **`Sachinkanna07`**. Open Settings → Developer settings → GitHub Apps → New GitHub App. Confirm the owner is the personal `Sachinkanna07` account.
3. Enter the unique development name, description, verified Homepage URL, and the founder-approved planned callback URL `http://app.localhost:3000/auth/github/callback`. Disable callback wildcard matching. Leave expiring user tokens on and device flow off. App registration can precede the receiver; do not initiate authorization until T-004 implements and verifies that receiver at the registered URL.
4. For the initial D-037 spike, enable “Request user authorization (OAuth) during installation”; leave Setup URL blank. If the founder approves the alternative, turn that option off and enter the separately verified Setup URL instead. Never enter a placeholder URL that would receive live codes.
5. Set repository Metadata to **Read-only** and every other repository, organization, and account permission to **No access**. Configure installation availability as “Only on this account.” Review GitHub's summary before submitting.
6. Leave webhook inactive until a reachable HTTPS URL ending in `/api/github/webhook` and a server-side secret are ready. Then enable webhook, enable SSL verification, add the relevant event subscriptions, and use GitHub's delivery UI to test signed deliveries. A local loopback URL alone cannot receive GitHub deliveries.
7. Create the App. Record only non-secret identifiers (App ID, client ID, slug, owner, selected settings) in a local redacted setup record. Store client secret, private key, and webhook secret only in a local secret store/environment ignored by Git; never paste them into chat or this repository.
8. Install on the personal account and choose **Only select repositories**, initially one public personal test repository. Do not install on an organization. Run the T-004 real-user test only after the callback and webhook paths, secret handling, and negative-path tests are ready.

## 8. Open verification and production boundary

- **S-03/S-04:** Actual callback parameters, install-state preservation, automatic-install OAuth behavior, and PKCE feasibility under D-037. If state cannot be validated, no installation is bound. A recorded founder decision is required before changing D-037.
- Verify GitHub accepts the documented exact local callback URL during registration. After founder approval and App creation, implement the isolated receiver at that URL and verify it before any OAuth round-trip. Confirm selected-repository API semantics, Metadata-only facts, and relevant webhook event availability with the registered development App.
- Resolve a secure, reachable HTTPS webhook endpoint for live delivery. Do not expose a local webhook without signature verification or relay private payloads through an unapproved third party.
- Production F-01/F-05 needs the authorized post-M0 web app, DB migrations, sessions, service authorization, audit, snapshot purge, jobs, operational controls, and full security suites. This proposal and future spike do not implement them.

**T-004 acceptance recommendation today:** NOT READY. Founder approval of this specification, a verified callback architecture, and a founder-created development App are prerequisites to isolated code and real-account tests.

## Source references

Repository: the local authority files cited in §1. Current GitHub documentation checked 2026-10-25:

- [Registering a GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app)
- [User authorization and PKCE](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [Callback URL and wildcard matching](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/about-the-user-authorization-callback-url)
- [Setup URL and spoofed installation IDs](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/about-the-setup-url)
- [Installation URL state](https://docs.github.com/en/apps/sharing-github-apps/sharing-your-github-app)
- [List user installations and installation repositories](https://docs.github.com/en/rest/apps/installations)
- [Repository metadata and languages](https://docs.github.com/en/rest/repos/repos)
- [GitHub App webhook events](https://docs.github.com/en/webhooks/webhook-events-and-payloads)
- [Webhook signature validation](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)
- [Installing your own App](https://docs.github.com/en/apps/using-github-apps/installing-your-own-github-app)
