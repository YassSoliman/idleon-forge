// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 Gear & Tools (docs/specs/M18-gear-tools.md TR-3, ADR 0007): two generated fact tables.
//  - `gear.fact.ladder`: every W1–W3 piece the Gear Plan or a Smithy set can name: the nine W1–W3
//    equipment sets' armour, gathering tools and weapons (shared-data equipmentSets), the class weapon
//    ladders, the rings and pendants the Gear Plan names, closed over the gear pieces each recipe
//    consumes (F-e: Gold armour consumes the Copper piece). Per piece: slot family, set, the stats
//    items.json gives (lvReqToEquip, Defence, Weapon Power, STR, AGI, WIS, LUK, the % lines, upgrade
//    slots), its anvil recipe (crafts.json, one level: materials and the gear piece it consumes) and,
//    when it is a Task Board unlock, its (world, row) in taskUnlocks.json.
// (`armor-smithy.fact.sets`, the Smithy's sets, is armor-smithy.gen.ts.)
// A recipe's anvil tab, number and Smithing level are not in Toolbox's data: they are the authored
// `gear.fact.recipes` (systems/gear.facts.yaml, from the wiki's Anvil Tab pages).
import type { FactTableT } from '../src/schema';
import { craftsByRawName } from './quest-steps';
import { defineGenerator, generatedBy, generatedSource, slugify } from './types';

/** items.json `Type` -> M18 slot family (F-a). */
export const SLOT_OF_TYPE: Readonly<Record<string, string>> = {
  HELMET: 'helmet',
  SHIRT: 'shirt',
  PANTS: 'pants',
  SHOES: 'shoes',
  PENDANT: 'pendant',
  RING: 'ring',
  SPEAR: 'weapon',
  BOW: 'weapon',
  WAND: 'weapon',
  FISTICUFF: 'weapon',
  PICKAXE: 'pickaxe',
  HATCHET: 'hatchet',
  FISHING_ROD: 'rod',
  BUG_CATCHING_NET: 'net',
};

/** The W1–W3 sets (the Smithy's first nine). */
export const W13_SETS = [
  'COPPER_SET',
  'IRON_SET',
  'AMAROK_SET',
  'GOLD_SET',
  'PLATINUM_SET',
  'EFAUNT_SET',
  'DEMENTIA_SET',
  'VOID_SET',
  'CHIZOAR_SET',
] as const;

/**
 * Pieces the Gear Plan names outside a set: the crafted weapon ladder of each class line (Wooden Spear …
 * Deuscythe, Wooden Bow … Blackhole Bow, Gnarled Wand … Grey Gatsby, Boxing Gloves … Eclectic Ordeal),
 * the rings (Copper Band, Steel Band, Serrated Rex Ring) and the pendants (Slimy Necklace, Chaotic Amarok
 * Pendant). Ids, not judgment: the ordering and the Stages are the authored `gear.fact.plan`.
 */
export const PLAN_EXTRAS = [
  'TestObj1',
  'TestObj7',
  'TestObj3',
  'EquipmentSword1',
  'EquipmentSword2',
  'EquipmentSword3',
  'EquipmentBows1',
  'EquipmentBows3',
  'EquipmentBows5',
  'EquipmentBows6',
  'EquipmentBows7',
  'EquipmentBows8',
  'EquipmentWands1',
  'EquipmentWands2',
  'EquipmentWands5',
  'EquipmentWands6',
  'EquipmentWands3',
  'EquipmentWands7',
  'EquipmentPunching1',
  'EquipmentPunching2',
  'EquipmentPunching3',
  'EquipmentPunching4',
  'EquipmentPunching5',
  'EquipmentRings2',
  'EquipmentRings3',
  'EquipmentRings26',
  'EquipmentPendant32',
  'EquipmentPendant17',
] as const;

interface Item {
  displayName?: string;
  Type?: string;
  Class?: string;
  lvReqToEquip?: number;
  Defence?: number;
  Weapon_Power?: number;
  STR?: number;
  AGI?: number;
  WIS?: number;
  LUK?: number;
  UQ1txt?: string | number;
  UQ1val?: number;
  UQ2txt?: string | number;
  UQ2val?: number;
  Upgrade_Slots_Left?: number;
}
export interface EquipmentSet {
  setName: string;
  armors: string[];
  tools: string[];
  weapons: string[];
  requiredTools: number;
  requiredWeapon: number;
  bonusValue: number;
  description: string;
}

const human = (s: string) => s.replace(/_/g, ' ').trim();
const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** The ladder's pieces: the sets' judged parts and the plan extras, closed over consumed gear pieces. */
export function gearPieces(
  items: Readonly<Record<string, Item>>,
  crafts: ReadonlyMap<string, { materials?: { rawName: string }[] }>,
  sets: readonly EquipmentSet[],
): string[] {
  const want = new Set<string>();
  const queue: string[] = [];
  const add = (raw: string) => {
    const t = items[raw]?.Type;
    if (!t || !(t in SLOT_OF_TYPE) || want.has(raw)) return;
    want.add(raw);
    queue.push(raw);
  };
  for (const s of sets)
    if ((W13_SETS as readonly string[]).includes(s.setName))
      for (const raw of [...s.armors, ...s.tools, ...s.weapons]) add(raw);
  for (const raw of PLAN_EXTRAS) add(raw);
  while (queue.length) {
    const raw = queue.shift() as string;
    for (const m of crafts.get(raw)?.materials ?? []) add(m.rawName);
  }
  return [...want].sort();
}

