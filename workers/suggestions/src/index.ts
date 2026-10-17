// SPDX-License-Identifier: GPL-3.0-only
// The Suggestions Worker `activeon-suggestions` (M13, ADR 0008): turns in-app Suggestions into GitHub
// issues. JSON only, ≤ 16 KiB, CORS limited to the app's production and PR Preview origins (TR-10).
// Logs one line per request: endpoint, outcome, latency, colo. Never the body, proof, marker or IP (TR-14).

import { DRY_RUN_HEADER, MAX_BODY_BYTES, PREVIEW_ORIGIN_PATTERN, PRODUCTION_ORIGIN } from './contract';
import type { Env } from './env';
import { addDetails, type Ctx, createSuggestion, type Deps, fail, listMine, type Result } from './handlers';
import type { ListingCache } from './listing';
import { GoogleKeys } from './proof';

export type { Env } from './env';

export function isAllowedOrigin(origin: string | null): origin is string {
  return origin === PRODUCTION_ORIGIN || (origin !== null && PREVIEW_ORIGIN_PATTERN.test(origin));
}

function corsHeaders(origin: string | null): Record<string, string> {
  if (!isAllowedOrigin(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': `Content-Type, ${DRY_RUN_HEADER}`,
    'Access-Control-Max-Age': '600',
  };
}

function respond(result: Result, origin: string | null): Response {
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      Vary: 'Origin',
      ...corsHeaders(origin),
    },
  });
}

type Route =
  | { endpoint: 'create' }
  | { endpoint: 'mine' }
  | { endpoint: 'details'; number: number }
  | { endpoint: 'other' };

function route(pathname: string): Route {
  if (pathname === '/v1/suggestions') return { endpoint: 'create' };
  if (pathname === '/v1/suggestions/mine') return { endpoint: 'mine' };
  const m = /^\/v1\/suggestions\/([1-9][0-9]{0,8})\/details$/.exec(pathname);
  if (m) return { endpoint: 'details', number: Number(m[1]) };
  return { endpoint: 'other' };
}

async function readJson(request: Request): Promise<{ ok: true; body: unknown } | { ok: false }> {
  const type = request.headers.get('Content-Type') ?? '';
  if (!/^application\/json(\s*;.*)?$/i.test(type)) return { ok: false };
  const declared = Number(request.headers.get('Content-Length') ?? '0');
  if (declared > MAX_BODY_BYTES) return { ok: false };
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_BODY_BYTES) return { ok: false };
  try {
    return { ok: true, body: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) };
  } catch {
    return { ok: false };
  }
}

export async function handle(
  request: Request,
  env: Env,
  deps: Deps,
): Promise<{ response: Response; log: object }> {
  const started = deps.now();
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  const r = route(url.pathname);
  const done = (result: Result) => ({
    response: respond(result, origin),
    log: {
      endpoint: r.endpoint,
      outcome: result.outcome,
      status: result.status,
      ms: deps.now() - started,
      colo: (request as { cf?: { colo?: string } }).cf?.colo ?? null,
    },
  });

  if (request.method === 'OPTIONS') {
    const allowed = isAllowedOrigin(origin) && r.endpoint !== 'other';
    return {
      response: new Response(null, {
        status: allowed ? 204 : 403,
        headers: { Vary: 'Origin', ...corsHeaders(origin) },
      }),
      log: { endpoint: 'preflight', outcome: allowed ? 'ok' : 'origin_not_allowed', ms: 0, colo: null },
    };
  }
  if (r.endpoint === 'other' || request.method !== 'POST') return done(fail('not_found'));
  if (!isAllowedOrigin(origin)) return done(fail('origin_not_allowed'));

  const parsed = await readJson(request);
  if (!parsed.ok) return done(fail('invalid', { field: 'body' }));
  const ctx: Ctx = {
    env,
    deps,
    dryRun: PREVIEW_ORIGIN_PATTERN.test(origin) || request.headers.get(DRY_RUN_HEADER) === '1',
    ip: request.headers.get('CF-Connecting-IP'),
  };
  if (r.endpoint === 'create') return done(await createSuggestion(ctx, parsed.body));
  if (r.endpoint === 'mine') return done(await listMine(ctx, parsed.body));
  return done(await addDetails(ctx, r.number, parsed.body));
}

// One key store per isolate, so the cache and the unknown-kid refetch throttle are shared (TR-4).
let keys: GoogleKeys | null = null;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    keys ??= new GoogleKeys((input, init) => fetch(input, init));
    const deps: Deps = {
      fetch: (input, init) => fetch(input, init),
      now: () => Date.now(),
      keys,
      cache: (globalThis as { caches?: { default?: ListingCache } }).caches?.default ?? null,
    };
    try {
      const { response, log } = await handle(request, env, deps);
      console.log(JSON.stringify(log));
      return response;
    } catch {
      console.log(JSON.stringify({ endpoint: 'unknown', outcome: 'error' }));
      return respond(fail('github_unavailable'), request.headers.get('Origin'));
    }
  },
};
