// Isolated Phase P experiment. No production account, session, database, or import.
import http from 'node:http';
import { createHash, createHmac, createPrivateKey, randomBytes, sign, timingSafeEqual } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const origin = 'http://app.localhost:3000';
const callback = `${origin}/auth/github/callback`;
const stateTtl = 10 * 60_000;
const sessionTtl = 30 * 60_000;
const requestTimeoutMs = 10_000;
const stateSchema = z.object({ state: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).strict();
const codeSchema = z.object({ code: z.string().min(1).max(512).regex(/^[A-Za-z0-9_-]+$/) }).strict();
const installSchema = z.object({ installation_id: z.string().regex(/^[1-9][0-9]{0,15}$/), setup_action: z.enum(['install', 'update']).optional() }).strict();
const configSchema = z.object({
  GITHUB_APP_ID: z.coerce.number().int().positive(),
  GITHUB_APP_CLIENT_ID: z.string().regex(/^Iv[0-9A-Za-z]+$/),
  GITHUB_APP_SLUG: z.literal('solvynk-dev'),
  GITHUB_APP_PRIVATE_KEY_FILE: z.string().min(1),
  GITHUB_APP_CLIENT_SECRET_FILE: z.string().min(1),
  GITHUB_APP_WEBHOOK_SECRET_FILE: z.string().min(1),
}).strict();
const sha = value => createHash('sha256').update(value).digest('base64url');
const random = () => randomBytes(32).toString('base64url');
const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'" };

function outsideRepository(path) {
  if (!isAbsolute(path)) throw new Error('Secret path must be absolute');
  const repo = realpathSync(resolve(fileURLToPath(new URL('../../', import.meta.url))));
  const file = realpathSync(path);
  const rel = relative(repo, file);
  if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) throw new Error('Secret file is inside the repository');
  return file;
}

export function loadConfig(env = process.env) {
  const parsed = configSchema.parse(Object.fromEntries(Object.keys(configSchema.shape).map(k => [k, env[k]])));
  if (parsed.GITHUB_APP_ID !== 5465064 || parsed.GITHUB_APP_CLIENT_ID !== 'Iv23liMoxSkNLblBYBdl') throw new Error('Unexpected development App identity');
  const keyPath = outsideRepository(parsed.GITHUB_APP_PRIVATE_KEY_FILE);
  const secretPath = outsideRepository(parsed.GITHUB_APP_CLIENT_SECRET_FILE);
  const webhookPath = outsideRepository(parsed.GITHUB_APP_WEBHOOK_SECRET_FILE);
  const key = createPrivateKey(readFileSync(keyPath));
  if (key.asymmetricKeyType !== 'rsa') throw new Error('GitHub App key must be RSA');
  const clientSecret = readFileSync(secretPath, 'utf8').trim();
  if (clientSecret && !/^[A-Za-z0-9_]{20,200}$/.test(clientSecret)) throw new Error('Malformed client secret file');
  const webhookSecret = readFileSync(webhookPath, 'utf8').trim();
  return { ...parsed, key, clientSecret, webhookSecret };
}

export function appJwt(config, now = Date.now()) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claims = Buffer.from(JSON.stringify({ iat: Math.floor(now / 1000) - 60, exp: Math.floor(now / 1000) + 540, iss: String(config.GITHUB_APP_ID) })).toString('base64url');
  const input = `${header}.${claims}`;
  return `${input}.${sign('RSA-SHA256', Buffer.from(input), config.key).toString('base64url')}`;
}

