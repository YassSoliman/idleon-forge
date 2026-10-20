// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C FR-C3: the Anvil page's Recipes tab, per anvil tab 1-5. Each recipe in game order
// (anvil.fact.recipes, FR-C3a) with its state from `account.anvilRecipes[tab - 1][n - 1]` (-1 locked,
// 0 open, 1 crafted; 2 marks an achievement recipe, V-C9, shown as open), its materials against the
// pooled holdings (M14 holdingsOf), its Smithing level (the wiki's, labelled "(wiki)", V-C6) and who wants
// it (a Gear Plan target or a craft-next piece). A tab the account doesn't own reads "locked" whatever its
// status values; Tab 5 reads "later" (the W5 gate). Reads only: the tab adds no advice (M17).
import type { AccountState } from '@idleon-forge/account-state';
import type { GearResult } from '../gear/types';
import { holdingsOf, totalOf } from '../walkthrough/holdings';
import { anvilRecipes, type WalkthroughKnowledge } from '../walkthrough/knowledge';
import { type CraftCandidate, craftable } from './craft';
import type { RecipeTabView, RecipeView } from './types';

/** Tabs drawn on the Recipes tab: 1-4 with their recipes, 5 greyed "later". */
export const RECIPE_TABS = 5;

function fromText(r: { from: string; by?: string }): string {
  switch (r.from) {
    case 'start':
      return 'Start of the tab';
    case 'quest':
      return `Quest: ${r.by ?? ''}`.trim();
    case 'craft':
      return `Crafting ${r.by ?? 'the recipe before'}`;
    case 'drop':
      return `Drops from ${r.by ?? 'a monster'}`;
    case 'achievement':
      return `Achievement: ${r.by ?? ''}`.trim();
    case 'world':
      return `Entering ${r.by ?? 'the next world'}`;
    case 'item':
      return `Using ${r.by ?? 'an item'}`;
    case 'task':
      return 'A Task Board unlock';
    case 'merit':
      return 'A Merit Shop purchase';
    default:
      return 'Check in game';
  }
}

/** Names and pooled holdings of every recipe's materials and of the recipes themselves (shared maps). */
export function recipeLookups(
  state: AccountState,
  kb: WalkthroughKnowledge,
  nameOf: (raw: string) => string,
): { names: Record<string, string>; held: Record<string, number> } {
  const names: Record<string, string> = {};
  const held: Record<string, number> = {};
  for (const [raw, r] of Object.entries(anvilRecipes(kb))) {
    names[raw] = r.name;
    for (const [m] of r.mats) {
      if (!(m in names)) names[m] = nameOf(m);
      if (!(m in held)) held[m] = totalOf(holdingsOf(state, m));
    }
  }
  return { names, held };
}

export function recipeTabs(
  state: AccountState,
  kb: WalkthroughKnowledge,
  gear: GearResult | null,
  cands: readonly CraftCandidate[],
  picks: ReadonlyMap<number, CraftCandidate>,
): RecipeTabView[] {
  const owned = state.account.anvilTabsOwned ?? null;
  const status = state.account.anvilRecipes ?? null;
  const gearRows = (kb.facts['gear.fact.recipes']?.rows ?? {}) as Record<
    string,
    { from: string; by?: string }
  >;
  const wanted = new Map<string, number[]>();
  for (const g of gear?.characters ?? [])
    for (const s of g.slots)
      if (s.target && (s.state === 'empty' || s.state === 'behind'))
        wanted.set(s.target.rawName, [...new Set([...(wanted.get(s.target.rawName) ?? []), g.index])]);
  const next = new Map<string, number[]>();
  for (const [i, p] of picks) next.set(p.rawName, [...(next.get(p.rawName) ?? []), i]);
  void cands;
  const byTab = new Map<number, RecipeView[]>();
  for (const [rawName, r] of Object.entries(anvilRecipes(kb))) {
    const v = status?.[r.tab - 1]?.[r.n - 1];
    const tabOwned = r.tab <= 1 || (owned !== null && owned >= r.tab);
    const state_: RecipeView['state'] =
      v === undefined || status === null
        ? 'unknown'
        : !tabOwned || v < 0
          ? 'locked'
          : v === 1
            ? 'crafted'
            : 'open';
    const wantedBy = wanted.get(rawName);
    const craftNext = next.get(rawName);
    const view: RecipeView = {
      rawName,
      n: r.n,
      lv: r.lv ?? null,
      state: state_,
      from: fromText(gearRows[rawName] ?? r),
      materials: r.mats.map(([m, need]) => [m, need] as [string, number]),
      ...(wantedBy ? { wantedBy } : {}),
      ...(craftNext ? { craftNext } : {}),
      ...(craftable(state, r) ? { craftable: true as const } : {}),
    };
    byTab.set(r.tab, [...(byTab.get(r.tab) ?? []), view]);
  }
  const out: RecipeTabView[] = [];
  for (let tab = 1; tab <= RECIPE_TABS; tab++) {
    const recipes = (byTab.get(tab) ?? []).sort((a, b) => a.n - b.n);
    const tabOwned = tab <= 1 || (owned !== null && owned >= tab);
    out.push({
      tab,
      status: tab >= RECIPE_TABS ? 'later' : tabOwned ? 'owned' : 'locked',
      crafted: recipes.filter((x) => x.state === 'crafted').length,
      open: recipes.filter((x) => x.state === 'open').length,
      locked: recipes.filter((x) => x.state === 'locked').length,
      recipes,
    });
  }
  return out;
}
