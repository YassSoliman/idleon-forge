// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Suggestions Worker client (M13 TR-10, FR-11, FR-15). JSON over cross-origin POST; the proof is in
// the body, never a URL. Anything but a production build sends the dry-run header, so a local build or
// a Preview never files a real issue (RT-20); the Worker also treats Preview origins as dry runs.
import type {
  CreateSuggestionResponse,
  DetailsRequest,
  DetailsResponse,
  MineResponse,
  SuggestionError,
  SuggestionErrorCode,
  SuggestionRequest,
} from '@idleon-forge/suggestions-worker/contract';
import { DRY_RUN_HEADER, OUTBOX_PROOF_ERRORS } from '@idleon-forge/suggestions-worker/contract';

export type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

export interface ClientOptions {
  /** The Worker's origin, from VITE_SUGGESTIONS_URL. */
  baseUrl: string;
  dryRun: boolean;
  fetch?: Fetch;
}

export type Reply<T> =
  | { ok: true; status: number; body: T }
  | { ok: false; error: SuggestionError }
  | { ok: false; error: null; offline: boolean };

const KNOWN: readonly SuggestionErrorCode[] = [
  'invalid',
  'proof_missing',
  'proof_invalid',
  'live_token',
  'proof_too_old',
  'proof_unknown_key',
  'provider_not_allowed',
  'turnstile',
  'rate_limited',
  'daily_limit',
  'paused',
  'github_unavailable',
  'not_yours',
  'already_answered',
  'origin_not_allowed',
  'not_found',
];

async function post<T>(opts: ClientOptions, path: string, body: unknown): Promise<Reply<T>> {
  const doFetch = opts.fetch ?? ((input: string, init?: RequestInit) => fetch(input, init));
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.dryRun) headers[DRY_RUN_HEADER] = '1';
  let res: Response;
  try {
    res = await doFetch(`${opts.baseUrl.replace(/\/+$/, '')}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    });
  } catch {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    return { ok: false, error: null, offline };
  }
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {}
  if (res.ok) return { ok: true, status: res.status, body: json as T };
  const e = json as Partial<SuggestionError> | null;
  if (e && typeof e.error === 'string' && KNOWN.includes(e.error as SuggestionErrorCode)) {
    const error: SuggestionError = { error: e.error as SuggestionErrorCode };
    if (typeof e.field === 'string') error.field = e.field;
    if (typeof e.retryAfterSeconds === 'number') error.retryAfterSeconds = e.retryAfterSeconds;
    return { ok: false, error };
  }
  return { ok: false, error: { error: 'github_unavailable' } };
}

export const createSuggestion = (opts: ClientOptions, req: SuggestionRequest) =>
  post<CreateSuggestionResponse>(opts, '/v1/suggestions', req);

export const listMine = (opts: ClientOptions, proof: string) =>
  post<MineResponse>(opts, '/v1/suggestions/mine', { proof });

export const addDetails = (opts: ClientOptions, issue: number, req: DetailsRequest) =>
  post<DetailsResponse>(opts, `/v1/suggestions/${issue}/details`, req);

/** Proof errors that move a Suggestion to the outbox instead of asking to sign in (FR-15). */
export const isOutboxError = (e: SuggestionError | null) =>
  e !== null && OUTBOX_PROOF_ERRORS.includes(e.error);

const FIELD_NAMES: Record<string, string> = {
  'text.whenIm': "When I'm…",
  'text.iWant': 'I want…',
  'text.soThat': 'So that…',
  'text.example': 'Game example',
  text: 'Your answer',
};

export const OFFLINE = "You're offline, it'll stay here.";
export const SAVED_FOR_LATER = 'Saved. You can send it within the hour.';
export const UNREACHABLE = "Can't reach GitHub right now, your draft is kept.";
export const TURNSTILE_BLOCKED =
  "Couldn't confirm you're human, try again. If it keeps failing, allow challenges.cloudflare.com in your blocker.";

/** The plain message for a failed send (FR-15). The draft is always kept. */
export function messageFor(reply: Exclude<Reply<unknown>, { ok: true }>): string {
  if (reply.error === null) return reply.offline ? OFFLINE : UNREACHABLE;
  const e = reply.error;
  switch (e.error) {
    case 'daily_limit': {
      const hours = Math.max(1, Math.round((e.retryAfterSeconds ?? 3600) / 3600));
      return `You've sent 5 in the last 24 hours. You can send again in about ${hours} hour${hours === 1 ? '' : 's'}.`;
    }
    case 'rate_limited':
      return 'Wait a minute before sending again.';
    case 'paused':
      return 'Suggestions are paused for now, your draft is kept.';
    case 'turnstile':
      return TURNSTILE_BLOCKED;
    case 'proof_invalid':
    case 'proof_missing':
      return 'Sign in again to send.';
    case 'provider_not_allowed':
      return 'Sign in with Google or Steam to send suggestions.';
    case 'proof_too_old':
    case 'proof_unknown_key':
    case 'live_token':
      return SAVED_FOR_LATER;
    case 'not_yours':
      return "This isn't one of your suggestions.";
    case 'already_answered':
      return "You've already answered this question.";
    case 'invalid':
      return FIELD_NAMES[e.field ?? '']
        ? `${FIELD_NAMES[e.field ?? '']} is too long.`
        : "ActiveOn couldn't package this suggestion, your draft is kept. Please report it.";
    default:
      return UNREACHABLE;
  }
}
