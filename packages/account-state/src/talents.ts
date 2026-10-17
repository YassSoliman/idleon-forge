// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Reads the M9 Builds fields (M9 TR-3, TR-4) from Toolbox's output and the raw save. Kept in its own
// file so the adapter only gains two calls; every Toolbox and raw name these fields depend on is here.
import type { CharacterTalents, PresetTalents, ResetItems, TalentLevel } from './talent-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

/** Talent presets open at class Lv 15 (M9 FR-1, FR-2). */
export const PRESET_LEVEL = 15;
/** The attack bar rows M9 reads (TR-3): the first two. */
export const ATTACK_BAR_ROWS = 2;
/** Raw item names of the reset items (M9 TR-10). */
export const RESET_POTION = 'ResetCompleted';
export const RESET_FRAGMENT = 'ResetFrag';

const level = (t: Dict, key: 'baseLevel' | 'level'): TalentLevel | null => {
  const id = finite(t.skillIndex ?? t.talentId);
  if (id === null) return null;
  return { id, base: Math.max(0, finite(t[key]) ?? 0), max: finite(t.maxLevel) ?? 0 };
};

/** Toolbox's `talents` (or `talentPreset.talents`): `{ "0": { name, orderedTalents[] }, ... }` in class order. */
function tabsOf(talents: unknown): PresetTalents['tabs'] | null {
  if (!isDict(talents)) return null;
  const keys = Object.keys(talents)
    .filter((k) => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b));
  const tabs: PresetTalents['tabs'] = [];
  for (const [i, k] of keys.entries()) {
    if (i >= 5) break;
    const t = talents[k];
    if (!isDict(t) || !Array.isArray(t.orderedTalents)) return null;
    tabs.push({
      tab: (i + 1) as 1 | 2 | 3 | 4 | 5,
      tabName: typeof t.name === 'string' ? t.name : '',
      talents: t.orderedTalents.flatMap((x) => {
        const l = isDict(x) ? level(x, 'baseLevel') : null;
        return l ? [l] : [];
      }),
    });
  }
  return tabs;
}

const starOf = (flat: unknown): TalentLevel[] =>
  Array.isArray(flat)
    ? flat.flatMap((x) => {
        const l = isDict(x) ? level(x, 'level') : null;
        return l ? [l] : [];
      })
    : [];

/** A raw `AttackLoadout_<i>` / `AttackLoadoutpre_<i>` value (JSON string or array) -> ids on rows 0–1. */
export function attackBarOf(raw: unknown): number[] | null {
  let v = raw;
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(v)) return null;
  const out: number[] = [];
  for (const row of v.slice(0, ATTACK_BAR_ROWS)) {
    if (!Array.isArray(row)) return null;
    for (const slot of row) {
      const id = slot === 'Null' ? null : finite(slot);
      if (id !== null) out.push(id);
    }
  }
  return out;
}

export interface TalentCharacterInput {
  /** Toolbox's character. */
  raw: Dict;
  /** The raw save's data. */
  data: Dict;
  index: number;
  level: number;
  /** Whether the raw keys behind `characters[].talents` passed (FIELD_RAW_KEYS). */
  known: boolean;
}

/** `characters[].talents`, or null when it can't be read. */
export function readTalents({
  raw,
  data,
  index,
  level: lv,
  known,
}: TalentCharacterInput): CharacterTalents | null {
  if (!known) return null;
  const classIndex = finite(raw.classIndex);
  const sel = finite(raw.selectedTalentPreset);
  const tabs = tabsOf(raw.talents);
  if (classIndex === null || (sel !== 0 && sel !== 1) || tabs === null) return null;
  const active: PresetTalents = {
    tabs,
    star: starOf(raw.flatStarTalents),
    attackBar: attackBarOf(data[`AttackLoadout_${index}`]),
  };
  let other: PresetTalents | null = null;
  const preset = raw.talentPreset;
  if (lv >= PRESET_LEVEL && isDict(preset) && data[`SLpre_${index}`] !== undefined) {
    const otherTabs = tabsOf(preset.talents);
    if (otherTabs !== null)
      other = {
        tabs: otherTabs,
        star: starOf(preset.flatStarTalents),
        attackBar: attackBarOf(data[`AttackLoadoutpre_${index}`]),
      };
  }
  return { classIndex, selectedPreset: sel, active, other };
}

const countIn = (list: unknown, rawName: string): number => {
  if (!Array.isArray(list)) return 0;
  let n = 0;
  for (const it of list) if (isDict(it) && it.rawName === rawName) n += Math.max(0, finite(it.amount) ?? 0);
  return n;
};

/** `account.resetItems`: potions and fragments over storage and every inventory; null when storage failed. */
export function readResetItems(
  account: Dict,
  characters: unknown[],
  failedSections: readonly string[],
): ResetItems | null {
  if (failedSections.includes('storage')) return null;
  const storage = isDict(account.storage) ? account.storage.list : undefined;
  const lists = [storage, ...characters.map((c) => (isDict(c) ? c.inventory : undefined))];
  return {
    potions: lists.reduce<number>((n, l) => n + countIn(l, RESET_POTION), 0),
    fragments: lists.reduce<number>((n, l) => n + countIn(l, RESET_FRAGMENT), 0),
  };
}
