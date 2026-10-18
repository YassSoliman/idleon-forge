// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Lower bound of unspent talent points (M9 TR-7). Both presets share one budget per tab, so the
// preset that spends less in a tab has at least the difference unspent there. Tab 2's budget differs
// by the tab-2-granting talents (+1 tab-2 point per level, generated `talents.fact.tab2-granting`).
// Arithmetic on save data (ADR 0005), never the game's TotalTalentPoints.
import type { PresetTalents } from '@idleon-forge/account-state';
import { levelOf, tabSpent } from './classify';

export const COVERED_TABS = [1, 2, 3] as const;

/** g(p): levels of the tab-2-granting talents on the preset. */
export function tab2Grant(p: PresetTalents, granting: ReadonlySet<number>): number {
  let n = 0;
  for (const id of granting) n += levelOf(p, id);
  return n;
}

/** `lb(p, t)` against the other preset `q`. */
export function lowerBound(
  p: PresetTalents,
  q: PresetTalents,
  tab: number,
  granting: ReadonlySet<number>,
): number {
  if (tab !== 2) return Math.max(0, tabSpent(q, tab) - tabSpent(p, tab));
  return Math.max(0, tabSpent(q, 2) - tab2Grant(q, granting) + tab2Grant(p, granting) - tabSpent(p, 2));
}

/** Per covered tab, and the total. */
export function lowerBounds(
  p: PresetTalents,
  q: PresetTalents,
  granting: ReadonlySet<number>,
): { byTab: Record<1 | 2 | 3, number>; total: number } {
  const byTab = { 1: 0, 2: 0, 3: 0 } as Record<1 | 2 | 3, number>;
  for (const t of COVERED_TABS) byTab[t] = lowerBound(p, q, t, granting);
  return { byTab, total: byTab[1] + byTab[2] + byTab[3] };
}
