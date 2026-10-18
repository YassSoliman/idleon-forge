// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 FR-8 to FR-12: every Supply of a missing leaf with its effort per character. Every number is a
// Toolbox value or plain arithmetic on one (ADR 0005, TR-7):
//   - drop: kills = missing ÷ (effectiveChance × quantity × dropRate), hours = kills ÷ finalKillsPerHour
//     (the game multiplies the chance by the drop rate once, nested tables included: N.js
//     _customBlock_DropOdds @4454584, @4281847). The result is a mean ("about ... on average");
//   - anvil: hours = missing ÷ (anvilSpeed ÷ requiredAmount), per hammer (Toolbox getTimeTillCap's terms);
//   - Liquid Shop: the n-th buy today costs x1 × x2^n Water (game data, wiki Alchemy); the Water held
//     now buys as many as its running sum allows (R-Q6);
//   - skilling, Forge and town shops: no hours in Phase 1, only the gate (R-Q4).
// A drop Supply is offered to a character only on a map it can reach whose survivability is at least
// 95% or no worse than its current map's (FR-12, M5 TR-8's `leverage/survivable`).
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import { holdingsOf, totalOf } from './holdings';
import {
  human,
  type ItemData,
  itemOf,
  type MapRow,
  skillNodes,
  type WalkthroughKnowledge,
} from './knowledge';
import type { CharacterEval, ReqNode, SupplyEval } from './types';

/** M5 TR-8 `leverage/survivable`: the floor (%) a candidate map must reach, or match the current map. */
export const SURVIVABLE_FLOOR = 95;

export function survivable(candidate: number, baseline: number | null): boolean {
  return candidate >= SURVIVABLE_FLOOR || (baseline !== null && candidate >= baseline);
}

/** Toolbox skillsInfo key and AFK type for a skilling Supply. */
export const SKILL_KEY: Readonly<Record<string, string>> = {
  MINING: 'mining',
  CHOPPIN: 'chopping',
  FISHING: 'fishing',
  CATCHING: 'catching',
};

/** The Liquid Shop's running cost (R-Q6): how many buys the Water held covers today, and what `missing` costs. */
export function liquidShop(
  x1: number,
  x2: number,
  water: number,
  missing: number,
): { affordableNow: number; costForMissing: number | null; days: number | null } {
  let spent = 0;
  let n = 0;
  while (n < 10_000 && spent + x1 * x2 ** n <= water + 1e-9) {
    spent += x1 * x2 ** n;
    n++;
  }
  let cost = 0;
  for (let k = 0; k < missing; k++) cost += x1 * x2 ** k;
  const today = missing <= n;
  return {
    affordableNow: n,
    costForMissing: today ? cost : null,
    days: today ? 1 : n > 0 ? Math.ceil(missing / n) : null,
  };
}

export interface SupplyContext {
  state: AccountState;
  kb: WalkthroughKnowledge;
  graph: ReadonlyMap<number, MapRow>;
}

const currentSurvivability = (c: CharacterState): number | null => c.afk?.fighting?.survivability ?? null;

