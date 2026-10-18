// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Items (M14 TR-4, ADR 0007): one generated Acquisition per item a World 1–3 quest needs, closed over
// its anvil recipe and, for a Forge bar, its ore: `items.acquisition.<slug of rawName>`. Each carries,
// as machine data, every way Toolbox's game data knows to get the item:
//   - recipe: the anvil recipe (crafts.json: inputs and amounts; items.json lvReqToCraft);
//   - anvil: anvil production (shared-data anvilProducts: requiredAmount, levelReq);
//   - forge: a bar's ore (a bOre item with the bar's ID, the Forge's own pairing);
//   - shops: the town shops that sell it (shared-data shops);
//   - liquidShop: its Liquid Shop row (shared-data liquidsShop: base cost x1, growth x2);
//   - node: a Mining, Choppin or Catching node whose resource is the item (monsters.json AFKtype);
//   - drops: every monster drop row (monsterDrops.json effectiveChance and quantity, whether it sits
//     behind a drop table) with the maps the monster spawns on (mapEnemiesArray), and `printable` on
//     the row a 3D Printer sample there gives (FR-26: the first of the monster's first four rows that
//     is not coins, not a card and not quest-linked).
// Fishing pools, which hold fish by depth and bait, are authored (skills.fact.nodes): Toolbox has no
// table for them. Only what a shipped entry references ships (kb compile), so the bundle carries the
// items of opted-in Walkthrough targets and the gate quests, not the whole catalogue.
//
// Player Sources (#74, TR-9): the item's IdleOn Wiki page, when the cached MediaWiki check
// (generators/_wiki-pages.json, refreshed by kb-tools' wiki-pages script) says it exists.
import { readFileSync } from 'node:fs';
import type { GeneratedEntryT, SourceT } from '../src/schema';
import { craftsByRawName, questSteps } from './quest-steps';
import {
  defineGenerator,
  generatedBy,
  generatedSource,
  type Pin,
  PLACEHOLDER_MAP_NAMES,
  slugify,
} from './types';
import { humanName, mapOfName, npcWorld, worldOfMap } from './world-maps';

const MAX_WORLD = 3;
/** The newest major patch date (majors.yaml): a wiki page edited on or after it is tier 2, else tier 4. */
const CURRENT_MAJOR = '2026-08-26';

export const itemAcquisitionId = (rawName: string) => `items.acquisition.${slugify(rawName)}`;

interface Item {
  displayName?: string;
  typeGen?: string;
  ID?: number;
  lvReqToCraft?: number;
}
interface DropRow {
  rawName: string;
  quantity?: number;
  chance?: number;
  effectiveChance?: number;
  questLink?: string;
  typeGen?: string;
  dropTablePath?: string[];
}

function wikiPages(): Record<string, string> {
  try {
    const raw = JSON.parse(readFileSync(new URL('./_wiki-pages.json', import.meta.url), 'utf8')) as {
      pages?: Record<string, string>;
    };
    return raw.pages ?? {};
  } catch {
    return {};
  }
}

