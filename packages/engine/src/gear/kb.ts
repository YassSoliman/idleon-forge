// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What M18 reads from the compiled Knowledge Base (docs/specs/M18-gear-tools.md TR-3, TR-4): its entries'
// `values` (every word it shows), the generated ladder and Smithy sets, and the authored recipe and
// Gear Plan facts.
import type { CharacterState } from '@idleon-forge/account-state';
import { type Entry, type FactTable, render, type SlotValue, type StageId } from '@idleon-forge/knowledge';
import { classLabel } from '../core/labels';
import type { SourceRef } from '../result';

export interface GearKnowledge {
  entries: Readonly<Record<string, Entry>>;
  facts: Readonly<Record<string, FactTable>>;
}

export const ENTRY = {
  held: 'gear.check.equip-held',
  empty: 'gear.check.empty-slot',
  tool: 'gear.check.afk-tool',
  next: 'gear.check.next-piece',
  hire: 'armor-smithy.check.hire',
  register: 'armor-smithy.check.register',
} as const;

export const FACT = {
  ladder: 'gear.fact.ladder',
  recipes: 'gear.fact.recipes',
  plan: 'gear.fact.plan',
  sets: 'armor-smithy.fact.sets',
  classTree: 'classes.fact.class-tree',
  merits: 'merit-shop.fact.rows',
} as const;

export type SlotFamily =
  | 'helmet'
  | 'shirt'
  | 'pants'
  | 'shoes'
  | 'weapon'
  | 'pendant'
  | 'ring'
  | 'pickaxe'
  | 'hatchet'
  | 'rod'
  | 'net';

export interface Piece {
  rawName: string;
  name: string;
  slot: SlotFamily;
  set: string | null;
  cls: string;
  lvReq: number;
  def: number;
  wp: number;
  str: number;
  agi: number;
  wis: number;
  luk: number;
  pct: Array<{ txt: string; val: number }>;
  slots: number;
  materials: Array<{ rawName: string; amount: number; ref: string }>;
  consumes: Array<{ rawName: string; amount: number }>;
  unlock: { world: number; row: number } | null;
}

export interface Recipe {
  tab: number;
  /** 1-based recipe number on its tab. */
  n: number;
  lv: number;
  from: 'start' | 'task' | 'merit' | 'drop' | 'craft' | 'unknown';
  world?: number;
  purchase?: number;
  by?: string;
  after?: string;
}

export interface PlanRow {
  slot: SlotFamily;
  family?: string;
  from: StageId;
  piece: string;
  cite: number;
  confidence: 'H' | 'M' | 'L';
  needsRecipe?: boolean;
}

export interface SmithySet {
  set: string;
  name: string;
  armors: string[];
  tools: string[];
  weapons: string[];
  requiredTools: number;
  requiredWeapon: number;
  bonusValue: number;
  bonus: string;
}

export interface GearFacts {
  ladder: ReadonlyMap<string, Piece>;
  recipes: ReadonlyMap<string, Recipe>;
  plan: readonly PlanRow[];
  planSources: SourceRef[];
  sets: readonly SmithySet[];
  /** class name -> line ('Warrior', 'Archer', 'Mage', 'Journeyman', null for Beginner). */
  lines: ReadonlyMap<string, string | null>;
  /** world -> merit row slot of its "Smithing recipes" row. */
  meritSlot: ReadonlyMap<number, number>;
}

const toSource = (s: {
  title: string;
  url: string;
  tier: 1 | 2 | 3 | 4;
  verified: string;
  claimDate?: string;
  gameVersion: string;
}): SourceRef => ({
  label: s.title,
  url: s.url,
  tier: s.tier,
  verifiedOn: s.verified,
  ...(s.claimDate ? { claimDate: s.claimDate } : {}),
  gameVersion: s.gameVersion,
});

/** The fact tables M18 needs, or null when one is not shipped (no M18 output then). */
export function gearFacts(kb: GearKnowledge): GearFacts | null {
  const ladder = kb.facts[FACT.ladder]?.rows as Record<string, Omit<Piece, 'rawName'>> | undefined;
  const recipes = kb.facts[FACT.recipes]?.rows as Record<string, Recipe> | undefined;
  const plan = kb.facts[FACT.plan];
  const sets = kb.facts[FACT.sets]?.rows as SmithySet[] | undefined;
  const tree = kb.facts[FACT.classTree]?.rows as Array<{ class: string; line: string | null }> | undefined;
  if (!ladder || !recipes || !plan || !sets || !tree) return null;
  const merits =
    (kb.facts[FACT.merits]?.rows as Array<{ id: string; world: number; slot: number }> | undefined) ?? [];
  const meritSlot = new Map<number, number>();
  for (const r of merits) if (/^w\d-smithing-recipes\d$/.test(r.id)) meritSlot.set(r.world, r.slot);
  return {
    ladder: new Map(Object.entries(ladder).map(([rawName, p]) => [rawName, { rawName, ...p }])),
    recipes: new Map(Object.entries(recipes)),
    plan: plan.rows as unknown as PlanRow[],
    planSources: plan.sources.map(toSource),
    sets,
    lines: new Map(tree.map((r) => [r.class, r.line])),
    meritSlot,
  };
}

export function sourcesOf(kb: GearKnowledge, id: string): SourceRef[] {
  return (kb.entries[id]?.sources ?? []).map(toSource);
}

/** A template from an entry's `values`, rendered; '' when the entry, the value or a slot is missing. */
export function say(
  kb: GearKnowledge,
  id: string,
  key: string,
  slots: Record<string, SlotValue> = {},
): string {
  const t = kb.entries[id]?.values[key];
  if (typeof t !== 'string') return '';
  try {
    return render(t, slots);
  } catch {
    return '';
  }
}

/** "Squire Lv 85": class and level only, never a name. */
export const who = (c: Pick<CharacterState, 'class' | 'level'>) => `${classLabel(c)} Lv ${c.level}`;

/** "a, b and c". */
export const joinAnd = (xs: readonly string[]) =>
  xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

/** "Copper_Band" / "Copper Band": a display name. */
export const human = (s: string) => s.replace(/_/g, ' ').trim();

/** "2,000". */
export const int = (n: number) => Math.round(n).toLocaleString('en-US');