function dropSupplies(
  ctx: SupplyContext,
  leaf: Extract<ReqNode, { kind: 'item' }>,
  data: ItemData,
): SupplyEval[] {
  const { state, graph } = ctx;
  const rates = state.account.supplyRates ?? null;
  const reach = rates?.reachable ?? {};
  const world = state.account.currentWorld ?? 1;
  const out: SupplyEval[] = [];
  for (const d of data.drops) {
    const maps = d.maps.filter((m) => graph.get(m)?.listed && graph.get(m)?.afkType === 'FIGHTING');
    if (maps.length === 0) {
      out.push({
        acquisitionId: leaf.rawName,
        kind: 'active-play',
        afkable: false,
        where: { world: d.world, mapIndex: null, monster: d.monster, monsterName: d.monsterName },
        chance: d.chance,
        quantity: d.quantity,
        perCharacter: [],
        bound: 'none',
        wiki: d.wiki,
      });
      continue;
    }
    for (const mapIndex of maps) {
      const row = graph.get(mapIndex) as MapRow;
      const onMap = rates?.maps.find((m) => m.mapIndex === mapIndex)?.rates ?? null;
      const perCharacter: CharacterEval[] = state.characters.map((c) => {
        const already = c.afkType === 'FIGHTING' && c.mapIndex === mapIndex;
        const r = onMap?.find((x) => x.characterIndex === c.index);
        const reachable = already || (reach[c.index]?.includes(mapIndex) ?? false);
        const base: CharacterEval = {
          characterIndex: c.index,
          eligible: false,
          killsNeeded: null,
          etaSeconds: null,
          alreadyFarming: already,
        };
        if (row.world > world || !reachable) return { ...base, reason: 'unreachable' };
        if (!r || r.finalKillsPerHour <= 0 || r.dropRate <= 0) return { ...base, reason: 'no-rate' };
        const perKill = d.chance * d.quantity * r.dropRate;
        const kills = leaf.missing / perKill;
        const ok = already || survivable(r.survivability, currentSurvivability(c));
        return {
          ...base,
          eligible: ok,
          ...(ok ? {} : { reason: 'unsafe' as const }),
          killsNeeded: kills,
          etaSeconds: (kills / r.finalKillsPerHour) * 3600,
          killsPerHour: r.finalKillsPerHour,
          dropRate: r.dropRate,
          survivability: r.survivability,
        };
      });
      out.push({
        acquisitionId: leaf.rawName,
        kind: 'drop',
        afkable: row.world <= world && perCharacter.some((p) => p.eligible),
        where: {
          world: row.world,
          mapIndex,
          map: human(row.name),
          monster: d.monster,
          monsterName: d.monsterName,
        },
        chance: d.chance,
        quantity: d.quantity,
        perCharacter,
        bound: 'mean',
        wiki: d.wiki,
      });
    }
  }
  return out;
}

function skillSupplies(
  ctx: SupplyContext,
  leaf: Extract<ReqNode, { kind: 'item' }>,
  data: ItemData,
): SupplyEval[] {
  const { state, graph } = ctx;
  const reach = state.account.supplyRates?.reachable ?? {};
  const world = state.account.currentWorld ?? 1;
  const nodes: { skill: string; maps: number[]; target: string | null; minEfficiency: number | null }[] = [];
  for (const n of skillNodes(ctx.kb))
    if (n.item === leaf.rawName)
      nodes.push({ skill: n.skill, maps: n.maps, target: n.target, minEfficiency: n.minEfficiency });
  if (data.node)
    nodes.push({ skill: data.node.skill, maps: data.node.maps, target: leaf.rawName, minEfficiency: null });
  const out: SupplyEval[] = [];
  for (const n of nodes) {
    const key = SKILL_KEY[n.skill] ?? n.skill.toLowerCase();
    const mapIndex = n.maps.find((m) => (graph.get(m)?.world ?? 99) <= world) ?? n.maps[0] ?? null;
    if (mapIndex === null) continue;
    const row = graph.get(mapIndex);
    const perCharacter: CharacterEval[] = state.characters.map((c) => {
      const already =
        c.afkType === n.skill &&
        (n.target === null || c.targetMonster === n.target || n.maps.includes(c.mapIndex ?? -1));
      // Toolbox's door data has no door into the fishing ponds (as for Poopy Sewers, M5 TR-4), so a
      // skilling map counts as reachable once the character walks any map of that world.
      const inWorld = (reach[c.index] ?? []).some((m) => graph.get(m)?.world === row?.world);
      const reachable = already || n.maps.some((m) => reach[c.index]?.includes(m)) || inWorld;
      return {
        characterIndex: c.index,
        eligible: (row?.world ?? 99) <= world && reachable,
        ...((row?.world ?? 99) <= world && reachable ? {} : { reason: 'unreachable' as const }),
        killsNeeded: null,
        etaSeconds: null,
        alreadyFarming: already,
        skillLevel: c.skillLevels?.[key] ?? 0,
        skillEfficiency: c.skillEfficiency?.[key] ?? 0,
      };
    });
    out.push({
      acquisitionId: leaf.rawName,
      kind: 'skill-node',
      afkable: perCharacter.some((p) => p.eligible),
      where: { world: row?.world ?? null, mapIndex, map: row ? human(row.name) : undefined, skill: n.skill },
      ...(n.minEfficiency !== null ? { minEfficiency: n.minEfficiency } : {}),
      perCharacter,
      bound: 'none',
    });
  }
  return out;
}