/** The wiki Source of a page, when the cached check found it (TR-9). */
export function wikiSource(pages: Record<string, string>, title: string, pin: Pin): SourceT | null {
  const edited = pages[title];
  if (!edited) return null;
  return {
    url: `https://idleon.wiki/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    title: `IdleOn Wiki: ${title}`.slice(0, 120),
    tier: edited >= CURRENT_MAJOR ? 2 : 4,
    claimDate: edited,
    verified: pin.commitDate,
    gameVersion: pin.gameVersion,
  };
}

/** FR-26: the item a 3D Printer sample of this monster gives, or null. */
export function sampleItem(rows: readonly DropRow[]): string | null {
  for (const r of rows.slice(0, 4)) {
    if (r.rawName === 'COIN' || r.typeGen === 'dCard' || r.rawName.startsWith('Cards')) continue;
    if (r.questLink && r.questLink !== 'N/A') continue;
    if (r.dropTablePath && r.dropTablePath.length > 0) continue;
    return r.rawName;
  }
  return null;
}

const generator = defineGenerator({
  name: 'items',
  system: 'items',
  inputs: [
    'website-data/crafts.json',
    'website-data/items.json',
    'website-data/quests.json',
    'website-data/monsterDrops.json',
    'website-data/monsters.json',
    'website-data/shared-data.json#npcPlacements',
    'website-data/shared-data.json#anvilProducts',
    'website-data/shared-data.json#shops',
    'website-data/shared-data.json#liquidsShop',
    'website-data/shared-data.json#mapNames',
    'website-data/shared-data.json#mapEnemiesArray',
  ],
  run({ data, pin }) {
    const items = data.items as Record<string, Item>;
    const crafts = craftsByRawName(data.crafts as Record<string, { rawName: string }>);
    const drops = data.monsterDrops as Record<string, DropRow[]>;
    const monsters = data.monsters as Record<string, { Name?: string; AFKtype?: string; mapIndex?: number }>;
    const mapNames = data.mapNames as Record<string, string>;
    const enemies = data.mapEnemiesArray as string[];
    const anvil = data.anvilProducts as Record<
      string,
      { rawName: string; requiredAmount: number; levelReq: number }
    >;
    const shops = data.shops as Record<string, { name: string; items: { rawName: string }[] }>;
    const liquids = data.liquidsShop as { name: string; x1: number; x2: number; index: number }[];
    const placements = data.npcPlacements as Record<string, number[]>;
    const pages = wikiPages();

    // Maps each monster spawns on, real maps only.
    const mapsOf = new Map<string, number[]>();
    enemies.forEach((m, i) => {
      const name = mapNames[String(i)];
      if (!m || m === 'Nothing' || name === undefined || PLACEHOLDER_MAP_NAMES.has(name)) return;
      mapsOf.set(m, [...(mapsOf.get(m) ?? []), i]);
    });
    // Drop rows by item rawName.
    const dropsOf = new Map<string, { monster: string; row: DropRow; printable: boolean }[]>();
    for (const monster of Object.keys(drops).sort()) {
      const rows = drops[monster] ?? [];
      const sample = sampleItem(rows);
      for (const row of rows) {
        if (row.rawName === 'COIN') continue;
        const list = dropsOf.get(row.rawName) ?? [];
        list.push({ monster, row, printable: sample === row.rawName });
        dropsOf.set(row.rawName, list);
      }
    }
    const barOre = new Map<number, string>();
    for (const [raw, it] of Object.entries(items))
      if (it.typeGen === 'bOre' && typeof it.ID === 'number') barOre.set(it.ID, raw);

    // The items to generate: every W1–W3 quest requirement, closed over recipes and Forge ores.
    const want = new Set<string>();
    const queue: string[] = [];
    const add = (raw: string) => {
      if (!items[raw] || want.has(raw)) return;
      want.add(raw);
      queue.push(raw);
    };
    for (const s of questSteps(data.quests as Record<string, Record<string, unknown>>)) {
      const where = npcWorld(placements, s.npc);
      if (!where || where.world > MAX_WORLD) continue;
      for (const r of s.step.itemReq ?? []) add(r.rawName);
    }
    // The anvil tab items (Anvil Tab 2 ... 7): an unmet tab gate expands into the tab item's recipe (FR-4).
    for (const raw of Object.keys(items)) if (/^EquipmentSmithingTabs\d+$/.test(raw)) add(raw);
    const forgeOre = (raw: string) => {
      const it = items[raw];
      return it?.typeGen === 'bBar' && typeof it.ID === 'number' ? (barOre.get(it.ID) ?? null) : null;
    };
    while (queue.length) {
      const raw = queue.shift() as string;
      for (const m of crafts.get(raw)?.materials ?? []) add(m.rawName);
      const ore = forgeOre(raw);
      if (ore) add(ore);
    }

    const by = generatedBy(generator, pin);
    const src = {
      crafts: generatedSource(pin, 'website-data/crafts.json', 'IdleOn Toolbox game data: anvil recipes'),
      drops: generatedSource(
        pin,
        'website-data/monsterDrops.json',
        'IdleOn Toolbox game data: monster drops',
      ),
      items: generatedSource(pin, 'website-data/items.json', 'IdleOn Toolbox game data: items'),
    };
    const anvilOf = new Map(Object.entries(anvil).map(([i, p]) => [p.rawName, { index: Number(i), ...p }]));

    const entries: GeneratedEntryT[] = [];
    for (const raw of [...want].sort()) {
      const it = items[raw] as Item;
      const name = humanName(it.displayName ?? raw);
      const recipe = crafts.get(raw);
      const materials = (recipe?.materials ?? []).map((m) => ({
        rawName: m.rawName,
        amount: m.itemQuantity ?? 1,
        ref: itemAcquisitionId(m.rawName),
      }));
      const ore = forgeOre(raw);
      const product = anvilOf.get(raw);
      const liquid = liquids.find((l) => humanName(l.name).toLowerCase() === name.toLowerCase());
      const monster = monsters[raw];
      const node =
        monster && ['MINING', 'CHOPPIN', 'CATCHING'].includes(monster.AFKtype ?? '')
          ? { skill: monster.AFKtype as string, maps: mapsOf.get(raw) ?? [] }
          : null;
      // One row per monster: the best of its rows (a monster can hold the item in several tables).
      const best = new Map<string, { monster: string; row: DropRow; printable: boolean }>();
      for (const d of dropsOf.get(raw) ?? []) {
        const prev = best.get(d.monster);
        const c = (x: DropRow) => (x.effectiveChance ?? x.chance ?? 0) * (x.quantity ?? 1);
        if (!prev || c(d.row) > c(prev.row) || (d.printable && !prev.printable)) best.set(d.monster, d);
      }
      const dropRows = [...best.values()].map(({ monster: m, row, printable }) => {
        const maps = mapsOf.get(m) ?? [];
        return {
          monster: m,
          monsterName: humanName(monsters[m]?.Name ?? m),
          afkType: monsters[m]?.AFKtype ?? null,
          maps,
          world: maps.length ? worldOfMap(maps[0] as number) : null,
          chance: row.effectiveChance ?? row.chance ?? 0,
          quantity: row.quantity ?? 1,
          table: (row.dropTablePath?.length ?? 0) > 0,
          printable,
          wiki: wikiSource(pages, humanName(monsters[m]?.Name ?? m), pin)?.url ?? null,
        };
      });
      const shopRows = Object.values(shops)
        .filter((s) => s.items.some((x) => x.rawName === raw))
        .map((s) => ({ town: humanName(s.name), mapIndex: mapOfName(mapNames, s.name) }));
      const methods: NonNullable<Extract<GeneratedEntryT, { type: 'acquisition' }>['methods']> = [];
      if (materials.length)
        methods.push({
          how: 'Craft it at the anvil',
          kind: 'recipe',
          requires: materials.map((m) => ({ ref: m.ref, amount: m.amount })),
        });
      if (ore)
        methods.push({
          how: 'Smelt its ore in the Forge',
          kind: 'forge',
          requires: [{ ref: itemAcquisitionId(ore), amount: 1 }],
        });
      if (product) methods.push({ how: 'Produce it on the anvil', kind: 'anvil', requires: [] });
      if (liquid) methods.push({ how: 'Buy it at the Liquid Shop', kind: 'liquid-shop', requires: [] });
      if (shopRows.length) methods.push({ how: 'Buy it in a town shop', kind: 'shop', requires: [] });
      if (dropRows.length) methods.push({ how: 'Monsters drop it', kind: 'drop', requires: [] });
      if (node) methods.push({ how: 'Gather it from a skilling node', kind: 'skill-node', requires: [] });
      const wiki = wikiSource(pages, name, pin);
      const sources: SourceT[] = [materials.length ? src.crafts : dropRows.length ? src.drops : src.items];
      if (wiki) sources.push(wiki);
      entries.push({
        id: itemAcquisitionId(raw),
        system: 'items',
        type: 'acquisition',
        origin: 'generated',
        title: `Get ${name}`.slice(0, 80),
        text: `Ways to get ${name}`.slice(0, 240),
        why: 'Every way the game data knows to get this item.',
        values: { rawName: raw, name },
        sources,
        appliesTo: { stages: 'all' },
        confidence: 'H',
        status: 'active',
        thing: { kind: 'item', rawName: raw.slice(0, 64) },
        ...(methods.length ? { methods } : {}),
        data: {
          rawName: raw,
          name,
          typeGen: it.typeGen ?? null,
          wiki: wiki?.url ?? null,
          recipe: materials.length ? { lvReqToCraft: it.lvReqToCraft ?? 0, materials } : null,
          forge: ore ? { ore, ref: itemAcquisitionId(ore) } : null,
          anvil: product
            ? { index: product.index, requiredAmount: product.requiredAmount, levelReq: product.levelReq }
            : null,
          liquidShop: liquid ? { index: liquid.index, x1: liquid.x1, x2: liquid.x2 } : null,
          shops: shopRows,
          node,
          drops: dropRows,
        },
        generatedBy: by,
      });
    }

    return { entries };
  },
});

export default generator;
