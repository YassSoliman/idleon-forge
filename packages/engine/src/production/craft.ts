// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C FR-C10: craft next. Per character, the Gear Plan slot target (lit or not, any stage) closest to
// done that it can craft now: its tab owned, its recipe open, Smithing met (best on the account; the
// wiki's level, V-C6). Closest = fewest missing materials as a share of the recipe, after the holdings
// the shown Walkthroughs and the next tab already claimed (7.1); the slot's own worn piece counts for its
// own upgrade (M18 FR-15). Ties to the most levels behind, then slot order. And the pieces 2+ characters
// want with every gate met and at least one copy held, with how many copies the pooled holdings make.
import { type AccountState, isKnown } from '@idleon-forge/account-state';
import type { GearResult, GearSlotView } from '../gear/types';
import { holdingsOf, totalOf } from '../walkthrough/holdings';
import { type AnvilRecipeRow, anvilRecipes, type WalkthroughKnowledge } from '../walkthrough/knowledge';

export interface CraftCandidate {
  characterIndex: number;
  slot: GearSlotView['slot'];
  rawName: string;
  name: string;
  tab: number;
  levelsBehind: number;
  /** The recipe's materials: need, held after claims, and whether the held part is the worn piece. */
  materials: Array<{ rawName: string; need: number; held: number; worn: boolean }>;
  missingShare: number;
  slotOrder: number;
}

/** Holdings left after the higher Demand sources' claims. */
export class Holdings {
  constructor(
    private readonly state: AccountState,
    private readonly claimed: ReadonlyMap<string, number>,
  ) {}
  total(rawName: string): number {
    return Math.max(0, totalOf(holdingsOf(this.state, rawName)) - (this.claimed.get(rawName) ?? 0));
  }
}

const bestSmithing = (state: AccountState): number | null => {
  const known = state.characters.filter((c) => isKnown(state, `characters[${c.index}].smithingLevel`));
  return known.length ? Math.max(...known.map((c) => c.smithingLevel ?? 0)) : null;
};

/** Whether a recipe can be crafted now: tab owned, recipe open, Smithing met (FR-C10). */
export function craftable(state: AccountState, r: AnvilRecipeRow): boolean {
  const owned = state.account.anvilTabsOwned ?? null;
  if (r.tab > 1 && (owned === null || owned < r.tab)) return false;
  const st = state.account.anvilRecipes?.[r.tab - 1]?.[r.n - 1];
  if (st === undefined || st < 0) return false;
  const best = bestSmithing(state);
  return best !== null && best >= r.lv;
}

const isGearPiece = (raw: string) => /^(Equipment|FishingRod|CatchingNet|TestObj)/.test(raw);

export function craftCandidates(
  state: AccountState,
  kb: WalkthroughKnowledge,
  gear: GearResult,
  holdings: Holdings,
): CraftCandidate[] {
  const recipes = anvilRecipes(kb);
  const out: CraftCandidate[] = [];
  for (const g of gear.characters) {
    g.slots.forEach((s, slotOrder) => {
      const t = s.target;
      if (!t || s.state === 'ok' || s.state === 'm20') return;
      const r = recipes[t.rawName];
      if (!r || !craftable(state, r)) return;
      const materials = r.mats.map(([rawName, need]) => {
        const worn = s.equipped?.rawName === rawName && isGearPiece(rawName);
        const held = worn ? need : Math.min(need, holdings.total(rawName));
        return { rawName, need, held, worn };
      });
      const need = materials.reduce((n, m) => n + m.need, 0);
      const missing = materials.reduce((n, m) => n + (m.need - m.held), 0);
      out.push({
        characterIndex: g.index,
        slot: s.slot,
        rawName: t.rawName,
        name: t.name,
        tab: r.tab,
        levelsBehind: s.levelsBehind ?? 0,
        materials,
        missingShare: need > 0 ? missing / need : 1,
        slotOrder,
      });
    });
  }
  return out;
}

/** The pick per character (FR-C10 order). */
export function craftNextOf(cands: readonly CraftCandidate[]): Map<number, CraftCandidate> {
  const by = new Map<number, CraftCandidate>();
  for (const c of cands) {
    const cur = by.get(c.characterIndex);
    if (
      !cur ||
      c.missingShare < cur.missingShare - 1e-12 ||
      (Math.abs(c.missingShare - cur.missingShare) <= 1e-12 &&
        (c.levelsBehind > cur.levelsBehind ||
          (c.levelsBehind === cur.levelsBehind && c.slotOrder < cur.slotOrder)))
    )
      by.set(c.characterIndex, c);
  }
  return by;
}

export interface SharedCraft {
  rawName: string;
  name: string;
  tab: number;
  who: number[];
  /** Copies the pooled holdings make (at most `who.length`). */
  enough: number;
  /** The material that runs out first at `who.length` copies. */
  short: { rawName: string; held: number; need: number } | null;
}

/**
 * Pieces 2+ characters have as a slot target, every gate met, at least one copy fully held (FR-C10, RX-5).
 * A consumed piece counts the copy each wanting character wears; one more is crafted from its own recipe.
 */
export function sharedCrafts(
  state: AccountState,
  kb: WalkthroughKnowledge,
  cands: readonly CraftCandidate[],
  holdings: Holdings,
): SharedCraft[] {
  const recipes = anvilRecipes(kb);
  const groups = new Map<string, CraftCandidate[]>();
  for (const c of cands) groups.set(c.rawName, [...(groups.get(c.rawName) ?? []), c]);
  const out: SharedCraft[] = [];
  for (const [raw, list] of groups) {
    const who = [...new Set(list.map((c) => c.characterIndex))];
    if (who.length < 2) continue;
    const r = recipes[raw];
    if (!r) continue;
    // Total needs for the first k characters (in Visit Order as given).
    const needsFor = (k: number) => {
      const need = new Map<string, number>();
      const add = (m: string, n: number) => need.set(m, (need.get(m) ?? 0) + n);
      for (const c of list.slice(0, k))
        for (const m of c.materials) {
          if (m.worn) continue;
          if (isGearPiece(m.rawName) && holdings.total(m.rawName) < (need.get(m.rawName) ?? 0) + m.need) {
            const sub = recipes[m.rawName];
            if (sub && craftable(state, sub)) {
              for (const [x, n] of sub.mats) add(x, n * m.need);
              continue;
            }
          }
          add(m.rawName, m.need);
        }
      return need;
    };
    const fits = (k: number) => [...needsFor(k)].every(([m, n]) => holdings.total(m) >= n);
    let enough = 0;
    for (let k = 1; k <= list.length; k++) if (fits(k)) enough = k;
    if (enough < 1) continue;
    let short: SharedCraft['short'] = null;
    if (enough < list.length) {
      for (const [m, n] of needsFor(list.length)) {
        const held = holdings.total(m);
        if (held < n && (!short || held / n < short.held / short.need)) short = { rawName: m, held, need: n };
      }
    }
    out.push({
      rawName: raw,
      name: list[0]?.name ?? raw,
      tab: r.tab,
      who: list.map((c) => c.characterIndex),
      enough,
      short,
    });
  }
  return out.sort((a, b) => b.who.length - a.who.length || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}
