// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 Gear & Tools (docs/specs/M18-gear-tools.md TR-2): Toolbox output -> the gear Account State fields,
// and the decoders the engine reads them with. Called from adapter.ts after the characters are read; like
// it, the only place that knows these Toolbox paths. A field whose source is missing is null and, where
// its raw keys are missing, listed in diagnostics.unknownFields.
//
// Toolbox attaches each item's game data to every equipped, stored and bagged copy, with that copy's
// upgrade stones added on (`addStoneDataToEquip` records each stone delta in `changes`). So a copy's base
// stats are its stats minus its `changes`. Its `owner` field is a character name and is never read.
import { isKnown } from './fields';
import {
  type ArmorSmithyState,
  GEAR_SLOTS,
  type GearAccountFields,
  type GearClass,
  type GearItem,
  type GearPlace,
  type GearSlotId,
  type GearStats,
  type GearWorn,
} from './gear-types';
import type { AccountState, CharacterState } from './types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const num = (v: unknown, fallback = 0): number => finite(v) ?? fallback;
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** items.json `Type` of each judged slot family (F-a). Weapons are every class's weapon type. */
export const GEAR_TYPES: Readonly<
  Record<
    string,
    | 'helmet'
    | 'shirt'
    | 'pants'
    | 'shoes'
    | 'pendant'
    | 'ring'
    | 'weapon'
    | 'pickaxe'
    | 'hatchet'
    | 'rod'
    | 'net'
  >
