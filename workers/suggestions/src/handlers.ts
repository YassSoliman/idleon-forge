// SPDX-License-Identifier: GPL-3.0-only
// The three endpoints (M13 TR-10, TR-11, TR-12, TR-22). Cheap, local checks run first; GitHub is only
// called for valid, human, signed-in requests. Order on create: schema → proof → Turnstile → burst
// limits → listing (idempotency, global breaker, daily cap) → create.

import type {
  CreateSuggestionResponse,
  DetailsResponse,
  MineResponse,
  MySuggestion,
  SuggestionError,
  SuggestionErrorCode,
} from './contract';
import type { Env, RateLimiter } from './env';
import { GitHubClient, GitHubUnavailable, GitHubWriteRefused } from './github';
import { type ListedIssue, Listing, type ListingCache } from './listing';
import { isMine, suggesterMarker } from './marker';
import { type ProofResult, verifyProof } from './proof';
import {
  detailsComment,
  issueBody,
  issueLabels,
  issueTitle,
  LABEL,
  parseDetailsMarker,
  stripMarkers,
} from './render';
import { type IssueComment, parseMaintainerIds, questionOf, replyOf, statusOf } from './status';
import { verifyTurnstile } from './turnstile';
import { validateDetailsRequest, validateMineRequest, validateSuggestionRequest } from './validate';

export const DAILY_CAP = 5;
export const GLOBAL_DAILY_CAP = 100;
const DAY_MS = 24 * 3600 * 1000;

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

export interface Deps {
  fetch: Fetch;
  now(): number;
  keys: { get(kid: string): Promise<CryptoKey | undefined> };
  cache: ListingCache | null;
}

export interface Ctx {
  env: Env;
  deps: Deps;
  /** Preview origin or the dry-run header: everything is checked, nothing is written or counted. */
  dryRun: boolean;
  ip: string | null;
}

export interface Result {
  status: number;
  body: unknown;
  /** The outcome code logged for this request (TR-14). */
  outcome: string;
}

const ERROR_STATUS: Record<SuggestionErrorCode, number> = {
  invalid: 400,
  proof_missing: 401,
  proof_invalid: 401,
  live_token: 401,
  proof_too_old: 401,
  proof_unknown_key: 401,
  provider_not_allowed: 403,
  turnstile: 403,
  not_yours: 403,
  origin_not_allowed: 403,
  not_found: 404,
  already_answered: 409,
  rate_limited: 429,
  daily_limit: 429,
  paused: 503,
  github_unavailable: 503,
};

export function fail(error: SuggestionErrorCode, extra: Omit<SuggestionError, 'error'> = {}): Result {
  return { status: ERROR_STATUS[error], body: { error, ...extra }, outcome: error };
}

function ok(status: number, body: unknown, outcome: string): Result {
  return { status, body, outcome };
}

class Stop extends Error {
  constructor(readonly result: Result) {
    super(result.outcome);
  }
}

const isEnabled = (env: Env) => env.SUGGESTIONS_ENABLED === 'true' && env.SUGGESTIONS_PAUSED !== 'true';

function proofField(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false;
  const proof = (body as Record<string, unknown>).proof;
  return proof === undefined || proof === null || proof === '';
}

async function proof(ctx: Ctx, token: string): Promise<string> {
  let result: ProofResult;
  try {
    result = await verifyProof(token, { keys: ctx.deps.keys, now: ctx.deps.now() });
  } catch {
    // Google's key endpoint is unreachable: nothing about the player is wrong, so keep the draft.
    throw new Stop(fail('github_unavailable'));
  }
  if (!result.ok) throw new Stop(fail(result.code));
  return result.sub;
}

async function turnstile(ctx: Ctx, token: string): Promise<void> {
  const secret = ctx.env.TURNSTILE_SECRET;
  if (!secret) throw new Stop(fail('paused'));
  const passed = await verifyTurnstile(token, { secret, remoteIp: ctx.ip, fetch: ctx.deps.fetch });
  if (!passed) throw new Stop(fail('turnstile'));
}

async function burst(limiters: Array<[RateLimiter | undefined, string]>): Promise<void> {
  for (const [limiter, key] of limiters) {
    if (!limiter) continue;
    const { success } = await limiter.limit({ key });
    if (!success) throw new Stop(fail('rate_limited', { retryAfterSeconds: 60 }));
  }
}

