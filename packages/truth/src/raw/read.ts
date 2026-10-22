// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Independent raw readers (M22 TR-1): basic facts read straight from the save envelope's keys, with
// layouts taken from the game client (game-data.ts cites each one), never from IdleOn Toolbox's
// mapping. They exist to catch the Toolbox parse or our adapter misreading the save.
import { STAR_COUNT, STAR_FIRST, TALENT_ORDER } from '../game-data';
import type { PresetSlot, RawCharacter, RawFacts, RawPreset, RawTab } from '../types';
import { classNameOf, type PointInputs, returnClasses, starTotalFloor, unspentFloor } from './talent-points';

/** The slice of the save envelope the readers use (the Firestore document: `{ data: {...} }`). */
export interface EnvelopeLike {
  data?: Record<string, unknown> | null;
}

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Raw values are often JSON text inside the document (`SL_0: "{\"0\":10}"`). */
export function decode(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  const s = v.trim();
  if (!(s.startsWith('{') || s.startsWith('['))) return v;
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}

export const num = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

const numList = (v: unknown): number[] | null => {
  const d = decode(v);
  return Array.isArray(d) ? d.map((x) => num(x) ?? 0) : null;
};

/** A talent level map (`SL_<i>`, `SLpre_<i>`, `SM_<i>`): `{ "<id>": level }`. */
const levelMap = (v: unknown): Record<number, number> | null => {
  const d = decode(v);
  if (!isDict(d)) return null;
  const out: Record<number, number> = {};
  for (const [k, x] of Object.entries(d)) {
    const id = Number(k);
    const lv = num(x);
    if (Number.isInteger(id) && lv !== null) out[id] = lv;
  }
  return out;
};

/** Items by raw name from a parallel order/quantity pair (bags, the chest). "Blank" slots are empty. */
function counts(order: unknown, qty: unknown): Record<string, number> | null {
  const o = decode(order);
  const q = decode(qty);
  if (!Array.isArray(o) || !Array.isArray(q)) return null;
  const out: Record<string, number> = {};
  o.forEach((name, i) => {
    if (typeof name !== 'string' || name === 'Blank' || name === '') return;
    const n = num(q[i]) ?? 0;
    if (n > 0) out[name] = (out[name] ?? 0) + n;
  });
  return out;
}

/** The character slots in the save: every `CharacterClass_<i>` with a class above 0. */
function slotsOf(data: Dict): number[] {
  return Object.keys(data)
    .map((k) => /^CharacterClass_(\d+)$/.exec(k)?.[1])
    .filter((x): x is string => x !== undefined)
    .map(Number)
    .filter((i) => (num(data[`CharacterClass_${i}`]) ?? 0) > 0)
    .sort((a, b) => a - b);
}

function presetOf(
  levels: Record<number, number>,
  slot: PresetSlot,
  key: string,
  live: boolean,
  classes: number[],
  inputs: PointInputs,
): RawPreset {
  const tabs: RawTab[] = classes.slice(0, 5).map((classId, t) => {
    const ids = TALENT_ORDER.slice(15 * (classId - 1), 15 * classId);
    const tabLevels: Record<number, number> = {};
    let spent = 0;
    for (const id of ids) {
      const lv = levels[id] ?? 0;
      tabLevels[id] = lv;
      spent += lv;
    }
    // TotalTalentPoints takes max(0, spent) for the live tab (the talent book's caller).
    spent = Math.max(0, spent);
    return { tab: t + 1, classId, levels: tabLevels, spent, unspentAtLeast: unspentFloor(inputs, t, spent) };
  });
  const star: Record<number, number> = {};
  let starSpent = 0;
  for (let b = 0; b < STAR_COUNT; b++) {
    const lv = levels[STAR_FIRST + b] ?? 0;
    if (lv !== 0) star[STAR_FIRST + b] = lv;
    starSpent += lv;
  }
  return {
    slot,
    key,
    live,
    tabs,
    star: {
      spent: starSpent,
      totalAtLeast: starTotalFloor(inputs),
      unspentAtLeast: unspentFloor(inputs, 5, starSpent),
      levels: star,
    },
  };
}

/** Every fact the truth checks compare, read from the raw envelope alone. Never throws. */
export function readRawFacts(envelope: EnvelopeLike | null | undefined): RawFacts {
  const unreadable: string[] = [];
  const data = isDict(envelope?.data) ? (envelope?.data as Dict) : {};
  const cy = numList(data.CYTalentPoints);
  if (!cy) unreadable.push('CYTalentPoints');
  const achieveReg = numList(data.AchieveReg);
  if (!achieveReg) unreadable.push('AchieveReg');
  const characters: RawCharacter[] = [];
  for (const i of slotsOf(data)) {
    const classId = num(data[`CharacterClass_${i}`]) ?? 0;
    const lv0 = numList(data[`Lv0_${i}`]);
    if (!lv0) {
      unreadable.push(`Lv0_${i}`);
      continue;
    }
    const stuff = numList(data[`PlayerStuff_${i}`]);
    const sel = stuff ? stuff[1] : null;
    const selectedPreset: PresetSlot | null = sel === 0 || sel === 1 ? sel : null;
    if (selectedPreset === null) unreadable.push(`PlayerStuff_${i}`);
    const inputs: PointInputs = { lv0, classId, cy: cy ?? [], achieveReg: achieveReg ?? [] };
    const classes = returnClasses(classId);
    const presets: RawPreset[] = [];
    const live = levelMap(data[`SL_${i}`]);
    if (!live) unreadable.push(`SL_${i}`);
    if (live && selectedPreset !== null)
      presets.push(presetOf(live, selectedPreset, `SL_${i}`, true, classes, inputs));
    if (data[`SLpre_${i}`] !== undefined) {
      const other = levelMap(data[`SLpre_${i}`]);
      if (!other) unreadable.push(`SLpre_${i}`);
      else if (selectedPreset !== null)
        presets.push(
          presetOf(other, (1 - selectedPreset) as PresetSlot, `SLpre_${i}`, false, classes, inputs),
        );
    }
    const maxLevels = levelMap(data[`SM_${i}`]);
    if (!maxLevels) unreadable.push(`SM_${i}`);
    const bag = counts(data[`InventoryOrder_${i}`], data[`ItemQTY_${i}`]);
    if (!bag) unreadable.push(`InventoryOrder_${i}`);
    characters.push({
      index: i,
      classId,
      className: classNameOf(classId),
      level: lv0[0] ?? 0,
      selectedPreset,
      maxLevels: maxLevels ?? {},
      presets: presets.sort((a, b) => a.slot - b.slot),
      coins: num(data[`Money_${i}`]),
      bag: bag ?? {},
    });
  }
  const chest = counts(data.ChestOrder, data.ChestQuantity);
  if (!chest) unreadable.push('ChestOrder');
  const vaultLevels = data.UpgVault === undefined ? null : numList(data.UpgVault);
  if (data.UpgVault !== undefined && !vaultLevels) unreadable.push('UpgVault');
  return { characters, bankCoins: num(data.MoneyBANK), vaultLevels, chest: chest ?? {}, unreadable };
}
