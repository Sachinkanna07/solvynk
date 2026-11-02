import assert from 'node:assert/strict';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import http from 'node:http';
import { after, before, test } from 'node:test';
import { createReceiver, verifyWebhook } from './server.mjs';

const random = () => randomBytes(32).toString('base64url');
const config = { GITHUB_APP_CLIENT_ID: 'Iv23liMoxSkNLblBYBdl', GITHUB_APP_SLUG: 'solvynk-dev', clientSecret: random(), webhookSecret: random() };
const githubId = 194522275;
const installationId = 987654;
const publicRepo = { id: 71, full_name: 'owner/public', private: false, owner: { id: githubId, type: 'User' } };
const privateRepo = { id: 72, full_name: 'owner/private', private: true, owner: { id: githubId, type: 'User' } };
let server;
let port;
let clock = Date.now();
let calls = [];
let installation = { id: installationId, account: { id: githubId, type: 'User' }, repository_selection: 'selected' };
let returnedUser = { id: githubId, type: 'User' };
let detailRepo = { id: publicRepo.id, full_name: publicRepo.full_name, private: false, visibility: 'public', owner: publicRepo.owner, description: 'Public test project', language: 'TypeScript', license: { spdx_id: 'MIT' } };
let exchangeFailure = false;
let failEndpoint = '';
let hangEndpoint = '';
const ok = body => ({ ok: true, json: async () => body });
async function fakeFetch(url, options) {
  calls.push({ url, method: options.method, body: options.body });
  if (url === hangEndpoint) return new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }));
  if (url === failEndpoint) return { ok: false, status: 503 };
  if (url === 'https://github.com/login/oauth/access_token') return ok(exchangeFailure ? { error: 'invalid_grant' } : { access_token: random() });
  if (url === 'https://api.github.com/user') return ok(returnedUser);
  if (url.startsWith('https://api.github.com/user/installations/')) return ok({ repositories: [publicRepo, privateRepo] });
  if (url.startsWith('https://api.github.com/user/installations?')) return ok({ installations: installation ? [installation] : [] });
  if (url === 'https://api.github.com/repos/owner/public') return ok(detailRepo);
  if (url === 'https://api.github.com/repos/owner/public/languages') return ok({ TypeScript: 150, CSS: 25 });
  throw new Error('Unexpected GitHub endpoint');
}
before(async () => {
  server = createReceiver(config, { fetcher: fakeFetch, now: () => clock });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
});
after(async () => { await new Promise(resolve => server.close(resolve)); });
function request(path, cookie = '', host = 'app.localhost:3000', method = 'GET', targetPort = port) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: targetPort, path, method, headers: { Host: host, ...(cookie ? { Cookie: cookie } : {}) } }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: body ? JSON.parse(body) : null }));
    });
    req.on('error', reject);
    req.end();
  });
}
const stateFrom = response => new URL(response.headers.location).searchParams.get('state');
const preFrom = response => response.headers['set-cookie'][0].split(';')[0];

test('receiver rejects invalid host, method and unexpected callback without GitHub call', async () => {
  calls = [];
  assert.equal((await request('/health', '', 'evil.example')).status, 400);
  assert.equal((await request('/health', '', 'app.localhost:3000', 'POST')).status, 405);
  assert.equal((await request('/auth/github/callback?code=x&installation_id=1')).status, 400);
  assert.equal(calls.length, 0);
});

