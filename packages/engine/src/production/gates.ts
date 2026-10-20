// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C FR-C1, FR-C1a, FR-C2: a gate as a link. The gate-homes registry (walkthrough.fact.gate-homes)
// says which System page and tab explains each gate kind; these build the span the UI draws as one
// GateLink chip, and find the anvil gates inside text that still names them in words ("Craft Anvil Tab 3
// at the anvil", "(anvil tab 2)"), so every renderer can turn them into links (GC1).
import { type AccountState, isKnown } from '@idleon-forge/account-state';
import { anvilTabItem } from '../walkthrough/expand';
import { HoldingsPool } from '../walkthrough/holdings';
import { anvilRecipes, itemOf, type WalkthroughKnowledge } from '../walkthrough/knowledge';
import type { GateSpan } from './types';

export const GATE_HOMES = 'walkthrough.fact.gate-homes';

/** `#system-<id>?tab=<tab>&focus=<key>` (FR-C2). */
export const systemHref = (system: string, tab: string, focus: string | null) =>
  `#system-${system}?tab=${encodeURIComponent(tab)}${focus ? `&focus=${encodeURIComponent(focus)}` : ''}`;

const owned = (state: AccountState): number | null =>
  isKnown(state, 'account.anvilTabsOwned') ? (state.account.anvilTabsOwned ?? null) : null;

/** The tab item's materials and how many are fully held (pooled holdings). */
export function tabReadiness(
  state: AccountState,
  kb: WalkthroughKnowledge,
  tab: number,
): { ready: number; of: number; materials: Array<{ rawName: string; need: number; held: number }> } {
  const raw = anvilTabItem(tab);
  const mats =
    anvilRecipes(kb)[raw]?.mats?.map(([rawName, need]) => ({ rawName, need })) ??
    itemOf(kb, raw)?.recipe?.materials.map((m) => ({ rawName: m.rawName, need: m.amount })) ??
    [];
  const pool = new HoldingsPool(state);
  const materials = mats.map((m) => ({ ...m, held: pool.available(m.rawName) }));
  return { ready: materials.filter((m) => m.held >= m.need).length, of: materials.length, materials };
}

/**
 * An anvil tab as a gate. Met (owned, or tab 1): a place, the Recipes tab on that tab (or on `recipe`).
 * Unmet: a task, the Anvil Walkthrough focused on the tab item, with "{ready} of {n} ready".
 */
export function tabGate(
  state: AccountState,
  kb: WalkthroughKnowledge,
  tab: number,
  recipe?: { rawName: string; name: string },
): GateSpan {
  const have = owned(state);
  const met = tab <= 1 ? true : have === null ? null : have >= tab;
  if (met === false) {
    const r = tabReadiness(state, kb, tab);
    return {
      kind: 'gate',
      gate: 'anvil-tab',
      label: `Anvil Tab ${tab}`,
      href: systemHref('anvil', 'walkthrough', anvilTabItem(tab)),
      system: 'anvil',
      tab: 'walkthrough',
      focus: anvilTabItem(tab),
      met: false,
      icon: anvilTabItem(tab),
      what: `what Anvil Tab ${tab} needs`,
      ready: r.ready,
      of: r.of,
    };
  }
  const focus = recipe?.rawName ?? `tab-${tab}`;
  return {
    kind: 'gate',
    gate: recipe ? 'recipe' : 'anvil-tab',
    label: `Anvil tab ${tab}`,
    href: systemHref('anvil', 'recipes', focus),
    system: 'anvil',
    tab: 'recipes',
    focus,
    met,
    icon: anvilTabItem(tab),
    what: recipe ? `open ${recipe.name}'s recipe` : `open tab ${tab}'s recipes`,
  };
}

/** The gate of a recipe by rawName: its tab, met or not (null when the table has no row). */
export function recipeGate(
  state: AccountState,
  kb: WalkthroughKnowledge,
  rawName: string,
  name: string,
): GateSpan | null {
  const r = anvilRecipes(kb)[rawName];
  return r ? tabGate(state, kb, r.tab, { rawName, name }) : null;
}

/** A piece of text: words, or a gate. */
export type TextPart = string | GateSpan;

const TAB_WORDS = /\(?\b(?:craft )?anvil tab (\d)\b\)?/gi;

/**
 * FR-C1, GC1: the anvil gates inside a sentence, as spans. "(anvil tab 3)" becomes a chip; "Craft Anvil
 * Tab 4 at the anvil" keeps its words and gains the chip after them. Pure.
 */
export function splitGates(text: string, state: AccountState, kb: WalkthroughKnowledge): TextPart[] {
  const out: TextPart[] = [];
  let last = 0;
  for (const m of text.matchAll(TAB_WORDS)) {
    const tab = Number(m[1]);
    const at = m.index ?? 0;
    const whole = m[0];
    const bracketed = whole.startsWith('(') && whole.endsWith(')');
    const before = text.slice(last, at);
    if (bracketed) {
      out.push(before.replace(/\s+$/, ''));
    } else {
      out.push(before + whole);
    }
    out.push(tabGate(state, kb, tab));
    last = at + whole.length;
  }
  out.push(text.slice(last));
  return out.filter((x) => typeof x !== 'string' || x !== '');
}