> = {
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
/** Equipment slot index -> slot (F-a), and tool slot index -> slot. */
const EQUIPMENT_INDEX: readonly GearSlotId[] = [
  'helmet',
  'weapon',
  'shirt',
  'pendant',
  'pants',
  'ring1',
  'shoes',
  'ring2',
];
const TOOL_INDEX: readonly GearSlotId[] = ['pickaxe', 'hatchet', 'rod', 'net'];
const CLASSES: ReadonlySet<string> = new Set(['ALL', 'WARRIOR', 'ARCHER', 'MAGE', 'BEGINNER']);
const STATS = ['Defence', 'Weapon_Power', 'STR', 'AGI', 'WIS', 'LUK'] as const;

interface Collector {
  checkRaw(template: string, path: string, i: number | null, slots?: number[]): boolean;
  unknown(path: string): void;
  readonly items: Set<string>;
}

export interface GearInputs {
  account: Dict;
  characters: unknown[];
  data: Dict;
  states: CharacterState[];
  withData: number[];
}

const pctLines = (x: Dict, delta: (k: string) => number): Array<[string, number]> => {
  const out: Array<[string, number]> = [];
  for (const [t, v] of [
    ['UQ1txt', 'UQ1val'],
    ['UQ2txt', 'UQ2val'],
  ] as const) {
    const txt = x[t];
    if (typeof txt === 'string' && txt !== '' && txt !== '0') out.push([txt, num(x[v]) - delta(v)]);
  }
  return out;
};

/** The stone deltas a copy carries (Toolbox `changes`: one `{ stat: amount }` per changed stat). */
function stoneDeltas(x: Dict): Map<string, number> {
  const out = new Map<string, number>();
  for (const ch of list(x.changes))
    if (isDict(ch)) for (const [k, v] of Object.entries(ch)) out.set(k, (out.get(k) ?? 0) + num(v));
  return out;
}

type Read =
  | { kind: 'none' }
  | { kind: 'unknown'; rawName: string }
  | { kind: 'item'; rawName: string; base: GearStats; worn: GearWorn };

/** One Toolbox item copy: its base stats and its stored worn form, or nothing for Blank and other types. */
function readCopy(x: unknown): Read {
  if (!isDict(x) || typeof x.rawName !== 'string' || x.rawName === 'Blank' || x.rawName === 'LockedInvSpace')
    return { kind: 'none' };
  const type = typeof x.Type === 'string' ? x.Type : null;
  if (type === null)
    return typeof x.displayName === 'string' ? { kind: 'none' } : { kind: 'unknown', rawName: x.rawName };
  if (!(type in GEAR_TYPES)) return { kind: 'none' };
  const cls = typeof x.Class === 'string' && CLASSES.has(x.Class) ? (x.Class as GearClass) : 'ALL';
  const d = stoneDeltas(x);
  const delta = (k: string) => d.get(k) ?? 0;
  const left = num(x.Upgrade_Slots_Left);
  const max = Math.max(num(x.maxUpgradeSlots), left - delta('Upgrade_Slots_Left'));
  const base: GearStats = [
    type,
    cls,
    num(x.lvReqToEquip),
    ...(STATS.map((s) => num(x[s]) - delta(s)) as [number, number, number, number, number, number]),
    max,
    pctLines(x, delta),
    typeof x.displayName === 'string' ? x.displayName.replace(/_/g, ' ') : x.rawName,
  ];
  const stoned = d.size > 0;
  const worn: GearWorn = stoned
    ? [
        x.rawName,
        ...(STATS.map((s) => num(x[s])) as [number, number, number, number, number, number]),
        left,
        max,
      ]
    : x.rawName;
  return { kind: 'item', rawName: x.rawName, base, worn };
}

function readArmorSmithy(account: Dict): ArmorSmithyState | null {
  const s = account.armorSmithy;
  if (!isDict(s) || !Array.isArray(s.sets)) return null;
  const days = finite(s.days);
  if (days === null) return null;
  return {
    canHire: s.isSmithyUnlocked === true,
    hired: num(s.smithyUnlocked) === 1,
    daysWaited: days,
    registered: list(s.unlockedSets).filter((x): x is string => typeof x === 'string' && x !== ''),
  };
}

function readRecipes(data: Dict): number[][] | null {
  let raw: unknown = data.AnvilCraftStatus;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: number[][] = [];
  for (const tab of raw) {
    if (!Array.isArray(tab)) return null;
    out.push(tab.map((v) => num(v, -1)));
  }
  return out;
}

/** The M18 fields, account and per character (written onto the states in place). */
export function readGear(input: GearInputs, c: Collector): GearAccountFields {
  const { account, characters, data, states, withData } = input;
  const items = new Map<string, GearStats>();
  for (const st of states) {
    const raw = characters[st.index];
    const at = `characters[${st.index}].gear`;
    st.gear = null;
    if (!isDict(raw) || !c.checkRaw('characters[].gear', at, st.index)) continue;
    const equipment = list(raw.equipment);
    const tools = list(raw.tools);
    if (equipment.length < EQUIPMENT_INDEX.length || tools.length < TOOL_INDEX.length) {
      c.unknown(at);
      continue;
    }
    st.gear = GEAR_SLOTS.map((slot) => {
      const ei = EQUIPMENT_INDEX.indexOf(slot);
      const r = readCopy(ei >= 0 ? equipment[ei] : tools[TOOL_INDEX.indexOf(slot)]);
      if (r.kind === 'none') return null;
      if (r.kind === 'unknown') {
        c.items.add(r.rawName);
        return '?';
      }
      items.set(r.rawName, items.get(r.rawName) ?? r.base);
      return r.worn;
    });
  }

  // Held gear's base stats: chest storage and every bag (M8's holdings count the copies).
  // Worn items' stats are always kept; a missing storage or bag only makes the held part unknown.
  const storage = isDict(account.storage) ? account.storage.list : undefined;
  if (c.checkRaw('account.gearItems', 'account.gearItems', null, withData) && Array.isArray(storage)) {
    const bags = states.flatMap((st) => {
      const raw = characters[st.index];
      return isDict(raw) ? list(raw.inventory) : [];
    });
    for (const x of [...storage, ...bags]) {
      const r = readCopy(x);
      if (r.kind === 'item' && !items.has(r.rawName)) items.set(r.rawName, r.base);
    }
  } else c.unknown('account.gearItems');
  const gearItems = Object.fromEntries([...items].sort(([a], [b]) => (a < b ? -1 : 1)));

  let anvilRecipes: number[][] | null = null;
  if (c.checkRaw('account.anvilRecipes', 'account.anvilRecipes', null)) {
    anvilRecipes = readRecipes(data);
    if (anvilRecipes === null) c.unknown('account.anvilRecipes');
  }
  let armorSmithy: ArmorSmithyState | null = null;
  if (c.checkRaw('account.armorSmithy', 'account.armorSmithy', null)) {
    armorSmithy = readArmorSmithy(account);
    if (armorSmithy === null) c.unknown('account.armorSmithy');
  }
  return { gearItems, anvilRecipes, armorSmithy };
}

// ---------- decoders (engine side) ----------

/** A rawName's base stats as a GearItem, or null when `gearItems` doesn't have it. */
export function gearItem(state: Pick<AccountState, 'account'>, rawName: string): GearItem | null {
  const s = state.account.gearItems?.[rawName];
  if (!s) return null;
  const [type, cls, lvReq, def, wp, str, agi, wis, luk, slots, pct, name] = s;
  return {
    rawName,
    name: name ?? rawName,
    type,
    cls,
    lvReq,
    def,
    wp,
    str,
    agi,
    wis,
    luk,
    pct: pct.map(([txt, val]) => ({ txt, val })),
    slotsLeft: slots,
    slotsMax: slots,
  };
}

export interface WornSlot {
  slot: GearSlotId;
  item: GearItem | null;
  /** The slot holds an item this pin doesn't know, or its stats are missing: never judged. */
  unknown?: true;
}

/** A character's 12 judged slots, decoded; null when `characters[i].gear` is unknown. */
export function wornGear(state: AccountState, character: CharacterState): WornSlot[] | null {
  const g = character.gear;
  if (!g || !isKnown(state, `characters[${character.index}].gear`)) return null;
  return GEAR_SLOTS.map((slot, i) => {
    const w = g[i] ?? null;
    if (w === null) return { slot, item: null };
    if (w === '?') return { slot, item: null, unknown: true };
    const rawName = typeof w === 'string' ? w : w[0];
    const base = gearItem(state, rawName);
    if (!base) return { slot, item: null, unknown: true };
    if (typeof w === 'string') return { slot, item: base };
    const [, def, wp, str, agi, wis, luk, left, max] = w;
    return { slot, item: { ...base, def, wp, str, agi, wis, luk, slotsLeft: left, slotsMax: max } };
  });
}

export interface HeldGear extends GearItem {
  count: number;
  places: Array<{ place: GearPlace; count: number }>;
}

/**
 * Judged gear the account holds and nobody wears (M18 FR-5): chest storage and every bag, from M8's
 * holdings, at base stats. null when the holdings or the item stats are unknown.
 */
export function heldGear(state: AccountState): HeldGear[] | null {
  const items = state.account.gearItems;
  const storage = state.account.storageItems;
  if (!items || !storage || !isKnown(state, 'account.gearItems') || !isKnown(state, 'account.storageItems'))
    return null;
  const out: HeldGear[] = [];
  for (const rawName of Object.keys(items)) {
    const places: HeldGear['places'] = [];
    const s = storage[rawName] ?? 0;
    if (s > 0) places.push({ place: 'storage', count: s });
    for (const c of state.characters) {
      const n = c.inventoryItems?.[rawName] ?? 0;
      if (n > 0) places.push({ place: `inv:c${c.index}`, count: n });
    }
    if (places.length === 0) continue;
    const base = gearItem(state, rawName);
    if (base) out.push({ ...base, count: places.reduce((n, p) => n + p.count, 0), places });
  }
  return out;
}
