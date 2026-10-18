// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Exact talent points per tab, per preset, per character (ADR 0010). The game's total per tab comes
// from talent-points-formula.ts (raw-save terms read here, Toolbox terms injected from the worker);
// the star tab's from Toolbox `calcTotalStarTalent` (M21 TR-3, `talents.starPoints`). Each total is
// then checked against an answer key the save itself carries:
//  - spent points can never exceed what the tab holds, so the preset that spent more on a tab (with
//    the part of the total that depends on its own talents taken out) gives a floor on the total;
//  - when that floor equals our total, the fuller preset shows 0 left in the game: the total is
//    confirmed by the save (`exact-verified`). Above the floor, nothing contradicts it (`exact`).
//  - below the floor, a bonus term is missing: the tab falls back to the lower bound (`bound`) and keeps
//    the Toolbox terms it read, so the truth checks can name what to look for.
import type { ToolboxCalls } from '@idleon-forge/toolbox-parsers';
import { TALENT_POINT_SECTIONS } from './talent-points-fields';
import {
  clampsAtZero,
  type RawPointTerms,
  type ToolboxPointTerms,
  tabTotal,
  termsOfTab,
} from './talent-points-formula';
import type { PresetTalents, TabKey, TabPoints, TalentPoints } from './talent-types';
import type { CharacterState } from './types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const json = (v: unknown): unknown => {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return undefined;
  }
};
const numList = (v: unknown): number[] | null => {
  const d = json(v);
  return Array.isArray(d) ? d.map((x) => finite(x) ?? 0) : null;
};

interface Collector {
  checkRaw(template: string, path: string, i: number | null, slots?: number[]): boolean;
  unknown(path: string): void;
}

export interface TalentPointInputs {
  account: Dict;
  characters: unknown[];
  /** The raw save (`envelope.data`). */
  data: Dict;
  states: CharacterState[];
  failedSections: readonly string[];
  calls: ToolboxCalls | null;
  withFrozenClock: (<T>(now: number, f: () => T) => T) | null;
  asOf: number;
}

export const CLASS_TABS = [1, 2, 3, 4, 5] as const;

/** The account-wide raw terms; null when a required key is unreadable. */
export function rawAccountTerms(data: Dict): Omit<RawPointTerms, 'lv0' | 'classId'> | null {
  const cy = numList(data.CYTalentPoints);
  const achieveReg = numList(data.AchieveReg);
  const ola = numList(data.OptLacc);
  if (!cy || !achieveReg || !ola) return null;
  const merits = json(data.TaskZZ2);
  const merit = (w: number) =>
    Array.isArray(merits) && Array.isArray(merits[w]) ? (finite(merits[w][0]) ?? 0) : 0;
  const spelunk = json(data.Spelunk);
  const lore = Array.isArray(spelunk) && Array.isArray(spelunk[0]) ? (finite(spelunk[0][9]) ?? 0) : 0;
  return {
    cy,
    achieveReg,
    ola436: ola[436] ?? 0,
    ola158: ola[158] ?? 0,
    merit5: merit(4),
    merit6: merit(5),
    lore9: lore >= 1 ? 1 : 0,
  };
}

/** Σ base levels over a tab's talents (the game's `_SpentPoints`: Σ SkillLevels over its TalentOrder, max 0). */
export const spentOn = (p: PresetTalents, tab: TabKey): number =>
  Math.max(
    0,
    (tab === 'star' ? p.star : (p.tabs.find((t) => t.tab === tab)?.talents ?? [])).reduce(
      (n, t) => n + t.base,
      0,
    ),
  );

/** What one preset brings to the check: its spend on the tab and its own formula total there. */
export interface Side {
  spent: number;
  /** null when the formula couldn't run (missing calls, a failed section, a throw). */
  total: number | null;
  /** The Toolbox terms it read, kept on a mismatch for the truth checks. */
  terms: ToolboxPointTerms | null;
}

/**
 * One tab of preset `a`, checked against the save's answer key: both presets' spends against their
 * own totals (`b` is the other preset, null below class Lv 15). The two totals differ only by the
 * preset's own points-granting talents (Star Player, Back To Basics, ...), so a fully spent preset confirms the shared
 * part for both. `oracle` is the answer key as `a` sees it: its total minus the fewest points any
 * preset that spent there has left.
 */
