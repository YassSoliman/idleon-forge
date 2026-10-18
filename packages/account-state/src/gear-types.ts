// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 Gear & Tools: its Account State fields (docs/specs/M18-gear-tools.md TR-2, M1 TR-11). Read in
// gear.ts only; declared in gear-fields.ts. Optional so hand-built states need not spell them out; the
// adapter always sets each one, to a value or null (null = unknown, never "none").
//
// Size (TR-2, M1 TR-16's history cap): an item's stats are stored once per rawName (`account.gearItems`),
// worn copies point at them and carry their own stats only when upgrade stones changed them, and held
// gear is counted from M8's holdings (`storageItems`, `inventoryItems`). Held copies are judged at their
// base stats: a stone on a held copy can only make it better than M18 thinks, so a hand-out is never a
// downgrade. Decode with `wornGear` and `heldGear` (gear.ts).
//
// Privacy (TR-2): Toolbox's item `owner` is a character name. It is never read.

/** The 8 judged equipment slots and the 4 gathering tool slots, in F-a order (Toolbox slot indices). */
export const GEAR_SLOTS = [
  'helmet',
  'weapon',
  'shirt',
  'pendant',
  'pants',
  'ring1',
  'shoes',
  'ring2',
  'pickaxe',
  'hatchet',
  'rod',
  'net',
] as const;
export type GearSlotId = (typeof GEAR_SLOTS)[number];
export type GearClass = 'ALL' | 'WARRIOR' | 'ARCHER' | 'MAGE' | 'BEGINNER';

/** One item's own stats, upgrade stones included when it is a worn copy (decoded; not stored this way). */
export interface GearItem {
  /** Toolbox item rawName, e.g. "EquipmentHats28". */
  rawName: string;
  /** Its display name, "Gold Helmet" (items.json displayName). */
  name: string;
  /** items.json Type, e.g. "HELMET", "BOW", "PICKAXE". */
  type: string;
  cls: GearClass;
  /** lvReqToEquip: the class level, or the skill level for a gathering tool (F-b). */
  lvReq: number;
  def: number;
  wp: number;
  str: number;
  agi: number;
  wis: number;
  luk: number;
  /** UQ1/UQ2 "% lines", empty when none. */
  pct: Array<{ txt: string; val: number }>;
  /** Upgrade_Slots_Left and Toolbox's maxUpgradeSlots. */
  slotsLeft: number;
  slotsMax: number;
}

/**
 * Stored base stats of one rawName (items.json, no stones):
 * [type, class, lvReq, Defence, Weapon Power, STR, AGI, WIS, LUK, upgrade slots, % lines, display name].
 */
export type GearStats = [
  type: string,
  cls: GearClass,
  lvReq: number,
  def: number,
  wp: number,
  str: number,
  agi: number,
  wis: number,
  luk: number,
  slots: number,
  pct: Array<[txt: string, val: number]>,
  name: string,
];

/**
 * A stored worn copy: its rawName when it has its base stats, or
 * [rawName, Defence, Weapon Power, STR, AGI, WIS, LUK, upgrade slots left, max upgrade slots] when stones
 * changed them. `null` for an empty slot; `"?"` for an item this parser pin doesn't know.
 */
export type GearWorn =
  | string
  | [
      rawName: string,
      def: number,
      wp: number,
      str: number,
      agi: number,
      wis: number,
      luk: number,
      left: number,
      max: number,
    ]
  | null;

/** Where a held copy sits: chest storage or a character's bag (index only, never a name). */
export type GearPlace = 'storage' | `inv:c${number}`;

export interface GearCharacterFields {
  /** The 12 judged slots in F-a order (`GEAR_SLOTS`). */
  gear?: null | GearWorn[];
}

/** M18 TR-2 `armorSmithy`: F-g, from Toolbox `getArmorSmithy` (OLA[379–381], gems, bun_c). */
export interface ArmorSmithyState {
  /** Toolbox `isSmithyUnlocked`: 2,000 gems bought (bun_c counts 1,500) or 30 days waited. */
  canHire: boolean;
  /** OLA[380] = 1. */
  hired: boolean;
  /** OLA[381]: days counted toward the 30-day wait (it counts from the account's start). */
  daysWaited: number;
  /** OLA[379]: the registered sets' names ("COPPER_SET", ...). */
  registered: string[];
}

export interface GearAccountFields {
  /** Base stats of every judged item worn or held, by rawName. */
  gearItems?: Record<string, GearStats> | null;
  /** Raw `AnvilCraftStatus`: [tab][recipe], -1 locked, 0 available, 1 crafted at least once (F-c). */
  anvilRecipes?: number[][] | null;
  armorSmithy?: ArmorSmithyState | null;
}
