// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Stamps (M7 TR-6, M8 TR-3, TR-8): one generated Acquisition per stamp in stamps.json,
// `stamps.acquisition.<slug of rawName>` (StampA1 -> stamp-a1), shared by M7 and M8.
//
// - values: the raise facts M7 reads: capStep (reqItemMultiplicationLevel), the raise material and the
//   cost bases, all from value fields.
// - data.routes: every way to get the stamp (M8 TR-8):
//   shop    a town shop stocks it; world from the town's map (mapNames) when one exists, else null (the
//           authored `stamps.fact.shop-towns` fills it); price null: the pinned shop entries carry no
//           buy price, and items.json `sellPrice` is not the buy price (rule 5);
//   quest   a quest reward; world from the NPC's npcPlacements map (rule 2), the hand-in items with
//           their one-level craft recipe (rule 3), a Custom quest's measured thresholds;
//   drop    a monster or resource drop (effectiveChance); world from the maps it spawns on.
// - data.obtainable: false for Toolbox's own unobtainable list (by display name). The wiki's
//   corrections are the authored overlay `stamps.fact.unobtainable`, applied on top (rule 4).
// Generation fails if a quest rewards a Stamp* rawName that stamps.json doesn't have (rule 6).
import type { GeneratedEntryT } from '../src/schema';
import { craftsByRawName, customOf, type Json, questSteps, requirement } from './quest-steps';
import { defineGenerator, generatedBy, generatedSource, slugify } from './types';
import { humanName, mapOfName, mapsOfMonsters, npcWorld, worldOfMap } from './world-maps';

interface Stamp {
  displayName: string;
  rawName: string;
  reqItemMultiplicationLevel: number;
  baseMatCost: number;
  baseCoinCost: number;
  powCoinBase: number;
  powMatBase: number;
  itemReq?: { name: string; rawName: string }[];
}
interface Drop {
  monsterRawName: string;
  rawName: string;
  effectiveChance?: number;
  chance?: number;
  questLink?: string;
}

const STAMPS_FILE = 'parsers/world-1/stamps.ts';

