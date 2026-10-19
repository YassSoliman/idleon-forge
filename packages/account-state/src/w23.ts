// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the World 3 System pages: Toolbox's parsed prayers and shrines -> Account State (w23-types.ts).
// Called from adapter.ts; like it, the only place that knows these Toolbox paths.
import type { ToolboxCalls } from '@idleon-forge/toolbox-parsers';
import type { PrayerInfo, ShrineInfo, W23AccountFields } from './w23-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const text = (v: unknown): string => (typeof v === 'string' ? v : '');

interface Collector {
  unknown(path: string): void;
}

export interface W23Inputs {
  account: Dict;
  failedSections: readonly string[];
  calls: ToolboxCalls | null;
}

export function prayersOf(list: unknown): PrayerInfo[] | null {
  if (!Array.isArray(list) || list.length === 0) return null;
  const out: PrayerInfo[] = [];
  for (const p of list) {
    if (!isDict(p) || typeof p.name !== 'string') return null;
    const index = finite(p.prayerIndex);
    const x1 = finite(p.x1);
    const x2 = finite(p.x2);
    const wave = finite(p.unlockWave);
    if (index === null || x1 === null || x2 === null || wave === null) return null;
    out.push({
      index,
      name: p.name,
      effect: text(p.effect),
      curse: text(p.curse),
      x1,
      x2,
      level: Math.max(0, finite(p.level) ?? 0),
      maxLevel: finite(p.maxLevel) ?? 0,
      unlockZone: text(p.unlockZone),
      unlockWave: wave,
    });
  }
  return out;
}

export function shrinesOf(
  list: unknown,
  bonuses: ReadonlyArray<{ baseBonus: number; bonusPerLevel: number }>,
): ShrineInfo[] | null {
  if (!Array.isArray(list) || list.length === 0 || bonuses.length < list.length) return null;
  const out: ShrineInfo[] = [];
  for (const [i, s] of list.entries()) {
    if (!isDict(s) || typeof s.name !== 'string') return null;
    const base = finite(bonuses[i]?.baseBonus);
    const per = finite(bonuses[i]?.bonusPerLevel);
    if (base === null || per === null) return null;
    out.push({
      index: i,
      name: s.name,
      desc: text(s.desc),
      mapId: finite(s.mapId) ?? 0,
      level: Math.max(0, finite(s.shrineLevel) ?? 0),
      baseBonus: base,
      bonusPerLevel: per,
    });
  }
  return out;
}

export function readW23(input: W23Inputs, c: Collector): W23AccountFields {
  const { account, failedSections, calls } = input;
  const prayers = failedSections.includes('prayers') ? null : prayersOf(account.prayers);
  if (prayers === null) c.unknown('account.prayers');
  let bonuses: Array<{ baseBonus: number; bonusPerLevel: number }> | null = null;
  try {
    bonuses = calls ? calls.shrineBonuses() : null;
  } catch {
    bonuses = null;
  }
  // Without the worker's Toolbox calls (hand-run tests) the bonus table is missing: null, not Unknown.
  if (!calls) return { prayers, shrines: null };
  const shrines =
    failedSections.includes('shrines') || bonuses === null ? null : shrinesOf(account.shrines, bonuses);
  if (shrines === null) c.unknown('account.shrines');
  return { prayers, shrines };
}