function github(ctx: Ctx): { gh: GitHubClient; listing: Listing; pepper: string } {
  const { GH_APP_ID, GH_INSTALLATION_ID, GH_APP_PRIVATE_KEY, SUGGESTER_PEPPER } = ctx.env;
  if (!GH_APP_ID || !GH_INSTALLATION_ID || !GH_APP_PRIVATE_KEY || !SUGGESTER_PEPPER) {
    throw new Stop(fail('github_unavailable'));
  }
  const gh = new GitHubClient(
    { appId: GH_APP_ID, installationId: GH_INSTALLATION_ID, privateKeyPem: GH_APP_PRIVATE_KEY },
    ctx.deps.fetch,
    ctx.deps.now,
  );
  return { gh, listing: new Listing(gh, ctx.deps.cache, ctx.deps.now), pepper: SUGGESTER_PEPPER };
}

async function mineOf(pepper: string, sub: string, issues: ListedIssue[]): Promise<ListedIssue[]> {
  const flags = await Promise.all(issues.map((i) => isMine(pepper, sub, i)));
  return issues.filter((_, k) => flags[k]);
}

function isBotDetails(c: IssueComment): string | null {
  return c.authorIsBot ? parseDetailsMarker(c.body) : null;
}

/** Times (ms) of this player's creates and details answers in the last 24 h, oldest first (D7). */
async function recentActivity(gh: GitHubClient, mine: ListedIssue[], now: number): Promise<number[]> {
  const times: number[] = [];
  const recent = mine.filter((i) => now - Date.parse(i.updatedAt) < DAY_MS);
  for (const i of mine) {
    const t = Date.parse(i.createdAt);
    if (now - t < DAY_MS) times.push(t);
  }
  const comments = await Promise.all(recent.map((i) => gh.listComments(i.number)));
  for (const list of comments) {
    for (const c of list) {
      const t = Date.parse(c.createdAt);
      if (isBotDetails(c) && now - t < DAY_MS) times.push(t);
    }
  }
  return times.sort((a, b) => a - b);
}

async function dailyCap(gh: GitHubClient, mine: ListedIssue[], now: number): Promise<void> {
  const times = await recentActivity(gh, mine, now);
  if (times.length >= DAILY_CAP) {
    const freeAt = (times[times.length - DAILY_CAP] as number) + DAY_MS;
    throw new Stop(
      fail('daily_limit', { retryAfterSeconds: Math.max(60, Math.ceil((freeAt - now) / 1000)) }),
    );
  }
}

function guard(e: unknown): Result {
  if (e instanceof Stop) return e.result;
  if (e instanceof GitHubWriteRefused) return fail('not_yours');
  if (e instanceof GitHubUnavailable) return fail('github_unavailable');
  throw e;
}

export async function createSuggestion(ctx: Ctx, body: unknown): Promise<Result> {
  try {
    const v = validateSuggestionRequest(body);
    if (!v.ok)
      return v.field === 'proof' && proofField(body)
        ? fail('proof_missing')
        : fail('invalid', { field: v.field });
    const req = v.value;
    if (!ctx.dryRun && !isEnabled(ctx.env)) return fail('paused');
    const sub = await proof(ctx, req.proof);
    await turnstile(ctx, req.turnstileToken);
    if (ctx.dryRun) {
      const res: CreateSuggestionResponse = { number: 0, url: null, dryRun: true };
      return ok(200, res, 'dry_run');
    }
    await burst([
      [ctx.env.RL_CREATE_SUB, `sub:${sub}`],
      [ctx.env.RL_CREATE_IP, `ip:${ctx.ip ?? 'unknown'}`],
    ]);
    const { gh, listing, pepper } = github(ctx);
    const now = ctx.deps.now();
    const issues = await listing.get({ fresh: true });

    const same = issues.find((i) => i.cid === req.clientId);
    if (same) {
      if (!(await isMine(pepper, sub, same))) return fail('invalid', { field: 'clientId' });
      return ok(200, { number: same.number, url: same.url } satisfies CreateSuggestionResponse, 'retry');
    }
    if (issues.filter((i) => now - Date.parse(i.createdAt) < DAY_MS).length >= GLOBAL_DAILY_CAP) {
      return fail('paused');
    }
    await dailyCap(gh, await mineOf(pepper, sub, issues), now);

    const m = await suggesterMarker(pepper, sub, req.clientId);
    const labels = issueLabels(req);
    const raw = await gh.createIssue({
      title: issueTitle(req.type, req.text.iWant),
      body: issueBody(req, m, req.clientId),
      labels,
    });
    await listing.insert({
      number: raw.number,
      url: raw.html_url,
      state: 'open',
      stateReason: null,
      labels,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      type: req.type,
      iWant: req.text.iWant,
      m,
      cid: req.clientId,
    });
    return ok(201, { number: raw.number, url: raw.html_url } satisfies CreateSuggestionResponse, 'created');
  } catch (e) {
    return guard(e);
  }
}