const generator = defineGenerator({
  name: 'stamps',
  system: 'stamps',
  inputs: [
    'website-data/stamps.json',
    'website-data/shared-data.json#shops',
    'website-data/shared-data.json#npcPlacements',
    'website-data/shared-data.json#mapNames',
    'website-data/shared-data.json#mapEnemiesArray',
    'website-data/quests.json',
    'website-data/monsterDrops.json',
    'website-data/crafts.json',
    'website-data/items.json',
    `${STAMPS_FILE}#unobtainableStamps`,
  ],
  constants: { unobtainableStamps: STAMPS_FILE },
  run({ data, constants, pin }) {
    const tabs = data.stamps as Record<string, Record<string, Stamp>>;
    const shops = data.shops as Record<string, { name: string; items: { rawName: string }[] }>;
    const placements = data.npcPlacements as Record<string, number[]>;
    const mapNames = data.mapNames as Record<string, string>;
    const monsterMaps = mapsOfMonsters(data.mapEnemiesArray as string[], mapNames);
    const quests = data.quests as Record<string, Record<string, unknown>>;
    const drops = data.monsterDrops as Record<string, unknown[]>;
    const crafts = craftsByRawName(data.crafts as Record<string, { rawName: string }>);
    const items = data.items as Record<string, { lvReqToCraft?: number }>;
    const unobtainable = (constants.unobtainableStamps ?? {}) as Record<string, unknown>;
    if (!tabs || Object.keys(tabs).length === 0) throw new Error('stamps: stamps.json is empty');

    const catalogue = new Map<string, { stamp: Stamp; tab: string }>();
    for (const [tab, list] of Object.entries(tabs))
      for (const stamp of Object.values(list))
        if (stamp?.rawName) catalogue.set(stamp.rawName, { stamp, tab });

    const routes = new Map<string, Json[]>();
    const rates = new Map<string, Record<string, number>>();
    const push = (raw: string, r: Json) => routes.set(raw, [...(routes.get(raw) ?? []), r]);

    for (const [index, shop] of Object.entries(shops).sort(([a], [b]) => Number(a) - Number(b))) {
      const map = mapOfName(mapNames, shop.name);
      for (const it of shop.items ?? [])
        if (catalogue.has(it.rawName))
          push(it.rawName, {
            kind: 'shop',
            shop: Number(index),
            town: shop.name,
            map,
            world: map === null ? null : worldOfMap(map),
            price: null,
          });
    }
    for (const { npc, key, order, step } of questSteps(quests)) {
      const stampRewards = (step.rewards ?? []).filter((r) => /^Stamp/.test(r.rawName ?? ''));
      for (const r of stampRewards) {
        if (!catalogue.has(r.rawName))
          throw new Error(
            `stamps: quest ${step.QuestName ?? npc + key} rewards ${r.rawName}, which stamps.json lacks`,
          );
        const where = npcWorld(placements, npc);
        push(r.rawName, {
          kind: 'quest',
          npc,
          questKey: key,
          questOrder: order,
          questName: step.QuestName ?? `${npc}${key}`,
          title: humanName(step.Name ?? ''),
          questType: step.Type ?? null,
          world: where?.world ?? null,
          map: where?.map ?? null,
          consumes: step.ConsumeItems === true,
          inventorySpacesNeeded: step.InventorySpacesNeeded ?? 0,
          requires: (step.itemReq ?? []).map((i) => requirement(i, crafts, items)),
          custom: customOf(step),
          alsoRewards: (step.rewards ?? [])
            .filter((x) => x.rawName !== r.rawName)
            .map((x) => ({ rawName: x.rawName, amount: x.amount ?? 1 })),
        });
      }
    }
    for (const rows of Object.values(drops))
      for (const d of (rows ?? []) as Drop[]) {
        if (!d || typeof d.rawName !== 'string' || !catalogue.has(d.rawName)) continue;
        const chance = d.effectiveChance ?? d.chance ?? 0;
        const maps = monsterMaps.get(d.monsterRawName) ?? [];
        push(d.rawName, {
          kind: 'drop',
          monster: d.monsterRawName,
          chance,
          maps,
          world: maps.length ? Math.min(...maps.map(worldOfMap)) : null,
          questLink: d.questLink && d.questLink !== 'N/A' ? d.questLink : null,
        });
        const r = rates.get(d.rawName) ?? {};
        r[d.monsterRawName] = Math.max(r[d.monsterRawName] ?? 0, chance);
        rates.set(d.rawName, r);
      }

    const source = generatedSource(pin, 'website-data/stamps.json', 'IdleOn Toolbox game data: stamps');
    const questSource = generatedSource(pin, 'website-data/quests.json', 'IdleOn Toolbox game data: quests');
    const by = generatedBy(generator, pin);
    const entries: GeneratedEntryT[] = [...catalogue.values()].map(({ stamp: s, tab }) => {
      const display = humanName(s.displayName);
      const r = routes.get(s.rawName) ?? [];
      const material = s.itemReq?.[0]?.rawName ?? null;
      return {
        id: `stamps.acquisition.${slugify(s.rawName)}`,
        system: 'stamps',
        type: 'acquisition',
        origin: 'generated',
        title: `Stamp: ${display}`.slice(0, 80),
        text: `${display} (${tab} tab)`.slice(0, 240),
        why: 'A collected stamp gives its bonus; raising it costs coins and its material.',
        values: {
          name: s.displayName,
          tab,
          capStep: s.reqItemMultiplicationLevel,
          baseCoinCost: s.baseCoinCost,
          baseMatCost: s.baseMatCost,
          powCoinBase: s.powCoinBase,
          powMatBase: s.powMatBase,
          ...(material ? { material } : {}),
        },
        sources: r.some((x) => (x as { kind?: string }).kind === 'quest') ? [source, questSource] : [source],
        appliesTo: { stages: 'all' },
        confidence: 'H',
        status: 'active',
        thing: { kind: 'stamp', rawName: s.rawName },
        ...(rates.has(s.rawName) ? { rates: rates.get(s.rawName) } : {}),
        data: {
          obtainable: !Object.hasOwn(unobtainable, s.displayName),
          itemReq: (s.itemReq ?? []).map((i) => ({ rawName: i.rawName, name: humanName(i.name) })),
          routes: r,
        },
        generatedBy: by,
      };
    });
    return { entries };
  },
});

export default generator;
