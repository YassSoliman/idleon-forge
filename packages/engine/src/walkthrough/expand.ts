// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 FR-2 to FR-5: a target (a quest, or a craftable item) expanded into its Requirement Tree from
// generated facts only (ADR 0007). Quantities multiply down the tree, but only for what is still
// missing: a recipe whose output is partly held needs inputs for the rest only. Expansion stops at a
// leaf, at depth 6, or when an item reappears on its own path (a cycle); both make a leaf with
// `stoppedBecause` and a diagnostic, never an error (FR-3). Gates are nodes that are met, unmet or
// unknown, never amounts (FR-4); an unmet anvil tab gate expands into the tab item's own subtree.
import { type AccountState, isKnown } from '@idleon-forge/account-state';
import { questStanding as m8QuestStanding, type QuestStanding } from '../collections/routes';
import type { WalkthroughRoot } from '../result';
import { type HoldingsPool, holdingsKnown, holdingsOf } from './holdings';
import {
  human,
  type ItemData,
  itemOf,
  type QuestData,
  questOf,
  recipeSmithingLevel,
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

/** A Smithing gate at the wiki's level; `null` level (no row in `anvil.fact.recipes`) is unknown. */
function smithingGate(ctx: ExpandContext, level: number | null, depth: number): GateNode {
  const best = maxSmithing(ctx.state);
  if (level === null)
    return { kind: 'gate', gate: 'smithing', label: 'Smithing level', met: null, children: [], depth };
  return {
    kind: 'gate',
    gate: 'smithing',
    label: `Smithing ${level} (wiki)`,
    met: best === null ? null : best >= level,
    children: [],
    depth,
    level,
  };
}

function tabGate(ctx: ExpandContext, raw: string, path: string[], depth: number, given?: number): GateNode {
  const tab = given ?? recipeTabs(ctx.kb)[raw];
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
  // M26 FR-C3: the wiki's Smithing level, never items.json lvReqToCraft (not the Smithing level).
  children.push(smithingGate(ctx, recipeSmithingLevel(ctx.kb, rawName), depth + 1));
  return { ...base, children };
}

/**
 * M18 X3: an inline root (a gear piece from M18's ladder) as a tree: the copies the receivers wear count
 * as held (M18 FR-15, an exception to FR-6), then the pool; what is missing expands into its materials
 * (generated Acquisitions), the earlier pieces it consumes (nested roots) and its gates: the recipe
 * unlock, the anvil tab and the Smithing level.
 */
export function expandRoot(
  ctx: ExpandContext,
  root: WalkthroughRoot,
  need: number,
  path: readonly string[],
  depth: number,
): ItemNode {
  const holdings = holdingsOf(ctx.state, root.rawName);
  const known = holdingsKnown(ctx.state);
  const worn = Math.min(need, root.worn);
  const held = worn + (known ? ctx.pool.take(root.rawName, need - worn) : 0);
  const missing = Math.max(0, need - held);
  const craftable = root.materials.length > 0 || root.pieces.length > 0;
  const base: ItemNode = {
    kind: 'item',
    rawName: root.rawName,
    name: root.name,
    need,
    held,
    missing,
    holdings,
    via: craftable ? 'recipe' : 'leaf',
    children: [],
    supplies: [],
    depth,
    wiki: null,
    ...(worn > 0 ? { worn } : {}),
    ...(known ? {} : { unknown: true as const }),
  };
  if (!craftable) return { ...base, notCovered: true };
  if ((missing === 0 && known) || depth >= MAX_DEPTH || path.includes(root.rawName)) return base;
  const next = [...path, root.rawName];
  const crafts = known ? missing : need;
  const children: ReqNode[] = [
    ...root.materials.map((m) => expandItem(ctx, m.rawName, m.amount * crafts, next, depth + 1, m.ref)),
    ...root.pieces.map((p) => expandRoot(ctx, p.root, p.amount * crafts, next, depth + 1)),
  ];
  if (root.gate)
    children.push({
      kind: 'gate',
      gate: 'recipe',
      label: root.gate.label,
      met: root.gate.met,
      children: [],
      depth: depth + 1,
    });
  if (root.tab !== null) children.push(tabGate(ctx, root.rawName, next, depth + 1, root.tab));
  if (root.smithingLv) children.push(smithingGate(ctx, root.smithingLv, depth + 1));
  return { ...base, children };
}

/** The quest's standing on one character: M8's `questStanding` (M8 FR-4), unknown when the field is. */
export function questStanding(
  state: AccountState,
  index: number,
  q: Pick<QuestData, 'npc' | 'questKey' | 'questOrder'>,
  prevKey: string | null,
): QuestStanding {
  const c = state.characters.find((x) => x.index === index);
  if (!c?.quests || !isKnown(state, `characters[${index}].quests`)) return 'unknown';
  return m8QuestStanding(c, q.npc, q.questKey, q.questOrder === 0 ? null : prevKey);
}

export interface ExpandedTarget {
  targetId: string;
  quest: QuestData | null;
  root: ReqNode;
}

/** FR-2: a quest's hand-in items (with their gates), or a craftable item's recipe, as a tree. */
export function expandTarget(
  ctx: ExpandContext,
  targetId: string,
  root?: WalkthroughRoot,
): ExpandedTarget | null {
  if (root) return { targetId, quest: null, root: expandRoot(ctx, root, root.need, [], 0) };
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