export async function verifyApp(config, fetcher = fetch) {
  const response = await fetcher('https://api.github.com/app', { method: 'GET', headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${appJwt(config)}`, 'X-GitHub-Api-Version': '2022-11-28' }, redirect: 'error', signal: AbortSignal.timeout(requestTimeoutMs) });
  if (!response.ok) throw new Error(`App authentication failed: HTTP ${response.status}`);
  const app = await response.json();
  if (app.id !== config.GITHUB_APP_ID || app.slug !== config.GITHUB_APP_SLUG) throw new Error('App identity mismatch');
  if (app.permissions?.metadata !== 'read' || Object.keys(app.permissions ?? {}).some(k => k !== 'metadata')) throw new Error('App permissions exceed Metadata: read');
  return { id: app.id, slug: app.slug, metadata: 'read' };
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(part => part.trim().split('=')).filter(parts => parts.length === 2 && /^[A-Za-z0-9_-]+$/.test(parts[0]) && /^[A-Za-z0-9_-]+$/.test(parts[1])));
}
function cookie(name, value, maxAge) { return `${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`; }
function answer(res, status, value, extra = {}) { res.writeHead(status, { ...jsonHeaders, ...extra }); res.end(JSON.stringify(value)); }
function redirect(res, location, cookies = []) { res.writeHead(302, { ...jsonHeaders, Location: location, ...(cookies.length ? { 'Set-Cookie': cookies } : {}) }); res.end(); }

async function githubJson(fetcher, path, token, timeoutMs) {
  const route = path.split('?')[0];
  const repoParts = route.split('/');
  const validRepoPart = value => /^(?!\.{1,2}$)[A-Za-z0-9_.-]{1,100}$/.test(value ?? '');
  const repoRead = (repoParts.length === 4 || (repoParts.length === 5 && repoParts[4] === 'languages'))
    && repoParts[1] === 'repos' && validRepoPart(repoParts[2]) && validRepoPart(repoParts[3]);
  if (!/^\/(user(?:\/installations(?:\/[1-9][0-9]*\/repositories)?)?|app)$/.test(route) && !repoRead) throw new Error('GitHub endpoint not allowlisted');
  const response = await fetcher(`https://api.github.com${path}`, { method: 'GET', headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' }, redirect: 'error', signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
  return response.json();
}
async function pages(fetcher, path, token, key, timeoutMs) {
  const items = [];
  for (let page = 1; page <= 20; page++) {
    const data = await githubJson(fetcher, `${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`, token, timeoutMs);
    if (!Array.isArray(data[key]) || data[key].length > 100) throw new Error('Unexpected GitHub list');
    items.push(...data[key]);
    if (data[key].length < 100) return items;
  }
  throw new Error('GitHub list exceeded spike limit');
}
async function exchange(fetcher, config, code, verifier, timeoutMs) {
  const response = await fetcher('https://github.com/login/oauth/access_token', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: config.GITHUB_APP_CLIENT_ID, client_secret: config.clientSecret, code, code_verifier: verifier, redirect_uri: callback }).toString(),
  });
  if (!response.ok) throw new Error(`OAuth exchange HTTP ${response.status}`);
  const body = await response.json();
  if (body.error || typeof body.access_token !== 'string' || body.access_token.length < 10) throw new Error('OAuth exchange rejected');
  return body.access_token;
}
function authorizeUrl(config, state, verifier) {
  const u = new URL('https://github.com/login/oauth/authorize');
  u.searchParams.set('client_id', config.GITHUB_APP_CLIENT_ID);
  u.searchParams.set('redirect_uri', callback);
  u.searchParams.set('state', state);
  u.searchParams.set('code_challenge', sha(verifier));
  u.searchParams.set('code_challenge_method', 'S256');
  return u.href;
}

export function verifyWebhook(raw, signature, secret) {
  if (!secret || !/^sha256=[0-9a-f]{64}$/.test(signature ?? '')) return false;
  const expected = `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`;
  return equal(expected, signature);
}

