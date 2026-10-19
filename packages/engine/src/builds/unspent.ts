// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Lower bound of unspent talent points (M9 TR-7). Both presets share one budget per tab, so the
// preset that spends less in a tab has at least the difference unspent there. Tab 2's budget differs
// by the tab-2-granting talents (+1 tab-2 point per level, generated `talents.fact.tab2-granting`).
// Arithmetic on save data (ADR 0005), never the game's TotalTalentPoints.
import type { PresetTalents } from '@idleon-forge/account-state';
import { levelOf, tabSpent } from './classify';
import type { TabNo } from './knowledge';

/** Every class tab (M26 added the elite and master tabs; a tab the class lacks is 0 on both presets). */
export const COVERED_TABS: readonly TabNo[] = [1, 2, 3, 4, 5];

/** Points per class tab. */
export type TabPoints = Record<TabNo, number>;
export const zeroTabs = (): TabPoints => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

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

/** The tabs a character's Builds count points on: 1–3, and tab 4 or 5 once a Build names it (M26). */
export function tabsCounted(builds: readonly ({ tabs: readonly { tab: TabNo }[] } | null)[]): TabNo[] {
  const out = new Set<TabNo>([1, 2, 3]);
  for (const b of builds) for (const t of b?.tabs ?? []) out.add(t.tab);
  return COVERED_TABS.filter((t) => out.has(t));
}

/** Per counted tab (tabs 1–3 unless `tabs` says more), and the total. */
export function lowerBounds(
  p: PresetTalents,
  q: PresetTalents,
  granting: ReadonlySet<number>,
  tabs: readonly TabNo[] = [1, 2, 3],
): { byTab: TabPoints; total: number } {
  const byTab = zeroTabs();
  for (const t of tabs) byTab[t] = lowerBound(p, q, t, granting);
  return { byTab, total: COVERED_TABS.reduce((n, t) => n + byTab[t], 0) };
}
