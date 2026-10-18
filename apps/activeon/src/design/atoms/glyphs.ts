// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Which of our pixel motifs stands for which meaning (DS-12: art is a signifier, never wallpaper).
// The one place the atoms name art ids, so a redraw changes one line.
import type { ArtName } from '../art/names';

export type Verdict = 'ready' | 'fix' | 'unknown' | 'skipped' | 'stale';
export type SealKind = 'fix' | 'spend' | 'grow' | 'extra';
export type SystemStatus = 'wasting' | 'behind' | 'ok' | 'locked' | 'not-covered' | 'cant-tell';

/** The Verdict stamps (now.verdict-pill "Glyph stamp"): ✓ Ready, wrench Fix, ? Unknown, Zz Skipped. */
export const VERDICT_GLYPH: Record<Verdict, ArtName> = {
  ready: 'now-glyph-check',
  fix: 'now-glyph-wrench',
  unknown: 'now-glyph-question',
  skipped: 'cards-zz',
  stale: 'now-glyph-stale',
};

/** The Goal kinds' seals (Fix / Spend / Grow / Extra). */
export const SEAL_GLYPH: Record<SealKind, ArtName> = {
  fix: 'cards-seal-bell',
  spend: 'cards-seal-coins',
  grow: 'cards-seal-star',
  extra: 'cards-seal-chest',
};

/** The System statuses (M17's tile statuses). */
export const STATUS_GLYPH: Record<SystemStatus, ArtName> = {
  wasting: 'v2-systems-st-waste',
  behind: 'v2-systems-st-behind',
  ok: 'v2-systems-st-ok',
  locked: 'v2-systems-st-lock',
  'not-covered': 'cards-magnifier-16',
  'cant-tell': 'v2-systems-st-unknown',
};

export const GLYPH = {
  where: 'now-pin',
  howLong: 'now-hourglass',
  arrowRight: 'ui-arrow-right',
  arrowLeft: 'ui-arrow-left',
  check: 'ui-check',
  sun: 'ui-theme-sun',
  moon: 'ui-theme-moon',
  walkingBlob: 'flows-walking-blob',
  sleepingBlob: 'flows-sleeping-blob',
  crackedGear: 'flows-cracked-gear',
  scout: 'now-blob-scout',
} as const satisfies Record<string, ArtName>;
