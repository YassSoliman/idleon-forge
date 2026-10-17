// SPDX-License-Identifier: GPL-3.0-only
// Bindings, vars and secrets of the `activeon-suggestions` Worker (wrangler.jsonc, M13 TR-11, TR-13).

/** Workers Rate Limiting binding: a per-location burst brake, not an exact counter. */
export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  /** Real filing happens only when this is exactly "true". Until then creates and details answer 503 paused. */
  SUGGESTIONS_ENABLED?: string;
  /** "true" pauses filing at once (TR-11). */
  SUGGESTIONS_PAUSED?: string;

  // Secrets (wrangler secret put).
  GH_APP_ID?: string;
  GH_INSTALLATION_ID?: string;
  /** PKCS#8 PEM. */
  GH_APP_PRIVATE_KEY?: string;
  TURNSTILE_SECRET?: string;
  SUGGESTER_PEPPER?: string;
  /** Comma-separated numeric GitHub user ids whose marked comments count as maintainer replies (TR-8). */
  MAINTAINER_IDS?: string;

  RL_CREATE_SUB?: RateLimiter;
  RL_CREATE_IP?: RateLimiter;
  RL_MINE_SUB?: RateLimiter;
  RL_MINE_IP?: RateLimiter;
  RL_MINE_GLOBAL?: RateLimiter;
}