export function checkTab(tab: TabKey, a: Side, b: Side | null, clamp: boolean, classId?: number): TabPoints {
  const base: Pick<TabPoints, 'spent'> = { spent: a.spent };
  if (a.total === null)
    return { ...base, total: null, unspent: null, confidence: 'bound', formula: null, oracle: null };
  const formula = a.total;
  // Only a preset that spent there is a key (0 spent proves nothing), and only with its own total.
  const lefts = [a, b].flatMap((s) => (s && s.total !== null && s.spent > 0 ? [s.total - s.spent] : []));
  const fewest = lefts.length > 0 ? Math.min(...lefts) : null;
  const oracle = fewest === null ? null : formula - fewest;
  if (fewest !== null && fewest < 0)
    return {
      ...base,
      total: null,
      unspent: null,
      confidence: 'bound',
      formula,
      oracle,
      ...(a.terms ? { terms: pick(a.terms, termsOfTab(tab, classId)) } : {}),
    };
  const left = formula - a.spent;
  return {
    ...base,
    total: formula,
    unspent: clamp ? Math.max(0, left) : left,
    confidence: fewest === 0 ? 'exact-verified' : 'exact',
    formula,
    oracle,
  };
}

/** The nonzero Toolbox terms among `ids` (an id also picks its numbered terms: `armory` -> `armory46`). */
const pick = (terms: ToolboxPointTerms, ids: string[]): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(terms))
    if (v !== 0 && Number.isFinite(v) && ids.some((id) => k === id || new RegExp(`^${id}\\d+$`).test(k)))
      out[k] = Math.round(v * 1000) / 1000;
  return out;
};

/** `talents.active.talentPoints` and `talents.other.talentPoints` for every character, in place. */
export function readTalentPoints(input: TalentPointInputs, c: Collector): void {
  const { account, characters, data, states, failedSections, calls, withFrozenClock, asOf } = input;
  const frozen = <T>(f: () => T): T => (withFrozenClock ? withFrozenClock(asOf, f) : f());
  const accountTerms = rawAccountTerms(data);
  const tabKnown = (t: TabKey) => !TALENT_POINT_SECTIONS[t].some((s) => failedSections.includes(s));
  for (const st of states) {
    const talents = st.talents;
    if (!talents || !calls) continue;
    const at = `characters[${st.index}].talents`;
    if (!c.checkRaw('characters[].talents.active.talentPoints', `${at}.active.talentPoints`, st.index))
      continue;
    const lv0 = numList(data[`Lv0_${st.index}`]);
    const raw = characters[st.index];
    if (!accountTerms || !lv0 || !isDict(raw)) {
      c.unknown(`${at}.active.talentPoints`);
      continue;
    }
    const r: RawPointTerms = { ...accountTerms, lv0, classId: talents.classIndex };
    const termsOf = (preset: 'active' | 'other'): ToolboxPointTerms | null => {
      try {
        return frozen(() => calls.talentPointTerms(raw, account, preset));
      } catch {
        return null;
      }
    };
    const presets: { p: PresetTalents; terms: ToolboxPointTerms | null; star: number | null }[] = [
      { p: talents.active, terms: termsOf('active'), star: talents.starPoints?.active ?? null },
    ];
    if (talents.other)
      presets.push({ p: talents.other, terms: termsOf('other'), star: talents.starPoints?.other ?? null });

    const sides = presets.map(({ p, terms, star }) => {
      const side = (tab: TabKey): Side => {
        const spent = spentOn(p, tab);
        const usable = terms !== null && tabKnown(tab);
        const total = !usable ? null : tab === 'star' ? star : tabTotal(tab, r, terms);
        return { spent, total, terms };
      };
      return side;
    });
    presets.forEach(({ p }, i) => {
      const mine = sides[i];
      const theirs = sides[1 - i];
      if (!mine) return;
      const out: TalentPoints = {};
      const tabs: TabKey[] = [...p.tabs.map((t) => t.tab), 'star'];
      for (const tab of tabs) {
        out[tab] = checkTab(
          tab,
          mine(tab),
          theirs ? theirs(tab) : null,
          tab !== 'star' && clampsAtZero(tab),
          r.classId,
        );
      }
      p.talentPoints = out;
    });
  }
}