/** FR-8: every Supply of a missing leaf. */
export function suppliesOf(ctx: SupplyContext, leaf: Extract<ReqNode, { kind: 'item' }>): SupplyEval[] {
  const data = itemOf(ctx.kb, leaf.rawName);
  if (!data) return [];
  const { state } = ctx;
  const out: SupplyEval[] = [];
  if (data.liquidShop && (state.account.currentWorld ?? 1) >= 2) {
    const water = state.account.afk?.liquids?.find((l) => l.index === 0)?.current ?? null;
    if (water !== null) {
      const l = liquidShop(data.liquidShop.x1, data.liquidShop.x2, water, leaf.missing);
      out.push({
        acquisitionId: leaf.rawName,
        kind: 'liquid-shop',
        afkable: false,
        where: { world: 2, mapIndex: null, town: 'Liquid Shop' },
        perCharacter: [],
        bound: 'none',
        liquid: { water, ...l },
      });
    }
  }
  for (const s of data.shops)
    out.push({
      acquisitionId: leaf.rawName,
      kind: 'shop',
      afkable: false,
      where: {
        world: s.mapIndex === null ? null : 1 + Math.floor(s.mapIndex / 50),
        mapIndex: s.mapIndex,
        town: s.town,
      },
      perCharacter: [],
      bound: 'none',
    });
  if (data.anvil) {
    const a = data.anvil;
    const perCharacter: CharacterEval[] = state.characters.map((c) => {
      const ok = (c.smithingLevel ?? 0) >= a.levelReq && (c.anvilSpeed ?? 0) > 0;
      return {
        characterIndex: c.index,
        eligible: ok,
        ...(ok ? {} : { reason: 'skill-gate' as const }),
        killsNeeded: null,
        etaSeconds: ok ? (leaf.missing / ((c.anvilSpeed as number) / a.requiredAmount)) * 3600 : null,
        alreadyFarming: false,
      };
    });
    out.push({
      acquisitionId: leaf.rawName,
      kind: 'anvil',
      afkable: false,
      where: { world: 1, mapIndex: null },
      perCharacter,
      bound: 'mean',
      anvil: { levelReq: a.levelReq, requiredAmount: a.requiredAmount },
    });
  }
  if (data.forge) {
    const ore = itemOf(ctx.kb, data.forge.ore, data.forge.ref);
    out.push({
      acquisitionId: leaf.rawName,
      kind: 'forge',
      afkable: false,
      where: { world: 1, mapIndex: null },
      perCharacter: [],
      bound: 'none',
      forge: {
        ore: data.forge.ore,
        oreName: ore?.name ?? human(data.forge.ore),
        oreHeld: totalOf(holdingsOf(state, data.forge.ore)),
      },
    });
  }
  // FR-8, FR-25: a printer sample of the item already printing counts as a Supply (never offered with no printer, US-4).
  const printer = state.account.printer;
  if (printer && printer.level > 0) {
    const perCharacter: CharacterEval[] = printer.characters
      .filter((p) => p.active.some((s) => s.rawName === leaf.rawName))
      .map((p) => {
        const perHour = p.active.filter((s) => s.rawName === leaf.rawName).reduce((n, s) => n + s.perHour, 0);
        return {
          characterIndex: p.characterIndex,
          eligible: true,
          killsNeeded: null,
          etaSeconds: perHour > 0 ? (leaf.missing / perHour) * 3600 : null,
          alreadyFarming: true,
        };
      });
    if (perCharacter.length)
      out.push({
        acquisitionId: leaf.rawName,
        kind: 'printer',
        afkable: false,
        where: { world: 3, mapIndex: null },
        perCharacter,
        bound: 'mean',
      });
  }
  out.push(...dropSupplies(ctx, leaf, data), ...skillSupplies(ctx, leaf, data));
  return out;
}

/** FR-10: hours when several characters are already on Supplies of the same item: missing ÷ Σ rates. */
export function alreadyFarmingSeconds(
  leaf: Extract<ReqNode, { kind: 'item' }>,
  supplies: SupplyEval[],
): number | null {
  let perHour = 0;
  for (const s of supplies)
    for (const p of s.perCharacter)
      if (p.alreadyFarming && p.etaSeconds !== null && p.etaSeconds > 0)
        perHour += leaf.missing / (p.etaSeconds / 3600);
  return perHour > 0 ? (leaf.missing / perHour) * 3600 : null;
}