export async function listMine(ctx: Ctx, body: unknown): Promise<Result> {
  try {
    const v = validateMineRequest(body);
    if (!v.ok) return proofField(body) ? fail('proof_missing') : fail('invalid', { field: v.field });
    const sub = await proof(ctx, v.value.proof);
    await burst([
      [ctx.env.RL_MINE_GLOBAL, 'global'],
      [ctx.env.RL_MINE_SUB, `sub:${sub}`],
      [ctx.env.RL_MINE_IP, `ip:${ctx.ip ?? 'unknown'}`],
    ]);
    const { gh, listing, pepper } = github(ctx);
    const maintainers = parseMaintainerIds(ctx.env.MAINTAINER_IDS);
    const mine = await mineOf(pepper, sub, await listing.get());
    const items = await Promise.all(
      mine.map(async (i): Promise<MySuggestion> => {
        const status = statusOf(i);
        const item: MySuggestion = {
          number: i.number,
          url: i.url,
          type: i.type ?? 'idea',
          iWant: i.iWant,
          createdAt: i.createdAt,
          status,
        };
        const needsInfo = i.state === 'open' && i.labels.includes(LABEL.needsInfo);
        // Comments are fetched only where they can matter (TR-12).
        if (i.state === 'closed' || needsInfo) {
          const comments = await gh.listComments(i.number);
          const reply = replyOf(comments, maintainers);
          if (reply) item.reply = reply;
          if (needsInfo) {
            const q = questionOf(comments, maintainers);
            if (q) {
              item.question = stripMarkers(q.body);
              item.canAddDetails = !answeredAfter(comments, q);
            }
          }
        }
        return item;
      }),
    );
    return ok(200, { items } satisfies MineResponse, 'ok');
  } catch (e) {
    return guard(e);
  }
}

function answeredAfter(comments: readonly IssueComment[], question: IssueComment): IssueComment | undefined {
  const at = Date.parse(question.createdAt);
  return comments.find((c) => isBotDetails(c) && Date.parse(c.createdAt) > at);
}

async function healLabels(gh: GitHubClient, n: number): Promise<void> {
  await gh.removeLabel(n, LABEL.needsInfo);
  await gh.addLabels(n, [LABEL.new]);
}

export async function addDetails(ctx: Ctx, issueNumber: number, body: unknown): Promise<Result> {
  try {
    const v = validateDetailsRequest(body);
    if (!v.ok)
      return v.field === 'proof' && proofField(body)
        ? fail('proof_missing')
        : fail('invalid', { field: v.field });
    const req = v.value;
    if (!ctx.dryRun && !isEnabled(ctx.env)) return fail('paused');
    const sub = await proof(ctx, req.proof);
    await turnstile(ctx, req.turnstileToken);
    if (ctx.dryRun)
      return ok(200, { number: issueNumber, dryRun: true } satisfies DetailsResponse, 'dry_run');
    await burst([
      [ctx.env.RL_CREATE_SUB, `sub:${sub}`],
      [ctx.env.RL_CREATE_IP, `ip:${ctx.ip ?? 'unknown'}`],
    ]);
    const { gh, listing, pepper } = github(ctx);
    const now = ctx.deps.now();
    const issues = await listing.get({ fresh: true });
    const mine = await mineOf(pepper, sub, issues);
    const issue = mine.find((i) => i.number === issueNumber);
    if (!issue) return fail('not_yours');

    const comments = await gh.listComments(issueNumber);
    const own = comments.find((c) => isBotDetails(c) === req.clientId);
    if (own) {
      if (issue.labels.includes(LABEL.needsInfo)) await healLabels(gh, issueNumber);
      return ok(200, { number: issueNumber } satisfies DetailsResponse, 'retry');
    }
    if (issue.state !== 'open' || !issue.labels.includes(LABEL.needsInfo)) return fail('already_answered');
    const question = questionOf(comments, parseMaintainerIds(ctx.env.MAINTAINER_IDS));
    if (!question) return fail('already_answered');
    if (answeredAfter(comments, question)) {
      // A half-finished earlier answer heals here (TR-22): the labels are safe to re-apply.
      await healLabels(gh, issueNumber);
      return fail('already_answered');
    }
    await dailyCap(gh, mine, now);
    await gh.addComment(issueNumber, detailsComment(req.text, req.clientId));
    await healLabels(gh, issueNumber);
    return ok(201, { number: issueNumber } satisfies DetailsResponse, 'created');
  } catch (e) {
    return guard(e);
  }
}
