// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Points left on a talent tab, for the Build view (ADR 0010): the Account State's exact count when it
// has one (`talentPoints[tab]`, `confidence` other than `'bound'`), otherwise M9's lower bound (TR-7,
// builds/unspent.ts). One call answers "how many points wait here, and may we say the number?".
import type { PointsConfidence, PresetTalents, TabKey } from '@idleon-forge/account-state';
import { lowerBound } from '../builds/unspent';

export interface PointsLeft {
  /**
   * `exact`: `points` is the game's own count (`verified` when the save confirms it: the fuller preset
   * shows 0 left). `at-least`: `points` is a lower bound and may be short ("at least N"); 0 then proves
   * nothing. `unknown`: neither is available (the star tab without an exact count, or no other preset).
   */
  kind: 'exact' | 'at-least' | 'unknown';
  points: number | null;
  verified: boolean;
  confidence: PointsConfidence | null;
}

/**
 * Points left on `tab` of preset `p`, with `q` the character's other preset (null below class Lv 15)
 * and `granting` the tab-2-granting talent ids (generated `talents.fact.tab2-granting`).
 */
export function pointsLeft(
  p: PresetTalents,
  q: PresetTalents | null,
  tab: TabKey,
  granting: ReadonlySet<number>,
): PointsLeft {
  const exact = p.talentPoints?.[tab];
  if (exact && exact.confidence !== 'bound' && exact.unspent !== null)
    return {
      kind: 'exact',
      points: exact.unspent,
      verified: exact.confidence === 'exact-verified',
      confidence: exact.confidence,
    };
  const confidence = exact?.confidence ?? null;
  if (tab === 'star' || !q) return { kind: 'unknown', points: null, verified: false, confidence };
  return { kind: 'at-least', points: lowerBound(p, q, tab, granting), verified: false, confidence };
}

/** The exact points left on `tab`, or null when only the lower bound is known (never show it as exact). */
export function exactPointsLeft(p: PresetTalents, tab: TabKey): number | null {
  const v = p.talentPoints?.[tab];
  return v && v.confidence !== 'bound' ? v.unspent : null;
}
