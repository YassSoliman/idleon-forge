// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 FR-2 to FR-5: a target (a quest, or a craftable item) expanded into its Requirement Tree from
// generated facts only (ADR 0007). Quantities multiply down the tree, but only for what is still
// missing: a recipe whose output is partly held needs inputs for the rest only. Expansion stops at a
// leaf, at depth 6, or when an item reappears on its own path (a cycle); both make a leaf with
// `stoppedBecause` and a diagnostic, never an error (FR-3). Gates are nodes that are met, unmet or
// unknown, never amounts (FR-4); an unmet anvil tab gate expands into the tab item's own subtree.
import { type AccountState, isKnown } from '@idleon-forge/account-state';
import { type HoldingsPool, holdingsKnown, holdingsOf } from './holdings';
import {
  human,
  type ItemData,
  itemOf,
  type QuestData,
  questOf,
  recipeTabs,
  type WalkthroughKnowledge,
} from './knowledge';
import type { ReqNode } from './types';

export const MAX_DEPTH = 6;
/** The item that unlocks anvil tab n for every anvil (crafts.json: Anvil_Tab_2 ... Anvil_Tab_7). */
export const anvilTabItem = (tab: number) => `EquipmentSmithingTabs${tab}`;

export interface ExpandContext {
  state: AccountState;
  kb: WalkthroughKnowledge;
  pool: HoldingsPool;
  diagnostics: string[];
}

type ItemNode = Extract<ReqNode, { kind: 'item' }>;
type GateNode = Extract<ReqNode, { kind: 'gate' }>;

const maxSmithing = (state: AccountState): number | null => {
  const known = state.characters.filter((c) => isKnown(state, `characters[${c.index}].smithingLevel`));
  if (known.length === 0) return null;
  return Math.max(...known.map((c) => c.smithingLevel ?? 0));
};

function smithingGate(ctx: ExpandContext, level: number, depth: number): GateNode {
  const best = maxSmithing(ctx.state);
  return {
    kind: 'gate',
    gate: 'smithing',
    label: `Smithing ${level}`,
    met: best === null ? null : best >= level,
    children: [],
    depth,
    level,
  };
}

function tabGate(ctx: ExpandContext, raw: string, path: string[], depth: number): GateNode {
  const tab = recipeTabs(ctx.kb)[raw];
  const owned = isKnown(ctx.state, 'account.anvilTabsOwned')
    ? (ctx.state.account.anvilTabsOwned ?? null)
    : null;
  if (tab === undefined)
    return { kind: 'gate', gate: 'anvil-tab', label: 'anvil tab', met: null, children: [], depth };
  const met = tab <= 1 ? true : owned === null ? null : owned >= tab;
  const children = met === false ? [expandItem(ctx, anvilTabItem(tab), 1, path, depth + 1)] : [];
  return { kind: 'gate', gate: 'anvil-tab', label: `Anvil Tab ${tab}`, met, children, depth, tab };
}