export function createReceiver(config, { fetcher = fetch, now = Date.now, timeoutMs = requestTimeoutMs } = {}) {
  const states = new Map();
  const sessions = new Map();
  const deliveries = new Set();
  const observed = { signinsVerified: 0, installationsVerified: 0, lastCallbackRejection: null, lastCallbackShape: null };
  function newState(kind, pre, extra = {}) {
    for (const [hash, item] of states) if (item.expires <= now()) states.delete(hash);
    if (states.size >= 128) throw new Error('Too many pending OAuth states');
    const state = random();
    const verifier = kind === 'install' ? null : random();
    states.set(sha(state), { kind, preHash: sha(pre), verifier, expires: now() + stateTtl, ...extra });
    return { state, verifier };
  }
  function consume(state, pre) {
    const parsed = stateSchema.safeParse({ state });
    if (!parsed.success || !/^[A-Za-z0-9_-]{43}$/.test(pre ?? '')) return null;
    const hash = sha(state);
    const item = states.get(hash);
    states.delete(hash);
    return item && item.expires > now() && equal(item.preHash, sha(pre)) ? item : null;
  }
  function localSession(cookies) {
    const id = cookies.spike_session;
    if (!/^[A-Za-z0-9_-]{43}$/.test(id ?? '')) return null;
    const item = sessions.get(sha(id));
    return item && item.expires > now() ? item : null;
  }
  async function handler(req, res) {
    // This server has no access from non-loopback interfaces and rejects hostile Host headers.
    if (req.headers.host !== 'app.localhost:3000') return answer(res, 400, { error: 'Invalid host' });
    let url;
    try { url = new URL(req.url, origin); } catch { return answer(res, 400, { error: 'Invalid request' }); }
    if (url.origin !== origin || url.username || url.password || url.hash) return answer(res, 400, { error: 'Invalid request' });
    if (url.pathname === '/api/github/webhook') {
      if (req.method !== 'POST' || url.search) return answer(res, 405, { error: 'Method not allowed' });
      if (!config.webhookSecret) return answer(res, 503, { error: 'Local webhook secret not configured' });
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 1_000_000) return answer(res, 413, { error: 'Payload too large' });
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks);
      if (!verifyWebhook(raw, req.headers['x-hub-signature-256'], config.webhookSecret)) return answer(res, 401, { error: 'Invalid signature' });
      const delivery = req.headers['x-github-delivery'];
      if (typeof delivery !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(delivery)) return answer(res, 400, { error: 'Invalid delivery' });
      const deliveryKey = delivery.toLowerCase();
      if (deliveries.has(deliveryKey)) return answer(res, 200, { status: 'duplicate' });
      let payload;
      try { payload = JSON.parse(raw.toString('utf8')); } catch { return answer(res, 400, { error: 'Invalid payload' }); }
      if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return answer(res, 400, { error: 'Invalid payload' });
      // A production job must re-fetch authoritative GitHub state; this spike retains only the GUID.
      if (deliveries.size >= 128) deliveries.clear();
      deliveries.add(deliveryKey);
      return answer(res, 202, { status: 'verified_hint_only', localSpikeOnly: true });
    }
    if (req.method !== 'GET' || (req.headers['content-length'] && req.headers['content-length'] !== '0')) return answer(res, 405, { error: 'Method not allowed' });
    const cookies = parseCookies(req.headers.cookie);
    const pre = cookies.spike_pre;
    if (url.pathname === '/health' && !url.search) return answer(res, 200, { receiver: 'ready', callback, observed });
    if (url.pathname === '/auth/github/result' && !url.search) {
      const session = localSession(cookies);
      if (!session) return answer(res, 401, { error: 'Local session missing' });
      return answer(res, 200, { status: 'identity_verified', githubUserId: session.githubId, next: '/github/connect', localSpikeOnly: true });
    }
    if (url.pathname === '/github/result' && !url.search) {
      const session = localSession(cookies);
      if (!session?.installationResult) return answer(res, 404, { error: 'No verified installation' });
      const result = session.installationResult;
      delete session.installationResult;
      return answer(res, 200, result);
    }
    if (url.pathname === '/auth/github/start') {
      if (!config.clientSecret) return answer(res, 503, { error: 'Local client secret not configured' });
      if ([...url.searchParams.keys()].some(k => k !== 'returnTo')) return answer(res, 400, { error: 'Invalid query' });
      const returnTo = url.searchParams.get('returnTo') ?? '/';
      if (!/^\/(?!\/)[A-Za-z0-9/_\-?=&.%]*$/.test(returnTo) || returnTo.startsWith('/\\') || returnTo.includes('://')) return answer(res, 400, { error: 'Invalid return path' });
      const nextPre = /^[A-Za-z0-9_-]{43}$/.test(pre ?? '') ? pre : random();
      const { state, verifier } = newState('signin', nextPre, { returnTo });
      return redirect(res, authorizeUrl(config, state, verifier), [cookie('spike_pre', nextPre, 600)]);
    }
    if (url.pathname === '/github/connect') {
      if (!config.clientSecret) return answer(res, 503, { error: 'Local client secret not configured' });
      if (url.search) return answer(res, 400, { error: 'Invalid query' });
      const session = localSession(cookies);
      if (!session || !/^[A-Za-z0-9_-]{43}$/.test(pre ?? '')) return answer(res, 401, { error: 'Sign in first' });
      delete session.installationResult;
      const { state } = newState('install', pre, { githubId: session.githubId });
      return redirect(res, `https://github.com/apps/${config.GITHUB_APP_SLUG}/installations/new?state=${state}`);
    }
    if (url.pathname === '/github/verify-existing') {
      if (!config.clientSecret) return answer(res, 503, { error: 'Local client secret not configured' });
      const query = [...url.searchParams.entries()];
      if (query.length > 1 || (query.length === 1 && (query[0][0] !== 'repoId' || !/^[1-9][0-9]{0,15}$/.test(query[0][1]) || !Number.isSafeInteger(Number(query[0][1]))))) return answer(res, 400, { error: 'Invalid query' });
      const session = localSession(cookies);
      if (!session || !/^[A-Za-z0-9_-]{43}$/.test(pre ?? '')) return answer(res, 401, { error: 'Sign in first' });
      delete session.installationResult;
      const { state, verifier } = newState('verify_existing', pre, { githubId: session.githubId, repoId: query.length ? Number(query[0][1]) : null });
      return redirect(res, authorizeUrl(config, state, verifier));
    }
    if (url.pathname === '/auth/github/callback') {
      const keys = [...url.searchParams.keys()];
      const allowed = ['state', 'code', 'installation_id', 'setup_action', 'error', 'error_description', 'iss'];
      observed.lastCallbackShape = { known: keys.filter(k => allowed.includes(k)).sort(), unknownCount: keys.filter(k => !allowed.includes(k)).length };
      observed.lastCallbackRejection = null;
      const reject = (reason, error = 'Invalid callback') => { observed.lastCallbackRejection = reason; return answer(res, 400, { error }); };
      if (keys.some(k => !allowed.includes(k))) return reject('unexpected_parameter');
      if (keys.some(k => url.searchParams.getAll(k).length !== 1)) return reject('duplicate_parameter');
      if (url.searchParams.has('iss') && url.searchParams.get('iss') !== 'https://github.com/login/oauth') return reject('issuer_mismatch');
      const item = consume(url.searchParams.get('state'), pre);
      if (!item) return reject('state_invalid', 'Invalid or expired state');
      if (url.searchParams.has('error')) return reject('provider_denied', 'Authorization denied');
      if (item.kind === 'install') {
        const input = installSchema.safeParse(Object.fromEntries(url.searchParams.entries().filter(([k]) => ['installation_id', 'setup_action'].includes(k))));
        if (!input.success || !url.searchParams.has('installation_id') || !localSession(cookies) || localSession(cookies).githubId !== item.githubId) return reject('install_return_invalid', 'Invalid installation return');
        // An automatic-install code has no known PKCE challenge. Ignore it and start a fresh explicit PKCE flow.
        const { state, verifier } = newState('verify_install', pre, { githubId: item.githubId, installationId: input.data.installation_id });
        return redirect(res, authorizeUrl(config, state, verifier));
      }
      if (url.searchParams.has('installation_id') || url.searchParams.has('setup_action')) return reject('unexpected_install_fields');
      if (!codeSchema.safeParse({ code: url.searchParams.get('code') }).success) return reject('code_invalid');
      try {
        const token = await exchange(fetcher, config, url.searchParams.get('code'), item.verifier, timeoutMs);
        const user = await githubJson(fetcher, '/user', token, timeoutMs);
        if (!Number.isSafeInteger(user.id) || user.id <= 0 || user.type !== 'User') throw new Error('Invalid GitHub identity');
        if (item.kind === 'signin') {
          for (const [hash, value] of sessions) if (value.expires <= now()) sessions.delete(hash);
          if (sessions.size >= 128) throw new Error('Too many local sessions');
          const id = random();
          sessions.set(sha(id), { githubId: user.id, expires: now() + sessionTtl });
          observed.signinsVerified++;
          return redirect(res, '/auth/github/result', [cookie('spike_session', id, 1800)]);
        }
        if (!['verify_install', 'verify_existing'].includes(item.kind) || user.id !== item.githubId || localSession(cookies)?.githubId !== item.githubId) return answer(res, 400, { error: 'Identity mismatch' });
        const installations = await pages(fetcher, '/user/installations', token, 'installations', timeoutMs);
        const eligibleInstallations = installations.filter(i => Number.isSafeInteger(i.id) && i.id > 0 && i.account?.type === 'User' && i.account.id === user.id && i.repository_selection === 'selected');
        const installation = item.kind === 'verify_install'
          ? eligibleInstallations.find(i => String(i.id) === item.installationId)
          : eligibleInstallations.length === 1 ? eligibleInstallations[0] : null;
        if (!installation) return answer(res, 400, { error: 'Installation not eligible' });
        const repos = await pages(fetcher, `/user/installations/${installation.id}/repositories`, token, 'repositories', timeoutMs);
        const eligible = repos.filter(repo => repo.private === false && repo.owner?.id === user.id && repo.owner?.type === 'User' && Number.isSafeInteger(repo.id));
        let importPreview;
        if (item.repoId !== null && item.repoId !== undefined) {
          const selected = eligible.find(repo => repo.id === item.repoId);
          if (!selected || typeof selected.full_name !== 'string' || !/^(?!\.{1,2}\/)[A-Za-z0-9_.-]{1,100}\/(?!\.{1,2}$)[A-Za-z0-9_.-]{1,100}$/.test(selected.full_name)) return answer(res, 400, { error: 'Repository not eligible' });
          const detail = await githubJson(fetcher, `/repos/${selected.full_name}`, token, timeoutMs);
          if (detail.id !== selected.id || detail.owner?.id !== user.id || detail.owner?.type !== 'User' || detail.private !== false || detail.visibility !== 'public' || detail.full_name !== selected.full_name) return answer(res, 400, { error: 'Repository changed' });
          const languages = await githubJson(fetcher, `/repos/${selected.full_name}/languages`, token, timeoutMs);
          if (!languages || typeof languages !== 'object' || Array.isArray(languages)) throw new Error('Invalid GitHub languages');
          importPreview = {
            source: 'GitHub (checked)', repositoryId: detail.id, fullName: detail.full_name,
            description: typeof detail.description === 'string' ? detail.description : null,
            primaryLanguage: typeof detail.language === 'string' ? detail.language : null,
            languages: Object.keys(languages).filter(name => /^[A-Za-z0-9+#. -]{1,50}$/.test(name) && Number.isFinite(languages[name]) && languages[name] >= 0),
            licenseSpdxId: typeof detail.license?.spdx_id === 'string' ? detail.license.spdx_id : null,
          };
        }
        observed.installationsVerified++;
        const session = localSession(cookies);
        session.installationResult = { status: 'installation_verified', verifiedAt: new Date(now()).toISOString(), snapshotOnly: true, installationId: String(installation.id), githubUserId: user.id, publicPersonalRepositories: eligible.map(r => ({ id: r.id, fullName: r.full_name })), excludedCount: repos.length - eligible.length, ...(importPreview ? { importPreview } : {}), localSpikeOnly: true };
        return redirect(res, '/github/result');
      } catch {
        return answer(res, 502, { error: 'GitHub verification failed' });
      }
    }
    return answer(res, 404, { error: 'Not found' });
  }
  return http.createServer((req, res) => { handler(req, res).catch(() => { if (!res.headersSent) answer(res, 500, { error: 'Receiver failed' }); else res.end(); }); });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = loadConfig();
  const server = createReceiver(config);
  server.listen(3000, '127.0.0.1', () => process.stdout.write('T-004 receiver ready at http://app.localhost:3000\n'));
}
