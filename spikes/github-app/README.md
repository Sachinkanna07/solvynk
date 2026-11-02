# T-004 local GitHub App experiment

This is a loopback-only Phase P receiver. It does not create a production user, save a GitHub token, import a project, or make the prototype live.

## Local files

- `spikes/github-app/.env.local` is ignored by Git and holds public App identifiers plus **absolute file paths only**. Copy `.env.example` if rebuilding it.
- The private key, OAuth client secret, and optional webhook secret are separate files under `%USERPROFILE%\.config\solvynk\secrets`, outside this repository. Never place secret values in `.env.local`, chat, shell arguments, or screenshots.
- The OAuth client secret file is populated outside the repository for the current development App. The webhook secret file remains empty and GitHub webhooks remain inactive. The receiver rejects live authorization with HTTP 503 if the client secret is absent at startup.
- If the OAuth client secret must be replaced, use the GitHub App **Credentials** page as `Sachinkanna07`. The founder can run `powershell -NoProfile -File spikes/github-app/save-client-secret.ps1` from the repository root after copying the replacement. This reads the clipboard, writes the prepared external file, clears the clipboard, and prints no secret. Avoid sharing it or saving it in the repository. Restart the receiver after the file changes.

## Commands

From the repo root:

```powershell
pnpm test:github-spike
node --env-file=spikes/github-app/.env.local spikes/github-app/verify-app.mjs
node --env-file=spikes/github-app/.env.local spikes/github-app/server.mjs
```

The server binds **127.0.0.1:3000** and requires `Host: app.localhost:3000`. `GET http://app.localhost:3000/health` reports readiness. Once the client secret and exact GitHub callback are configured, begin with `http://app.localhost:3000/auth/github/start`. For a first installation, the sign-in result points to `/github/connect`; visit that path in the same browser. The installation return must carry the one-time install state and numeric installation ID. Its automatic code, if present, is ignored; the receiver starts a new explicit OAuth authorization with PKCE S256, then verifies the numeric user ID, fresh `/user/installations` membership, personal account type/ID, selected-repository setting, and public personal repository list. If GitHub omits the install state or ID, the receiver rejects it. Do not relax the checks to complete the test.

If GitHub's sudo/passkey step takes longer than the ten-minute install state, the callback fails closed. After signing in again at `/auth/github/start`, use `/github/verify-existing` to verify the already installed App with a fresh PKCE user token and no URL-supplied installation ID. To preview one selected public personal repository, use `/github/verify-existing?repoId=ID` with its numeric ID from the local `/github/result` list. The receiver rechecks installation access and repository visibility before returning allowlisted metadata and language names. The preview is local JSON only; it does not create a draft or store a token.

The webhook route verifies HMAC over bounded raw bytes before JSON parsing and deduplicates delivery IDs in memory. It is a hint-only local test, with no job processor, persistence, or reachable HTTPS webhook endpoint.

GitHub API and OAuth exchange requests have a ten-second timeout. `/github/result` is a one-time, no-store verification snapshot with a `verifiedAt` timestamp; refreshing it requires a fresh verification flow. Starting another installation or verification clears any unread previous result. A failed or timed-out verification must not display an earlier result.

## Limits

This spike keeps state and the local demonstration session only in process memory. Restarting loses them. The HTTP local cookie is not a production session. The local repository list and metadata preview do not import, persist, or publish a project. The observed automatic callback carried the expected fields but its one-time state was rejected after reauthentication; expiry is the likely explanation, not a confirmed cause. A successful automatic handoff remains unproven. A callback lacking valid state is a failure, not an invitation to trust `installation_id`.