test('sign-in uses PKCE S256 and rejects mismatch, expiry, replay, extra fields', async () => {
  calls = [];
  const start = await request('/auth/github/start');
  const auth = new URL(start.headers.location);
  assert.equal(auth.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(auth.searchParams.get('redirect_uri'), 'http://app.localhost:3000/auth/github/callback');
  assert.equal(auth.searchParams.has('scope'), false);
  const state = auth.searchParams.get('state');
  const pre = preFrom(start);
  assert.equal((await request(`/auth/github/callback?code=${random()}&state=${state}`, `spike_pre=${random()}`)).status, 400);
  assert.equal((await request(`/auth/github/callback?code=${random()}&state=${state}`, pre)).status, 400);
  assert.equal(calls.length, 0);
  const later = await request('/auth/github/start');
  clock += 600_001;
  assert.equal((await request(`/auth/github/callback?code=${random()}&state=${stateFrom(later)}`, preFrom(later))).status, 400);
  assert.equal(calls.length, 0);
  clock -= 600_001;
  const fresh = await request('/auth/github/start');
  assert.equal((await request(`/auth/github/callback?code=${random()}&state=${stateFrom(fresh)}&unexpected=1`, preFrom(fresh))).status, 400);
  assert.equal(calls.length, 0);
});

test('token exchange receives the matching PKCE verifier and fails closed on rejection', async () => {
  calls = [];
  const start = await request('/auth/github/start');
  const challenge = new URL(start.headers.location).searchParams.get('code_challenge');
  const pre = preFrom(start);
  exchangeFailure = true;
  const result = await request(`/auth/github/callback?code=${random()}&state=${stateFrom(start)}`, pre);
  exchangeFailure = false;
  assert.equal(result.status, 502);
  const exchangeCall = calls.find(call => call.url === 'https://github.com/login/oauth/access_token');
  const verifier = new URLSearchParams(exchangeCall.body).get('code_verifier');
  assert.equal(createHash('sha256').update(verifier).digest('base64url'), challenge);
  assert.equal(calls.some(call => call.url === 'https://api.github.com/user'), false);
});

test('GitHub issuer is accepted exactly; a different issuer is rejected before exchange', async () => {
  calls = [];
  const bad = await request('/auth/github/start');
  const badQuery = new URLSearchParams({ code: random(), state: stateFrom(bad), iss: 'https://other.example/oauth' });
  assert.equal((await request(`/auth/github/callback?${badQuery}`, preFrom(bad))).status, 400);
  assert.equal(calls.length, 0);
  const good = await request('/auth/github/start');
  const goodQuery = new URLSearchParams({ code: random(), state: stateFrom(good), iss: 'https://github.com/login/oauth' });
  assert.equal((await request(`/auth/github/callback?${goodQuery}`, preFrom(good))).status, 302);
});

async function signedIn() {
  const start = await request('/auth/github/start');
  const pre = preFrom(start);
  const result = await request(`/auth/github/callback?code=${random()}&state=${stateFrom(start)}`, pre);
  assert.equal(result.status, 302);
  assert.equal(result.headers.location, '/auth/github/result');
  const session = result.headers['set-cookie'][0].split(';')[0];
  assert.equal((await request('/auth/github/result', `${pre}; ${session}`)).body.status, 'identity_verified');
  return { pre, session, cookies: `${pre}; ${session}` };
}

test('installation requires local session, state and fresh PKCE authorization', async () => {
  calls = [];
  assert.equal((await request('/github/connect')).status, 401);
  const member = await signedIn();
  const connect = await request('/github/connect', member.cookies);
  assert.equal(connect.status, 302);
  assert.equal(new URL(connect.headers.location).pathname, '/apps/solvynk-dev/installations/new');
  const state = stateFrom(connect);
  assert.equal((await request(`/auth/github/callback?installation_id=${installationId}&code=${random()}`, member.cookies)).status, 400);
  const count = calls.length;
  const install = await request(`/auth/github/callback?installation_id=${installationId}&code=${random()}&state=${state}`, member.cookies);
  assert.equal(install.status, 302);
  assert.equal(calls.length, count, 'automatic code must not be exchanged');
  assert.equal(new URL(install.headers.location).searchParams.get('code_challenge_method'), 'S256');
  assert.equal((await request(`/auth/github/callback?installation_id=${installationId}&state=${state}`, member.cookies)).status, 400);
});

async function installAttempt() {
  const member = await signedIn();
  const connect = await request('/github/connect', member.cookies);
  const install = await request(`/auth/github/callback?installation_id=${installationId}&state=${stateFrom(connect)}`, member.cookies);
  assert.equal(install.status, 302);
  return { cookies: member.cookies, verifyState: stateFrom(install) };
}

test('ownership, personal account and selected repository gate rejects forged or broad installs', async () => {
  for (const changed of [
    { id: installationId + 1, account: { id: githubId, type: 'User' }, repository_selection: 'selected' },
    { id: installationId, account: { id: githubId + 1, type: 'User' }, repository_selection: 'selected' },
    { id: installationId, account: { id: githubId, type: 'Organization' }, repository_selection: 'selected' },
    { id: installationId, account: { id: githubId, type: 'User' }, repository_selection: 'all' },
  ]) {
    installation = changed;
    const attempt = await installAttempt();
    const result = await request(`/auth/github/callback?code=${random()}&state=${attempt.verifyState}`, attempt.cookies);
    assert.equal(result.status, 400);
    assert.equal(result.body.error, 'Installation not eligible');
  }
  installation = { id: installationId, account: { id: githubId, type: 'User' }, repository_selection: 'selected' };
  const attempt = await installAttempt();
  returnedUser = { id: githubId + 1, type: 'User' };
  assert.equal((await request(`/auth/github/callback?code=${random()}&state=${attempt.verifyState}`, attempt.cookies)).status, 400);
  returnedUser = { id: githubId, type: 'User' };
});

test('eligible public personal repos only are returned and token is never returned', async () => {
  const attempt = await installAttempt();
  const result = await request(`/auth/github/callback?code=${random()}&state=${attempt.verifyState}`, attempt.cookies);
  assert.equal(result.status, 302);
  assert.equal(result.headers.location, '/github/result');
  const clean = await request('/github/result', attempt.cookies);
  assert.deepEqual(clean.body.publicPersonalRepositories, [{ id: 71, fullName: 'owner/public' }]);
  assert.equal(clean.body.excludedCount, 1);
  assert.equal(JSON.stringify(clean.body).includes('owner/private'), false);
  assert.equal(JSON.stringify(clean.body).includes('access_token'), false);
  assert.equal(clean.body.snapshotOnly, true);
  assert.equal(clean.body.verifiedAt, new Date(clock).toISOString());
  assert.equal((await request('/github/result', attempt.cookies)).status, 404, 'a previous verification result cannot be replayed');
  assert.equal((await request(`/auth/github/callback?code=${random()}&state=${attempt.verifyState}`, attempt.cookies)).status, 400);
});

test('a timed-out GitHub request fails closed and leaves no verification result', async () => {
  const shortServer = createReceiver(config, { fetcher: fakeFetch, now: () => clock, timeoutMs: 20 });
  await new Promise(resolve => shortServer.listen(0, '127.0.0.1', resolve));
  const shortPort = shortServer.address().port;
  const shortRequest = (path, cookies = '') => request(path, cookies, 'app.localhost:3000', 'GET', shortPort);
  try {
    const start = await shortRequest('/auth/github/start');
    const pre = preFrom(start);
    const signIn = await shortRequest(`/auth/github/callback?code=${random()}&state=${stateFrom(start)}`, pre);
    assert.equal(signIn.status, 302);
    const cookies = `${pre}; ${signIn.headers['set-cookie'][0].split(';')[0]}`;
    const verify = await shortRequest('/github/verify-existing', cookies);
    hangEndpoint = 'https://api.github.com/user/installations?per_page=100&page=1';
    const result = await shortRequest(`/auth/github/callback?code=${random()}&state=${stateFrom(verify)}`, cookies);
    assert.equal(result.status, 502);
    assert.equal((await shortRequest('/github/result', cookies)).status, 404);
  } finally {
    hangEndpoint = '';
    await new Promise(resolve => shortServer.close(resolve));
  }
});

test('existing installation is verified with a fresh PKCE user token and no URL installation ID', async () => {
  calls = [];
  assert.equal((await request('/github/verify-existing')).status, 401);
  const member = await signedIn();
  const start = await request('/github/verify-existing', member.cookies);
  assert.equal(start.status, 302);
  const authorization = new URL(start.headers.location);
  assert.equal(authorization.pathname, '/login/oauth/authorize');
  assert.equal(authorization.searchParams.get('code_challenge_method'), 'S256');
  const result = await request(`/auth/github/callback?code=${random()}&state=${stateFrom(start)}`, member.cookies);
  assert.equal(result.status, 302);
  assert.equal(result.headers.location, '/github/result');
  const preview = await request('/github/result', member.cookies);
  assert.deepEqual(preview.body.publicPersonalRepositories, [{ id: 71, fullName: 'owner/public' }]);
  assert.equal(preview.body.installationId, String(installationId));
  assert.equal(preview.body.excludedCount, 1);
  assert.equal(JSON.stringify(preview.body).includes('owner/private'), false);
  assert.equal((await request(`/auth/github/callback?code=${random()}&state=${stateFrom(start)}`, member.cookies)).status, 400);

  installation = { id: installationId, account: { id: githubId, type: 'User' }, repository_selection: 'all' };
  const broad = await request('/github/verify-existing', member.cookies);
  assert.equal((await request(`/auth/github/callback?code=${random()}&state=${stateFrom(broad)}`, member.cookies)).status, 400);
  installation = { id: installationId, account: { id: githubId, type: 'User' }, repository_selection: 'selected' };
});

test('import preview rechecks a selected public repo and maps only allowlisted facts', async () => {
  const member = await signedIn();
  assert.equal((await request('/github/verify-existing?repoId=72&repoId=71', member.cookies)).status, 400);
  assert.equal((await request('/github/verify-existing?repoId=not-a-number', member.cookies)).status, 400);
  const start = await request('/github/verify-existing?repoId=71', member.cookies);
  const result = await request(`/auth/github/callback?code=${random()}&state=${stateFrom(start)}`, member.cookies);
  assert.equal(result.status, 302);
  const preview = (await request('/github/result', member.cookies)).body.importPreview;
  assert.deepEqual(preview, { source: 'GitHub (checked)', repositoryId: 71, fullName: 'owner/public', description: 'Public test project', primaryLanguage: 'TypeScript', languages: ['TypeScript', 'CSS'], licenseSpdxId: 'MIT' });
  assert.equal(JSON.stringify(preview).includes('owner/private'), false);

  calls = [];
  const privateStart = await request('/github/verify-existing?repoId=72', member.cookies);
  assert.equal((await request(`/auth/github/callback?code=${random()}&state=${stateFrom(privateStart)}`, member.cookies)).status, 400);
  assert.equal(calls.some(call => call.url.startsWith('https://api.github.com/repos/')), false);

  detailRepo = { ...detailRepo, private: true, visibility: 'private' };
  const changedStart = await request('/github/verify-existing?repoId=71', member.cookies);
  assert.equal((await request(`/auth/github/callback?code=${random()}&state=${stateFrom(changedStart)}`, member.cookies)).status, 400);
  detailRepo = { ...detailRepo, private: false, visibility: 'public' };
});

test('removed installation and GitHub API failure cannot create a verified preview', async () => {
  const member = await signedIn();
  installation = null;
  const removed = await request('/github/verify-existing?repoId=71', member.cookies);
  assert.equal((await request(`/auth/github/callback?code=${random()}&state=${stateFrom(removed)}`, member.cookies)).status, 400);
  assert.equal((await request('/github/result', member.cookies)).status, 404);
  installation = { id: installationId, account: { id: githubId, type: 'User' }, repository_selection: 'selected' };
  failEndpoint = 'https://api.github.com/repos/owner/public';
  const unavailable = await request('/github/verify-existing?repoId=71', member.cookies);
  assert.equal((await request(`/auth/github/callback?code=${random()}&state=${stateFrom(unavailable)}`, member.cookies)).status, 502);
  assert.equal((await request('/github/result', member.cookies)).status, 404);
  failEndpoint = '';
});

test('webhook verifies raw HMAC before JSON parsing and deduplicates delivery', async () => {
  const raw = Buffer.from('{"action":"created"}');
  const signature = `sha256=${createHmac('sha256', config.webhookSecret).update(raw).digest('hex')}`;
  assert.equal(verifyWebhook(raw, signature, config.webhookSecret), true);
  assert.equal(verifyWebhook(Buffer.from('{"action":"deleted"}'), signature, config.webhookSecret), false);
  const delivery = '11111111-1111-4111-8111-111111111111';
  async function post(body, sig) {
    return new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port, path: '/api/github/webhook', method: 'POST', headers: { Host: 'app.localhost:3000', 'X-Hub-Signature-256': sig, 'X-GitHub-Delivery': delivery } }, res => {
        let text = '';
        res.on('data', chunk => { text += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(text) }));
      });
      req.on('error', reject);
      req.end(body);
    });
  }
  assert.equal((await post(raw, 'sha256=' + '0'.repeat(64))).status, 401);
  assert.equal((await post(Buffer.from('invalid json'), 'sha256=' + createHmac('sha256', config.webhookSecret).update('invalid json').digest('hex'))).status, 400);
  assert.equal((await post(raw, signature)).status, 202);
  assert.equal((await post(raw, signature)).status, 200);
});
