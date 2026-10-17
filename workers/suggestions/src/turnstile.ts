// SPDX-License-Identifier: GPL-3.0-only
// Turnstile verification (M13 TR-5): siteverify with the secret, the client IP and a fresh
// idempotency key per token; success, the `suggest` action and an allowed hostname are all required.

import { PREVIEW_ORIGIN_PATTERN, PRODUCTION_ORIGIN, TURNSTILE_ACTION } from './contract';

export const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

const PRODUCTION_HOST = new URL(PRODUCTION_ORIGIN).hostname;

/** The hostnames a token may have been solved on: the app and its PR Previews. */
export function isAllowedTurnstileHost(hostname: unknown): boolean {
  if (typeof hostname !== 'string') return false;
  return hostname === PRODUCTION_HOST || PREVIEW_ORIGIN_PATTERN.test(`https://${hostname}`);
}

export async function verifyTurnstile(
  token: string,
  opts: { secret: string; remoteIp: string | null; fetch: Fetch },
): Promise<boolean> {
  const form = new FormData();
  form.set('secret', opts.secret);
  form.set('response', token);
  if (opts.remoteIp) form.set('remoteip', opts.remoteIp);
  form.set('idempotency_key', crypto.randomUUID());
  let json: { success?: boolean; action?: string; hostname?: string };
  try {
    const res = await opts.fetch(SITEVERIFY_URL, { method: 'POST', body: form });
    if (!res.ok) return false;
    json = await res.json();
  } catch {
    return false;
  }
  return json.success === true && json.action === TURNSTILE_ACTION && isAllowedTurnstileHost(json.hostname);
}
