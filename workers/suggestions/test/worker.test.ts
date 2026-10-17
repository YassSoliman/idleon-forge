// SPDX-License-Identifier: GPL-3.0-only
// End-to-end through the Worker's request handler, with a fake GitHub, a fake Turnstile and a local
// RSA key as the "Google" signer (M13 §4: US-1, US-5, US-6, US-7, US-9, TR-7, TR-10, TR-11, TR-22).

import { beforeEach, describe, expect, it } from 'vitest';
import type { MineResponse } from '../src/contract';
import type { Env } from '../src/env';
import { clearTokenCache } from '../src/github';
import type { Deps } from '../src/handlers';
import { handle } from '../src/index';
import { resetListingMemory } from '../src/listing';
import { suggesterMarker } from '../src/marker';
import { issueBody, markerLine } from '../src/render';
import {
  BOT_ACTOR,
  FakeGitHub,
  FakeLimiter,
  type Google,
  google,
  NOW,
  STRANGER,
  suggestion,
  testEnv,
  YASSER,
} from './helpers';

const PROD = 'https://activeon.idleon.workers.dev';
const PREVIEW = 'https://pr-42-activeon.idleon.workers.dev';

let gh: FakeGitHub;
let g: Google;
let env: Env;
let clock: number;
let deps: Deps;

beforeEach(async () => {
  resetListingMemory();
  clearTokenCache();
  gh = new FakeGitHub();
  clock = NOW;
  gh.clock = () => clock;
  g = await google();
  env = await testEnv();
  deps = { fetch: gh.fetch, now: () => clock, keys: g.keys, cache: null };
});