/** The materials of every ladder piece that are not themselves gear: M14 expands them (TR-6). */
export function gearMaterials(
  items: Readonly<Record<string, Item>>,
  crafts: ReadonlyMap<string, { materials?: { rawName: string }[] }>,
  sets: readonly EquipmentSet[],
): string[] {
  const out = new Set<string>();
  for (const raw of gearPieces(items, crafts, sets))
    for (const m of crafts.get(raw)?.materials ?? []) {
      const t = items[m.rawName]?.Type;
      if (!(t && t in SLOT_OF_TYPE)) out.add(m.rawName);
    }
  return [...out].sort();
}

const generator = defineGenerator({
  name: 'gear',
  system: 'gear',
  inputs: [
    'website-data/items.json',
    'website-data/crafts.json',
    'website-data/taskUnlocks.json',
    'website-data/shared-data.json#equipmentSets',
  ],
  run({ data, pin }) {
    const items = data.items as Record<string, Item>;
    const crafts = craftsByRawName(
      data.crafts as Record<
        string,
        { rawName: string; materials?: { rawName: string; itemQuantity?: number }[] }
      >,
    );
    const sets = data.equipmentSets as EquipmentSet[];
    const unlocks = data.taskUnlocks as unknown[][];
    const unlockOf = new Map<string, { world: number; row: number }>();
    unlocks.slice(0, 3).forEach((col, w) => {
      (col ?? []).forEach((group, row) => {
        for (const it of Array.isArray(group) ? group : [group])
          if (it && typeof it === 'object' && typeof (it as { rawName?: unknown }).rawName === 'string')
            unlockOf.set((it as { rawName: string }).rawName, { world: w + 1, row });
      });
    });
    const setOf = new Map<string, string>();
    for (const s of sets)
      if ((W13_SETS as readonly string[]).includes(s.setName))
        for (const raw of [...s.armors, ...s.tools, ...s.weapons])
          if (!setOf.has(raw)) setOf.set(raw, s.setName);

    const ladder: Record<string, unknown> = {};
    for (const raw of gearPieces(items, crafts, sets)) {
      const it = items[raw] as Item;
      const recipe = crafts.get(raw);
      const mats = recipe?.materials ?? [];
      const isGear = (r: string) => {
        const t = items[r]?.Type;
        return !!t && t in SLOT_OF_TYPE;
      };
      const pct = (
        [
          [it.UQ1txt, it.UQ1val],
          [it.UQ2txt, it.UQ2val],
        ] as const
      )
        .filter(([t]) => typeof t === 'string' && t !== '' && t !== '0')
        .map(([t, v]) => ({ txt: t as string, val: n(v) }));
      ladder[raw] = {
        name: human(it.displayName ?? raw),
        slot: SLOT_OF_TYPE[it.Type as string],
        set: setOf.get(raw) ?? null,
        cls: it.Class ?? 'ALL',
        lvReq: n(it.lvReqToEquip),
        def: n(it.Defence),
        wp: n(it.Weapon_Power),
        str: n(it.STR),
        agi: n(it.AGI),
        wis: n(it.WIS),
        luk: n(it.LUK),
        pct,
        slots: n(it.Upgrade_Slots_Left),
        materials: mats
          .filter((m) => !isGear(m.rawName))
          .map((m) => ({
            rawName: m.rawName,
            amount: m.itemQuantity ?? 1,
            ref: `items.acquisition.${slugify(m.rawName)}`,
          })),
        consumes: mats
          .filter((m) => isGear(m.rawName))
          .map((m) => ({ rawName: m.rawName, amount: m.itemQuantity ?? 1 })),
        unlock: unlockOf.get(raw) ?? null,
      };
    }

    const by = generatedBy(generator, pin);
    const facts: FactTableT[] = [
      {
        id: 'gear.fact.ladder',
        system: 'gear',
        origin: 'generated',
        title: 'W1–W3 gear pieces, stats and recipes',
        rows: ladder as FactTableT['rows'],
        sources: [
          generatedSource(pin, 'website-data/items.json', 'IdleOn Toolbox game data: item stats'),
          generatedSource(pin, 'website-data/crafts.json', 'IdleOn Toolbox game data: anvil recipes'),
          generatedSource(
            pin,
            'website-data/taskUnlocks.json',
            'IdleOn Toolbox game data: Task Board unlocks',
          ),
        ],
        generatedBy: by,
      },
    ];
    return { facts };
  },
});

export default generator;
