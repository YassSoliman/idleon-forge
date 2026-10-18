// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Build-time config for Suggestions (M13 §7, M12): the Worker's URL and the Turnstile site key, both
// public values. Without them the form still opens, disabled, with the GitHub-issue fallback.
import type { BuildInfo } from '@idleon-forge/release';

export interface SuggestionsConfig {
  /** VITE_SUGGESTIONS_URL, e.g. https://activeon-suggestions.idleon.workers.dev. */
  baseUrl: string | null;
  /** VITE_TURNSTILE_SITE_KEY. */
  siteKey: string | null;
  /** Every build but production asks the Worker for a dry run: nothing reaches GitHub (RT-20). */
  dryRun: boolean;
}

export function readSuggestionsConfig(
  env: Record<string, unknown>,
  build: Pick<BuildInfo, 'channel'>,
): SuggestionsConfig {
  const url = typeof env.VITE_SUGGESTIONS_URL === 'string' ? env.VITE_SUGGESTIONS_URL.trim() : '';
  const key = typeof env.VITE_TURNSTILE_SITE_KEY === 'string' ? env.VITE_TURNSTILE_SITE_KEY.trim() : '';
  let baseUrl: string | null = null;
  try {
    const u = new URL(url);
    if (u.protocol === 'https:' || u.hostname === 'localhost') baseUrl = u.origin;
  } catch {}
  return {
    baseUrl,
    siteKey: /^[0-9A-Za-z_-]{10,100}$/.test(key) ? key : null,
    dryRun: build.channel !== 'production',
  };
}

export const isConfigured = (c: SuggestionsConfig) => c.baseUrl !== null && c.siteKey !== null;
