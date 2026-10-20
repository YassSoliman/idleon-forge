// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-16: Toolbox `account.tome` (`getTome`: `tome[]`, `bonuses[]`, `totalPoints`, `top`, `nametagClaim`)
// plus `accountOptions[196/197]` -> `account.tome`. Called from adapter.ts.
//
// V7 (game client, 2026-10-19): `TomeLvReq` is `350 + 40i + 5 max(0, i-35) + 10 max(0, i-60) + 10 max(0, i-80)
// + 15 max(0, i-100)` for display row i, `isTomeUnlocked` compares it with the Account LV, `TomePCT` is 0 for a
// metric not unlocked, and `TomeBonus` reads only the PTS total: no World 4 gate. Toolbox computes the same.
import type { TomeMetric, TomeState, TomeTier } from './tome-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const sig = (n: number): number => (n === 0 ? 0 : Number(n.toPrecision(4)));

/** Toolbox's bar colours (`segmentColors`) -> tiers. */
const TIER_OF: Record<string, TomeTier> = {
  '#ffc277': 'bronze',
  '#d6dbe0': 'silver',
  gold: 'gold',
  '#56ccff': 'blue',
};

class Unreadable extends Error {}

export function readTome(account: Dict, accountLevel: number | null): TomeState {
  const t = account.tome;
  if (!isDict(t) || !Array.isArray(t.tome)) throw new Unreadable();
  const totalPoints = finite(t.totalPoints);
  if (totalPoints === null) throw new Unreadable();
  const metrics = t.tome.flatMap((r): TomeMetric[] => {
    if (!isDict(r) || typeof r.name !== 'string') return [];
    const order = finite(r.index);
    const lvReq = finite(r.tomeLvReq);
    if (order === null || lvReq === null) return [];
    const need = isDict(r.requiredQuantities) ? r.requiredQuantities : {};
    return [
      {
        name: r.name,
        order,
        lvReq,
        quantity: sig(finite(r.quantity) ?? 0),
        points: finite(r.points) ?? 0,
        maxPoints: finite(r.maxPoints) ?? 0,
        tier: TIER_OF[String(r.color)] ?? 'bronze',
        needs: { silver: finite(need.silver), gold: finite(need.gold), blue: finite(need.blue) },
        lowerIsBetter: r.x2 === 3,
      },
    ];
  });
  const bonus = (name: string) => {
    const b = list(t.bonuses).find((x) => isDict(x) && x.name === name);
    return isDict(b) ? sig(finite(b.bonus) ?? 0) : 0;
  };
  const opts = list(account.accountOptions);
  const claim = isDict(t.nametagClaim) ? t.nametagClaim : {};
  return {
    totalPoints,
    accountLevel: accountLevel ?? 0,
    metrics: metrics.sort((a, b) => a.order - b.order),
    damagePct: bonus('_DMG'),
    skillEffPct: bonus('_Skill_Eff'),
    dropRatePct: bonus('_Drop_Rate'),
    pages: { blue: finite(opts[196]) === 1, red: finite(opts[197]) === 1 },
    rank: finite(t.top) ?? -1,
    nametags: { available: finite(claim.available) ?? 0, claimed: finite(claim.claimed) ?? 0 },
  };
}
