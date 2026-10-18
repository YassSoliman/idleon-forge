// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M19 Alchemy (docs/specs/M19-alchemy.md TR-2): Toolbox output -> `account.alchemyPlan`. Called from
// adapter.ts after M20's skill fields (it reads each character's Alchemy level); like it, the only place
// that knows these Toolbox paths. Levels and counters only, never a cost (TR-1). Null when the alchemy
// section failed, a value is missing, or any character's Alchemy level can't be read.
import type { AlchemyAccountFields, AlchemyPlanState } from './alchemy-types';
import type { CharacterState } from './types';
import type { CauldronId } from './unspent-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

const CAULDRONS: readonly CauldronId[] = ['power', 'quicc', 'high-iq', 'kazam'];
/** The W1-W3 vials: catalogue indices 0-41, the vials before the first W5 one (Capachino, 42). */
export const W13_VIALS = 42;

interface Collector {
  unknown(path: string): void;
}

export interface AlchemyInputs {
  account: Dict;
  states: CharacterState[];
  failedSections: readonly string[];
}

function readBubbles(alch: Dict): Record<CauldronId, number[]> | null {
  const all: unknown = alch.bubbles;
  if (!isDict(all)) return null;
  const out = {} as Record<CauldronId, number[]>;
  for (const cauldron of CAULDRONS) {
    const list: unknown = all[cauldron];
    if (!Array.isArray(list)) return null;
    const levels: number[] = [];
    for (const b of list as unknown[]) {
      const index = isDict(b) ? finite(b.index) : null;
      const level = isDict(b) ? finite(b.level) : null;
      if (index === null || level === null) return null;
      levels[index] = level;
    }
    out[cauldron] = Array.from(levels, (l) => l ?? 0);
  }
  return out;
}

function readVials(alch: Dict): number[] | null {
  if (!Array.isArray(alch.vials)) return null;
  const out = alch.vials.slice(0, W13_VIALS).map((v) => (isDict(v) ? finite(v.level) : null));
  return out.some((l) => l === null) ? null : (out as number[]);
}

function readPlan(input: AlchemyInputs): AlchemyPlanState | null {
  const alch = input.account.alchemy;
  if (!isDict(alch) || !isDict(alch.p2w)) return null;
  const bubbles = readBubbles(alch);
  const vials = readVials(alch);
  const bought = Array.isArray(alch.multiplierArray) ? alch.multiplierArray.map((x) => finite(x)) : null;
  const player = isDict(alch.p2w.player) ? alch.p2w.player : null;
  const speedLv = finite(player?.speedLv);
  const extraExpLv = finite(player?.extraExpLv);
  const levels = input.states.map((s) => s.skills?.alchemy?.level ?? null);
  if (!bubbles || !vials || !bought || bought.some((x) => x === null)) return null;
  if (speedLv === null || extraExpLv === null) return null;
  if (levels.length === 0 || levels.some((l) => l === null)) return null;
  return {
    bubbleLevels: bubbles,
    vialLevels: vials,
    liquidShopBought: bought as number[],
    p2wPlayer: { speedLv, extraExpLv },
    bestAlchemyLevel: Math.max(...(levels as number[])),
  };
}

export function readAlchemyPlan(input: AlchemyInputs, c: Collector): AlchemyAccountFields {
  if (input.failedSections.includes('alchemy')) {
    c.unknown('account.alchemyPlan');
    return { alchemyPlan: null };
  }
  let plan: AlchemyPlanState | null = null;
  try {
    plan = readPlan(input);
  } catch {
    plan = null;
  }
  if (plan === null) c.unknown('account.alchemyPlan');
  return { alchemyPlan: plan };
}
