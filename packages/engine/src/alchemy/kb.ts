// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What M19 reads from the compiled Knowledge Base (docs/specs/M19-alchemy.md TR-3, TR-4): its entries'
// `values` (the plan rows and every word it shows) and its generated fact tables. A missing table or a
// malformed row is null here, so the module stays silent rather than guess (FR-26).
import type { CauldronId } from '@idleon-forge/account-state';
import type { StageId } from '@idleon-forge/knowledge';
import type { M20Knowledge } from '../slots/kb';
import type { Band } from './types';

export type AlchemyKnowledge = M20Knowledge;

export const ENTRY = {
  plan: 'alchemy-bubbles.priority.plan',
  bubbleGoal: 'alchemy-bubbles.goal.level-next',
  vialPlan: 'alchemy-vials.priority.plan',
  vialGoal: 'alchemy-vials.goal.level-next',
  attempts: 'alchemy-vials.check.daily-attempts',
  p2wOrder: 'alchemy-p2w.priority.order',
  playerBehind: 'alchemy-p2w.check.player-behind',
  talentPoint: 'alchemy.check.talent-point',
  waterLine: 'alchemy.check.liquid-cap-line',
  waterBlocker: 'alchemy.check.liquid-cap',
  spendBrew: 'alchemy-bubbles.check.spend-brew',
} as const;

export const FACT = {
  curves: 'alchemy-bubbles.fact.curves',
  vials: 'alchemy-vials.fact.catalogue',
  vialCosts: 'alchemy-vials.fact.costs',
  shop: 'alchemy.fact.liquid-shop',
} as const;

export interface CurveRow {
  rawName: string;
  cauldron: CauldronId;
  index: number;
  name: string;
  /** `name`: the material's Toolbox display name ("Copper_Ore"), or the `Liquid<n>` rawName. */
  materials: { rawName: string; baseCost: number; name: string }[];
  func: string;
  x1: number;
  x2: number;
  linear: boolean;
  bands: [number, number, number] | null;
}

export interface VialRow {
  index: number;
  name: string;
  item: string;
  /** Toolbox display name ("Bean_Slices"). */
  itemName: string;
  score: number;
  liquid: number;
  stat: string;
}

export interface ShopRow {
  index: number;
  name: string;
  x1: number;
  x2: number;
  resetsDaily: boolean;
}

export type RowWhen = 'always' | 'class' | 'skill' | 'equipped';
export interface PlanRow {
  n: number;
  /** In order; `skill` rows name the AFK type each bubble needs. */
  bubbles: { rawName: string; skill: string | null }[];
  when: RowWhen;
  from: StageId | null;
}

export type VialWhen = 'always' | 'brewer' | 'nitrogen' | 'shaman';
export interface VialPlanRow {
  n: number;
  /** Catalogue indices, or 'rest' for every other unlocked W1-W3 vial. */
  vials: number[] | 'rest';
  when: VialWhen;
  from: StageId | null;
  /** Target level for the W2 band and for the W3 bands. */
  targets: [number, number];
}

const valuesOf = (kb: AlchemyKnowledge, id: string) => kb.entries[id]?.values ?? {};
const str = (v: unknown) => (typeof v === 'string' ? v : null);

export function factRows<T>(kb: AlchemyKnowledge, id: string): T | null {
  return (kb.facts[id]?.rows as T | undefined) ?? null;
}

/** FR-2's rows from `alchemy-bubbles.priority.plan`; null when the entry or a row is malformed. */
export function planRows(kb: AlchemyKnowledge): PlanRow[] | null {
  const v = valuesOf(kb, ENTRY.plan);
  const count = Number(v.rows);
  if (!Number.isInteger(count) || count < 1) return null;
  const rows: PlanRow[] = [];
  for (let n = 1; n <= count; n++) {
    const list = str(v[`row-${n}`]);
    const when = str(v[`when-${n}`]) as RowWhen | null;
    if (!list || !when || !['always', 'class', 'skill', 'equipped'].includes(when)) return null;
    const bubbles = list.split(',').map((x) => {
      const [rawName = '', skill = null] = x.trim().split(':');
      return { rawName, skill };
    });
    rows.push({ n, bubbles, when, from: (str(v[`from-${n}`]) as StageId | null) ?? null });
  }
  return rows;
}

export function vialPlanRows(kb: AlchemyKnowledge): VialPlanRow[] | null {
  const v = valuesOf(kb, ENTRY.vialPlan);
  const count = Number(v.rows);
  if (!Number.isInteger(count) || count < 1) return null;
  const rows: VialPlanRow[] = [];
  for (let n = 1; n <= count; n++) {
    const list = str(v[`row-${n}`]);
    const when = str(v[`when-${n}`]) as VialWhen | null;
    const t = str(v[`target-${n}`])?.split(/[,|]/).map(Number);
    if (!list || !when || !t || t.length !== 2 || t.some((x) => !Number.isInteger(x))) return null;
    rows.push({
      n,
      vials: list.trim() === '*' ? 'rest' : list.split(/[,|]/).map((x) => Number(x)),
      when,
      from: (str(v[`from-${n}`]) as StageId | null) ?? null,
      targets: [t[0] as number, t[1] as number],
    });
  }
  return rows;
}

/** FR-1 / D-3: the band of a Stage; null before W2. */
export function bandOf(stage: StageId | null): Band | null {
  switch (stage) {
    case 'W2-early':
    case 'W2-mid':
    case 'W2-late':
      return 'w2';
    case 'W3-early':
    case 'W3-mid':
      return 'w3';
    case 'W3-late':
    case 'W4-entry':
      return 'w3-late';
    default:
      return null;
  }
}

export const BAND_INDEX: Record<Band, 0 | 1 | 2> = { w2: 0, w3: 1, 'w3-late': 2 };

const SPECIAL_NAMES: Record<string, string> = {
  'BUG]': 'Bug²',
  FMJ: 'FMJ',
  LAAARRRRYYYY: 'Laaarrrryyyy',
  SKINNY_0_CAL: 'Skinny 0 Cal',
  '40-40_PURITY': '40-40 Purity',
};
/** "ROID_RAGIN" -> "Roid Ragin", "Copper_Ore" -> "Copper Ore". */
export function titleName(id: string): string {
  const special = SPECIAL_NAMES[id];
  if (special) return special;
  return id
    .split('_')
    .filter(Boolean)
    .map((w) => (w === 'IQ' || /^\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');
}

export const CAULDRON_NAMES: Record<CauldronId, string> = {
  power: 'Power',
  quicc: 'Quicc',
  'high-iq': 'High-IQ',
  kazam: 'Kazam',
};
export const LIQUID_NAMES = ['Water', 'Liquid Nitrogen', 'Trench Seawater', 'Toxic Mercury'] as const;
/** wiki Alchemy: Liquid Nitrogen opens at the best Alchemy level 20, Trench Seawater 35, Toxic Mercury 80. */
export const LIQUID_OPENS_AT = [null, 20, 35, 80] as const;
/** The class line each class cauldron's bubbles serve (FR-2 rows 1 and 3, 9). */
export const CAULDRON_CLASS: Partial<Record<CauldronId, string>> = {
  power: 'Warrior',
  quicc: 'Archer',
  'high-iq': 'Mage',
};
/** The brew-speed vial stat of each cauldron (Toolbox CAULDRON_INFO brewVialStat). */
export const BREW_STAT: Record<string, CauldronId> = {
  OrangeBrew: 'power',
  GreenBrew: 'quicc',
  PurpleBrew: 'high-iq',
  YellowBrew: 'kazam',
};
