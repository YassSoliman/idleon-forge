// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 F3 (docs/specs/M16-star-signs.md FR-15 to FR-19): the Star Chart unlock order in four legs, the
// signs to buy in one trip, slots, and the signs each character should wear for its activity (D-5 to D-8).
// Pure arithmetic on the chart facts and the save (ADR 0005).
import type { CharacterState } from '@idleon-forge/account-state';
import { type StarContext, unlockedNames } from './context';
import { type ChartNode, chartNodes, ENTRY, listOf } from './knowledge';

export const LEGS = ['chart-leg-1', 'chart-leg-2', 'chart-leg-3', 'chart-leg-4'] as const;
export const FIT_ACTIVITIES = ['FIGHTING', 'MINING', 'CHOPPIN', 'FISHING', 'CATCHING'] as const;

export interface ChartState {
  nodes: Map<string, ChartNode>;
  unlocked: Set<string>;
  /** Unlocked nodes among the first `countedNodes` (node 0 always counts, F-c). */
  count: number;
  slots: number;
  hydronOpen: boolean;
}

export function chartState(ctx: StarContext, extra: readonly string[] = []): ChartState {
  const nodes = new Map(chartNodes(ctx.kb).map((n) => [n.sign, n]));
  const unlocked = new Set([...unlockedNames(ctx), ...extra]);
  const g = ctx.rules.chartGates;
  let count = 0;
  for (const n of nodes.values())
    if (n.node < g.countedNodes && (n.node === 0 || unlocked.has(n.sign))) count++;
  let slots = 1;
  for (const c of ctx.rules.cosmos) if (unlocked.has(c.sign)) slots = Math.max(slots, c.slots);
  return { nodes, unlocked, count, slots, hydronOpen: count >= g.hydron };
}

/** The four legs of `chart-order` (FR-15), leg 2 skipped once the Hydron chart is open. */
export function legs(ctx: StarContext, chart: ChartState): { leg: number; items: string[] }[] {
  return LEGS.map((key, i) => ({ leg: i + 1, items: listOf(ctx.kb, ENTRY.signs, key) })).filter(
    (l) => !(l.leg === 2 && chart.hydronOpen),
  );
}

export interface LegStatus {
  leg: number;
  remaining: number;
  /** Items not unlocked yet, in order. */
  left: string[];
}

/** The first leg with a sign still locked, and what it still costs. null when every leg is done. */
export function currentLeg(ctx: StarContext, chart: ChartState): LegStatus | null {
  for (const l of legs(ctx, chart)) {
    const left = l.items.filter((s) => !chart.unlocked.has(s) && chart.nodes.has(s));
    if (left.length)
      return { leg: l.leg, left, remaining: left.reduce((n, s) => n + (chart.nodes.get(s)?.cost ?? 0), 0) };
  }
  return null;
}

/**
 * The signs `points` buy in chart order, one trip (D-14): each in turn while its parent is unlocked (or
 * bought earlier in the trip), its chart is open, and the points still cover it. Stops at the first it
 * can't buy, so the order is never broken.
 */
export function buyable(ctx: StarContext, points: number): { signs: string[]; cost: number } {
  const bought: string[] = [];
  let left = points;
  let spent = 0;
  for (;;) {
    const chart = chartState(ctx, bought);
    const order = legs(ctx, chart).flatMap((l) => l.items);
    const next = order.find((s) => !chart.unlocked.has(s) && chart.nodes.has(s));
    if (!next) break;
    const node = chart.nodes.get(next) as ChartNode;
    const parentOk = node.parent === null || chart.unlocked.has(node.parent);
    const chartOk = node.chart === 'chronus' || (node.chart === 'hydron' && chart.hydronOpen);
    if (!parentOk || !chartOk || node.cost > left) break;
    bought.push(next);
    left -= node.cost;
    spent += node.cost;
  }
  return { signs: bought, cost: spent };
}

/** FR-16, D-8: the activity whose fit list a character uses; null when it has none. */
export function activityOf(ctx: StarContext, c: CharacterState): string | null {
  const own = c.afkType;
  if (own && own !== 'Nothing') return (FIT_ACTIVITIES as readonly string[]).includes(own) ? own : null;
  const role = (ctx.meta?.roles[c.index] ?? []).find((r) => r.active && r.afkType)?.afkType ?? null;
  if (role && (FIT_ACTIVITIES as readonly string[]).includes(role)) return role;
  return null;
}

/** The raw activity name for "no sign advice for <activity> yet". */
export const rawActivity = (c: CharacterState) => c.afkType ?? 'Nothing';

/** FR-16: the first `slots` unlocked, non-infinite signs of the activity's fit list. */
export function fitSet(
  ctx: StarContext,
  activity: string,
  unlocked: ReadonlySet<string>,
  slots: number,
): string[] {
  // FR-19: Infinite Stars (Rift, W4+) count as worn by everyone; F3 does not run on a `beyond` account,
  // so on a covered account none is infinite.
  const infinite = new Set<string>(
    ctx.signs.infiniteCount > 0 ? unlockedNames(ctx).slice(0, ctx.signs.infiniteCount) : [],
  );
  const list = [...listOf(ctx.kb, ENTRY.signs, `fit-${activity.toLowerCase()}`), ...ctx.rules.starters];
  const out: string[] = [];
  for (const s of list) {
    if (out.length >= slots) break;
    if (unlocked.has(s) && !infinite.has(s) && !out.includes(s)) out.push(s);
  }
  return out;
}

/** The leg-1 signs plus what is unlocked: "after Chronus Cosmos" (FR-18). */
export function afterCosmos(
  ctx: StarContext,
  chart: ChartState,
  activity: string,
): { set: string[]; once: string | null } {
  const leg1 = listOf(ctx.kb, ENTRY.signs, LEGS[0]);
  const withLeg1 = new Set([...chart.unlocked, ...leg1]);
  const set = fitSet(ctx, activity, withLeg1, 2);
  const leg2 = new Set(listOf(ctx.kb, ENTRY.signs, LEGS[1]));
  const list = listOf(ctx.kb, ENTRY.signs, `fit-${activity.toLowerCase()}`);
  const firstLeg2 = list.find((s) => leg2.has(s) && !withLeg1.has(s));
  const rankOf = (s: string) => list.indexOf(s);
  const worst = Math.max(...set.map((s) => (rankOf(s) < 0 ? Number.POSITIVE_INFINITY : rankOf(s))));
  const once = firstLeg2 && rankOf(firstLeg2) < worst ? firstLeg2 : null;
  return { set, once };
}

export const isStarter = (ctx: StarContext, s: string) => ctx.rules.starters.includes(s);