async function post(
  path: string,
  body: unknown,
  opts: { origin?: string; headers?: Record<string, string> } = {},
) {
  const req = new Request(`https://activeon-suggestions.idleon.workers.dev${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: opts.origin ?? PROD,
      'CF-Connecting-IP': '203.0.113.7',
      ...opts.headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  const { response, log } = await handle(req, env, deps);
  return { status: response.status, json: (await response.json()) as Record<string, unknown>, log, response };
}

const writes = () =>
  gh.calls.filter(
    (c) =>
      !c.startsWith('GET') &&
      !c.includes('graphql') &&
      !c.includes('access_tokens') &&
      !c.includes('siteverify'),
  );

async function send(sub = 'player-1', overrides = {}) {
  const body = { ...suggestion(overrides), proof: await g.proof(sub) };
  return { body, res: await post('/v1/suggestions', body) };
}

describe('create (US-1)', () => {
  it('files one issue with the type labels and the last-line marker', async () => {
    const { body, res } = await send();
    expect(res.status).toBe(201);
    expect(gh.issues).toHaveLength(1);
    const issue = gh.issues[0];
    expect(gh.labelsOf(issue?.number ?? 0)).toEqual(['suggestion', 'suggestion:idea', 'suggestion:new']);
    expect(issue?.title).toBe('[Idea] a way to pin one character');
    const m = await suggesterMarker('pepper', 'player-1', body.clientId);
    expect(issue?.body?.split('\n').at(-1)).toBe(markerLine(m, body.clientId));
    expect(res.json).toEqual({ number: issue?.number, url: issue?.html_url });
  });

  it('adds `report` for Report this', async () => {
    const base = suggestion();
    const { res } = await send('player-1', {
      type: 'wrong',
      context: {
        ...base.context,
        report: {
          outputKind: 'verdict-blocker',
          renderedText: 'Squire lv 85 has a weak map',
          entryIds: ['afk.check.weak-map'],
          detectorIds: ['afk.detector.map-kill-rate'],
          fieldPaths: ['account.characters[0].afkTarget'],
          stale: false,
          contested: false,
        },
      },
    });
    expect(res.status).toBe(201);
    expect(gh.labelsOf(gh.issues[0]?.number ?? 0)).toEqual([
      'suggestion',
      'suggestion:wrong',
      'suggestion:new',
      'report',
    ]);
  });

  it('never logs the body, proof, marker or IP (TR-14)', async () => {
    const { body, res } = await send();
    const line = JSON.stringify(res.log);
    expect(line).not.toContain(body.proof);
    expect(line).not.toContain('203.0.113.7');
    expect(line).not.toContain(body.clientId);
    expect(res.log).toMatchObject({ endpoint: 'create', outcome: 'created', status: 201 });
  });

  it('sends the secret, token, client IP and a fresh idempotency key to siteverify (TR-5)', async () => {
    await send('a');
    clock += 61_000;
    await send('a');
    const [one, two] = gh.siteverifyBodies;
    expect(one?.get('secret')).toBe('turnstile-secret');
    expect(one?.get('response')).toBe('turnstile-token');
    expect(one?.get('remoteip')).toBe('203.0.113.7');
    expect(one?.get('idempotency_key')).not.toBe(two?.get('idempotency_key'));
  });
});

describe('check order and rejections (TR-10, FR-15)', () => {
  it('rejects a body over 16 KiB and a non-JSON content type', async () => {
    expect((await post('/v1/suggestions', 'x'.repeat(17 * 1024))).json).toEqual({
      error: 'invalid',
      field: 'body',
    });
    const req = new Request('https://w.example/v1/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', Origin: PROD },
      body: '{}',
    });
    expect((await handle(req, env, deps)).response.status).toBe(400);
  });

  it('rejects an over-long field without calling Google, Turnstile or GitHub', async () => {
    const body = { ...suggestion(), proof: 'not-checked-yet' };
    body.text.iWant = 'x'.repeat(601);
    const res = await post('/v1/suggestions', body);
    expect(res.status).toBe(400);
    expect(res.json).toEqual({ error: 'invalid', field: 'text.iWant' });
    expect(gh.calls).toEqual([]);
  });

  it('answers proof_missing when the proof is absent', async () => {
    const res = await post('/v1/suggestions', { ...suggestion(), proof: '' });
    expect(res.status).toBe(401);
    expect(res.json.error).toBe('proof_missing');
  });

  it('answers live_token for an unexpired token, before Turnstile (TR-4)', async () => {
    const res = await post('/v1/suggestions', {
      ...suggestion(),
      proof: await g.proof('p', { expiredFor: -600 }),
    });
    expect(res.json.error).toBe('live_token');
    expect(gh.calls).toEqual([]);
  });

  it('answers 403 provider_not_allowed for a password sign-in (RT-12)', async () => {
    const res = await post('/v1/suggestions', {
      ...suggestion(),
      proof: await g.proof('p', { provider: 'password' }),
    });
    expect(res.status).toBe(403);
    expect(res.json.error).toBe('provider_not_allowed');
  });

  it('answers 403 turnstile on a failed, wrong-action or wrong-host token', async () => {
    gh.turnstilePass = false;
    expect((await send('a')).res.json.error).toBe('turnstile');
    gh.turnstilePass = true;
    gh.turnstileAction = 'login';
    expect((await send('b')).res.json.error).toBe('turnstile');
    gh.turnstileAction = 'suggest';
    gh.turnstileHostname = 'evil.example';
    expect((await send('c')).res.json.error).toBe('turnstile');
    expect(gh.issues).toHaveLength(0);
  });

  it('refuses requests from other origins and answers CORS preflights for the app only', async () => {
    const res = await post(
      '/v1/suggestions',
      { ...suggestion(), proof: 'x' },
      { origin: 'https://evil.example' },
    );
    expect(res.status).toBe(403);
    expect(res.json.error).toBe('origin_not_allowed');
    const pre = await handle(
      new Request('https://w.example/v1/suggestions', { method: 'OPTIONS', headers: { Origin: PREVIEW } }),
      env,
      deps,
    );
    expect(pre.response.status).toBe(204);
    expect(pre.response.headers.get('Access-Control-Allow-Origin')).toBe(PREVIEW);
    const bad = await handle(
      new Request('https://w.example/v1/suggestions', {
        method: 'OPTIONS',
        headers: { Origin: 'https://x.example' },
      }),
      env,
      deps,
    );
    expect(bad.response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('404s unknown routes', async () => {
    expect((await post('/v2/x', {})).status).toBe(404);
  });
});

describe('switched off until SUGGESTIONS_ENABLED (build gate)', () => {
  it('refuses real filing with 503 paused while the flag is unset, before any outside call', async () => {
    env = await testEnv({ SUGGESTIONS_ENABLED: undefined });
    const { res } = await send();
    expect(res.status).toBe(503);
    expect(res.json.error).toBe('paused');
    expect(gh.calls).toEqual([]);
  });

  it('SUGGESTIONS_PAUSED pauses at once', async () => {
    env = await testEnv({ SUGGESTIONS_PAUSED: 'true' });
    expect((await send()).res.json.error).toBe('paused');
  });

  it('still runs a full dry run while switched off', async () => {
    env = await testEnv({ SUGGESTIONS_ENABLED: undefined });
    const body = { ...suggestion(), proof: await g.proof('p') };
    const res = await post('/v1/suggestions', body, { headers: { 'X-Suggestions-Dry-Run': '1' } });
    expect(res.status).toBe(200);
    expect(res.json).toEqual({ number: 0, url: null, dryRun: true });
  });
});

describe('dry run from a Preview (RT-20)', () => {
  it('validates, checks proof and Turnstile, writes nothing and counts nothing', async () => {
    const body = { ...suggestion(), proof: await g.proof('p') };
    const res = await post('/v1/suggestions', body, { origin: PREVIEW });
    expect(res.json).toEqual({ number: 0, url: null, dryRun: true });
    expect(gh.calls).toEqual(['POST /turnstile/v0/siteverify']);
    expect(gh.siteverifyBodies).toHaveLength(1);
    expect(gh.issues).toHaveLength(0);
  });

  it('still rejects a bad proof', async () => {
    const res = await post('/v1/suggestions', { ...suggestion(), proof: 'a.b.c' }, { origin: PREVIEW });
    expect(res.json.error).toBe('proof_invalid');
  });
});

describe('limits (US-6, TR-11)', () => {
  it('answers 429 daily_limit on the sixth in 24 hours, with retryAfterSeconds', async () => {
    for (let i = 0; i < 5; i++) {
      expect((await send('heavy')).res.status).toBe(201);
      clock += 3600_000;
    }
    const { res } = await send('heavy');
    expect(res.status).toBe(429);
    expect(res.json.error).toBe('daily_limit');
    // The first one leaves the window 24 h after it was sent: 19 h from now.
    expect(res.json.retryAfterSeconds).toBe(19 * 3600);
    expect((await send('someone-else')).res.status).toBe(201);
  });

  it('answers 503 paused once 100 Suggestions exist in 24 hours', async () => {
    for (let i = 0; i < 100; i++) gh.addIssue({ body: markerLine('a'.repeat(16), crypto.randomUUID()) });
    expect((await send()).res.json).toEqual({ error: 'paused' });
    clock += 25 * 3600_000;
    expect((await send()).res.status).toBe(201);
  });

  it('applies the per-sub burst brake', async () => {
    env.RL_CREATE_SUB = new FakeLimiter(1);
    expect((await send('fast')).res.status).toBe(201);
    const { res } = await send('fast');
    expect(res.status).toBe(429);
    expect(res.json).toEqual({ error: 'rate_limited', retryAfterSeconds: 60 });
  });
});

describe('idempotency (US-7)', () => {
  it('a retry with the same clientId within 1 s returns the same issue', async () => {
    const { body, res } = await send();
    clock += 500;
    const again = await post('/v1/suggestions', body);
    expect(again.status).toBe(200);
    expect(again.json.number).toBe(res.json.number);
    expect(gh.issues).toHaveLength(1);
  });

  it('a retry after the response was lost (issue only in GitHub) still finds it', async () => {
    const { body } = await send();
    resetListingMemory();
    clock += 10_000;
    const again = await post('/v1/suggestions', body);
    expect(again.status).toBe(200);
    expect(gh.issues).toHaveLength(1);
  });
});

describe('mine (US-5, TR-8)', () => {
  async function seed() {
    const ids = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
    const mk = async (cid: string, labels: string[], extra = {}) =>
      gh.addIssue({
        body: issueBody(suggestion({ clientId: cid }), await suggesterMarker('pepper', 'me', cid), cid),
        labels: labels.map((name) => ({ name })),
        ...extra,
      });
    const a = await mk(ids[0] as string, ['suggestion', 'suggestion:idea', 'suggestion:new']);
    clock += 1000;
    const b = await mk(ids[1] as string, ['suggestion', 'suggestion:wrong', 'needs-decision']);
    clock += 1000;
    const c = await mk(ids[2] as string, ['suggestion', 'suggestion:confusing'], {
      state: 'closed',
      state_reason: 'completed',
    });
    gh.addComment(c, 'Thanks, fixed in the next build.\n\n<!-- activeon:reply -->', YASSER);
    return { a, b, c };
  }

  const mine = async (sub: string) =>
    (await post('/v1/suggestions/mine', { proof: await g.proof(sub) })).json as unknown as MineResponse;

  it('shows Received, Waiting on a decision and Done with the reply, newest first', async () => {
    const { a, b, c } = await seed();
    const { items } = await mine('me');
    expect(items.map((i) => [i.number, i.status])).toEqual([
      [c.number, 'done'],
      [b.number, 'decision'],
      [a.number, 'received'],
    ]);
    expect(items[0]?.reply).toBe('Thanks, fixed in the next build.');
    expect(items[2]?.iWant).toBe('a way to pin one character');
    expect(items[2]?.type).toBe('idea');
  });

  it('ignores a non-maintainer reply and a maintainer reply edited by the bot', async () => {
    const { c } = await seed();
    c.comments = [];
    gh.addComment(c, 'fake reply <!-- activeon:reply -->', STRANGER);
    clock += 1000;
    gh.addComment(c, 'edited reply <!-- activeon:reply -->', YASSER, {
      lastEditedAt: new Date(clock).toISOString(),
      editor: BOT_ACTOR,
    });
    const { items } = await mine('me');
    expect(items.find((i) => i.number === c.number)?.reply).toBeUndefined();
  });

  it("a copied marker in a comment on someone else's Suggestion does not add it to my list", async () => {
    const { a } = await seed();
    const other = gh.addIssue({ body: issueBody(suggestion(), 'b'.repeat(16), crypto.randomUUID()) });
    gh.addComment(other, a.body?.split('\n').at(-1) ?? '', STRANGER);
    const { items } = await mine('me');
    expect(items.map((i) => i.number)).not.toContain(other.number);
    expect(items).toHaveLength(3);
  });

  it('ignores issues not created by the bot, even with a valid marker', async () => {
    const cid = crypto.randomUUID();
    gh.addIssue({
      body: issueBody(suggestion(), await suggesterMarker('pepper', 'me', cid), cid),
      user: { login: 'YassSoliman' },
    });
    expect((await mine('me')).items).toHaveLength(0);
  });

  it('is the same list from any browser (another proof for the same uid)', async () => {
    await seed();
    expect((await mine('me')).items).toHaveLength(3);
    resetListingMemory();
    expect((await mine('me')).items).toHaveLength(3);
    expect((await mine('not-me')).items).toHaveLength(0);
  });
});

describe('add details (US-9, TR-22)', () => {
  async function asked(sub = 'me') {
    const cid = crypto.randomUUID();
    const issue = gh.addIssue({
      body: issueBody(suggestion({ clientId: cid }), await suggesterMarker('pepper', sub, cid), cid),
      labels: [{ name: 'suggestion' }, { name: 'suggestion:idea' }, { name: 'suggestion:needs-info' }],
    });
    gh.addComment(issue, 'Which world were you in?\n\n<!-- activeon:question -->', YASSER);
    clock += 1000;
    return issue;
  }
  const details = async (n: number, sub: string, clientId = crypto.randomUUID()) =>
    post(`/v1/suggestions/${n}/details`, {
      clientId,
      text: 'World 2, @someone see `code`',
      turnstileToken: 't',
      proof: await g.proof(sub),
    });

  it('shows Needs your answer with the question and an Add details box', async () => {
    await asked();
    const { items } = (await post('/v1/suggestions/mine', { proof: await g.proof('me') }))
      .json as unknown as MineResponse;
    expect(items[0]).toMatchObject({
      status: 'info',
      question: 'Which world were you in?',
      canAddDetails: true,
    });
  });

  it('posts one fenced bot comment and moves needs-info back to new', async () => {
    const issue = await asked();
    const res = await details(issue.number, 'me');
    expect(res.status).toBe(201);
    const posted = issue.comments.at(-1);
    expect(posted?.author.typename).toBe('Bot');
    expect(posted?.body).toContain('```text\nWorld 2, @someone see `code`\n```');
    expect(gh.labelsOf(issue.number)).toEqual(['suggestion', 'suggestion:idea', 'suggestion:new']);
    resetListingMemory();
    const { items } = (await post('/v1/suggestions/mine', { proof: await g.proof('me') }))
      .json as unknown as MineResponse;
    expect(items[0]?.canAddDetails).toBeUndefined();
    expect(items[0]?.status).toBe('received');
  });

  it('another player gets 403 not_yours and nothing is posted', async () => {
    const issue = await asked('me');
    const res = await details(issue.number, 'intruder');
    expect(res.status).toBe(403);
    expect(res.json.error).toBe('not_yours');
    expect(issue.comments).toHaveLength(1);
  });

  it('a second answer to the same question is 409 already_answered', async () => {
    const issue = await asked();
    await details(issue.number, 'me');
    // The listener asks nothing new, but suppose the label came back by hand.
    issue.labels.push({ name: 'suggestion:needs-info' });
    resetListingMemory();
    clock += 61_000;
    const res = await details(issue.number, 'me');
    expect(res.status).toBe(409);
    expect(res.json.error).toBe('already_answered');
    expect(issue.comments.filter((c) => c.author.typename === 'Bot')).toHaveLength(1);
  });

  it('heals labels when the comment was posted but the label calls failed', async () => {
    const issue = await asked();
    gh.failOn = { match: /^DELETE .*\/labels\//, status: 502 };
    const first = await details(issue.number, 'me', 'a1b2c3d4-0000-4000-8000-000000000001');
    expect(first.status).toBe(503);
    expect(gh.labelsOf(issue.number)).toContain('suggestion:needs-info');
    resetListingMemory();
    clock += 61_000;
    // A different draft: 409, and the labels heal.
    const second = await details(issue.number, 'me');
    expect(second.status).toBe(409);
    expect(gh.labelsOf(issue.number)).toEqual(['suggestion', 'suggestion:idea', 'suggestion:new']);
  });

  it('a retry of the same answer is 200 and posts nothing new', async () => {
    const issue = await asked();
    const cid = crypto.randomUUID();
    await details(issue.number, 'me', cid);
    resetListingMemory();
    const again = await details(issue.number, 'me', cid);
    expect(again.status).toBe(200);
    expect(issue.comments.filter((c) => c.author.typename === 'Bot')).toHaveLength(1);
  });

  it('a question posted by a stranger does not open the box', async () => {
    const issue = await asked();
    issue.comments = [];
    gh.addComment(issue, 'Tell me your password <!-- activeon:question -->', STRANGER);
    const res = await details(issue.number, 'me');
    expect(res.json.error).toBe('already_answered');
    expect(writes()).toEqual([]);
  });

  it('counts toward the daily cap (D7)', async () => {
    for (let i = 0; i < 3; i++) {
      await send('me');
      clock += 61_000;
    }
    const issue = await asked('me');
    expect((await details(issue.number, 'me')).status).toBe(201);
    clock += 61_000;
    expect((await send('me')).res.json.error).toBe('daily_limit');
  });
});