export function expandItem(
  ctx: ExpandContext,
  rawName: string,
  need: number,
  path: readonly string[],
  depth: number,
  ref?: string,
): ItemNode {
  const data: ItemData | null = itemOf(ctx.kb, rawName, ref);
  const holdings = holdingsOf(ctx.state, rawName);
  const known = holdingsKnown(ctx.state);
  const held = known ? ctx.pool.take(rawName, need) : 0;
  const missing = Math.max(0, need - held);
  const base: ItemNode = {
    kind: 'item',
    rawName,
    name: data?.name ?? human(rawName),
    need,
    held,
    missing,
    holdings,
    via: 'leaf',
    children: [],
    supplies: [],
    depth,
    wiki: data?.wiki ?? null,
    ...(known ? {} : { unknown: true as const }),
  };
  if (!data) return { ...base, notCovered: true };
  if (data.forge) base.via = 'forge';
  else if (data.anvil) base.via = 'anvil';
  if (!data.recipe) return base;
  base.via = 'recipe';
  if (missing === 0 && known) return base;
  if (path.includes(rawName)) {
    ctx.diagnostics.push(`walkthrough/expand: recipe loop at ${rawName} (${[...path, rawName].join(' > ')})`);
    return { ...base, via: 'leaf', stoppedBecause: 'cycle' };
  }
  if (depth >= MAX_DEPTH) {
    ctx.diagnostics.push(`walkthrough/expand: depth ${MAX_DEPTH} reached at ${rawName}`);
    return { ...base, via: 'leaf', stoppedBecause: 'depth' };
  }
  const next = [...path, rawName];
  const crafts = known ? missing : need;
  const children: ReqNode[] = data.recipe.materials.map((m) =>
    expandItem(ctx, m.rawName, m.amount * crafts, next, depth + 1, m.ref),
  );
  children.push(tabGate(ctx, rawName, next, depth + 1));
  if (data.recipe.lvReqToCraft > 0) children.push(smithingGate(ctx, data.recipe.lvReqToCraft, depth + 1));
  return { ...base, children };
}

/** The quest's standing on one character (M8 FR-4): done, accepted, acceptable, locked or unknown. TODO(M8): M8's `questStanding`. */
export function questStanding(
  state: AccountState,
  index: number,
  q: Pick<QuestData, 'npc' | 'questKey' | 'questOrder'>,
  prevKey: string | null,
): 'done' | 'accepted' | 'acceptable' | 'locked' | 'unknown' {
  const c = state.characters.find((x) => x.index === index);
  if (!c?.quests || !isKnown(state, `characters[${index}].quests`)) return 'unknown';
  const row = c.quests[q.npc];
  const s = row?.[q.questKey];
  if (s === 1) return 'done';
  if (s === 0) return 'accepted';
  if (q.questOrder === 0 || prevKey === null) return 'acceptable';
  return row?.[prevKey] === 1 ? 'acceptable' : 'locked';
}

export interface ExpandedTarget {
  targetId: string;
  quest: QuestData | null;
  root: ReqNode;
}

/** FR-2: a quest's hand-in items (with their gates), or a craftable item's recipe, as a tree. */
export function expandTarget(ctx: ExpandContext, targetId: string): ExpandedTarget | null {
  const quest = questOf(ctx.kb, targetId);
  if (quest) {
    if (quest.requires.length === 0) return null;
    const world = ctx.state.account.currentWorld;
    const children: ReqNode[] = quest.requires.map((r) => expandItem(ctx, r.rawName, r.amount, [], 1, r.ref));
    if (quest.world !== null)
      children.push({
        kind: 'gate',
        gate: 'world',
        label: `World ${quest.world}`,
        met: world === null ? null : world >= quest.world,
        children: [],
        depth: 1,
      });
    return {
      targetId,
      quest,
      root: {
        kind: 'gate',
        gate: 'quest',
        label: `${human(quest.npc)}: ${quest.title}`,
        met: null,
        children,
        depth: 0,
      },
    };
  }
  const e = ctx.kb.entries[targetId];
  const raw = e?.type === 'acquisition' ? e.thing.rawName : null;
  if (!raw || !itemOf(ctx.kb, raw)) return null;
  return { targetId, quest: null, root: expandItem(ctx, raw, 1, [], 0) };
}

/** Depth-first, leaves of a tree with something missing. */
export function missingLeaves(node: ReqNode, out: ItemNode[] = []): ItemNode[] {
  if (node.kind === 'item' && node.missing > 0 && node.children.every((c) => c.kind === 'gate'))
    out.push(node);
  for (const c of node.children) missingLeaves(c, out);
  return out;
}

/** Every item node, depth first. */
export function itemNodes(node: ReqNode, out: ItemNode[] = []): ItemNode[] {
  if (node.kind === 'item') out.push(node);
  for (const c of node.children) itemNodes(c, out);
  return out;
}
