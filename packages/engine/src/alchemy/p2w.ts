// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M19 F4 Pay 2 Win (docs/specs/M19-alchemy.md FR-12 to FR-14, FR-22, D-8): the order M7's spend items
// follow, the grid cells and which upgrade comes next. Pure. Coins stay M7's.
import type { AccountState } from '@idleon-forge/account-state';
import type { Entry } from '@idleon-forge/knowledge';
import { ENTRY } from './kb';
import type { P2wCell } from './types';

/** "alchemy-p2w.acquisition.cauldron-high-iq-boost-req" for a P2W key "cauldron.high-iq.boostReq" (M7's rule). */
export const p2wRefOf = (key: string): string =>
  `alchemy-p2w.acquisition.${key
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/\./g, '-')}`;

/** FR-12's tiers of Acquisition ids; empty without the entry. */
export function p2wOrder(entries: Readonly<Record<string, Entry>>): string[][] {
  const e = entries[ENTRY.p2wOrder];
  if (e?.type !== 'priority') return [];
  return e.tiers.map((t) => t.filter((x): x is string => typeof x === 'string'));
}

/** M7 FR-13: the order tier an Acquisition belongs to (0-based), or null. */
export function p2wStepOf(entries: Readonly<Record<string, Entry>>, ref: string): number | null {
  const i = p2wOrder(entries).findIndex((t) => t.includes(ref));
  return i < 0 ? null : i;
}

const LIQUIDS: Record<string, string> = {
  'water-drops': 'Water',
  'liquid-n2': 'Liquid Nitrogen',
  'trench-h2o': 'Trench Seawater',
  'toxic-mercury': 'Toxic Mercury',
};
const CAULDRONS: Record<string, string> = {
  power: 'Power',
  quicc: 'Quicc',
  'high-iq': 'High-IQ',
  kazam: 'Kazam',
};
const LABELS: Record<string, string> = {
  speed: 'Speed',
  newBubble: 'New Bubble',
  boostReq: 'Boost Req',
  regen: 'Regen',
  capacity: 'Capacity',
  attempts: 'Attempts',
  rng: 'RNG',
  extraExp: 'Extra EXP',
};

/** FR-22: every Pay 2 Win upgrade as a grid cell, in FR-12's order; the next one marked. */
export function p2wCells(state: AccountState, entries: Readonly<Record<string, Entry>>): P2wCell[] {
  const list = state.account.spend?.p2w;
  const plan = state.account.alchemyPlan;
  if (!list || !plan) return [];
  const order = p2wOrder(entries).flat();
  const rank = (key: string) => {
    const i = order.indexOf(p2wRefOf(key));
    return i < 0 ? order.length : i;
  };
  const cells: P2wCell[] = [...list]
    .sort((a, b) => rank(a.key) - rank(b.key) || (a.key < b.key ? -1 : 1))
    .map((u) => {
      const [group = '', thing = '', up = ''] = u.key.split('.');
      const ref = p2wRefOf(u.key);
      const maxValue = Number(entries[ref]?.values?.maxLevel);
      const max = group === 'player' ? plan.bestAlchemyLevel : Number.isFinite(maxValue) ? maxValue : null;
      const row =
        group === 'cauldron'
          ? (CAULDRONS[thing] ?? thing)
          : group === 'liquid'
            ? (LIQUIDS[thing] ?? thing)
            : group === 'vials'
              ? 'Vials'
              : 'Player';
      const label = LABELS[group === 'cauldron' || group === 'liquid' ? up : thing] ?? up;
      return {
        key: u.key,
        row,
        label,
        level: u.level,
        max,
        closed: u.level < 0,
        next: false,
        actionKey: null,
      };
    });
  // Liquids that aren't open on the account stay off the grid (wiki: they open at Alchemy 20, 35, 80).
  const open = new Set(
    (state.account.liquids ?? []).filter((l) => l.unlocked).map((l) => Object.keys(LIQUIDS)[l.index]),
  );
  const shown = cells.filter((c) => {
    const [group, thing] = c.key.split('.');
    return group !== 'liquid' || open.has(thing);
  });
  const next = shown.find((c) => !c.closed && (c.max === null || c.level < c.max));
  if (next) next.next = true;
  return shown;
}

/** FR-14: the Player upgrades below the best Alchemy level; null when both are there. */
export function playerBehind(state: AccountState): { from: number; to: number } | null {
  const plan = state.account.alchemyPlan;
  if (!plan) return null;
  const { speedLv, extraExpLv } = plan.p2wPlayer;
  const from = Math.min(speedLv, extraExpLv);
  return from < plan.bestAlchemyLevel ? { from, to: plan.bestAlchemyLevel } : null;
}
