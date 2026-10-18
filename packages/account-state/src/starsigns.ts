// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 Star Signs and constellations (docs/specs/M16-star-signs.md TR-2): Toolbox output -> the star sign,
// constellation and Telescope-route fields. Called from adapter.ts; like it, the only place that knows
// these Toolbox paths. Every field is null when its parser section or raw key is missing.
import { killsLeftTable } from './frontier';
import type { ConstellationProgress, StarSignsAccountFields, StarSignsState } from './starsigns-types';
import type { CharacterState } from './types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

/**
 * The tree doors to the Telescope (M16 F-f), as map and door index: Jungle Perimeter door 2 (to The Base
 * of the Bark), The Base of the Bark door 1 (to Hollowed Trunk), Hollowed Trunk door 1 (to Where the
 * Branches End). The requirements are game data in `maps.fact.maps`; CI checks this path against it.
 */
export const TELESCOPE_ROUTE: readonly { mapIndex: number; door: number }[] = [
  { mapIndex: 16, door: 1 },
  { mapIndex: 13, door: 0 },
  { mapIndex: 18, door: 0 },
];
/** Where the Branches End: the Telescope's map (N.js menu 24 opens only here, M16 V5). */
export const TELESCOPE_MAP = 31;
/** `OptionsListAccount[40]`: unspent Star Chart Points (M16 F-a, N.js @7552743). */
export const STAR_POINTS_KEY = 40;

/** M16 V4: the game's `Number2Letter` order, '_' for slot 0, then 'a' for slot 1, 'b' for slot 2, … */
export function decodeLetters(letters: string): number[] {
  const out: number[] = [];
  for (const ch of letters) {
    const slot = ch === '_' ? 0 : ch >= 'a' && ch <= 'z' ? ch.charCodeAt(0) - 96 : null;
    if (slot !== null && !out.includes(slot)) out.push(slot);
  }
  return out;
}

interface Collector {
  checkRaw(template: string, path: string, i: number | null, slots?: number[]): boolean;
  unknown(path: string): void;
}

export interface StarSignsInputs {
  account: Dict;
  characters: unknown[];
  data: Dict;
  states: CharacterState[];
  withData: number[];
  failedSections: readonly string[];
}

const attempt = <T>(f: () => T | null): T | null => {
  try {
    return f();
  } catch {
    return null;
  }
};

function readConstellations(account: Dict): { claimed: number[]; progress: ConstellationProgress[] } | null {
  const raw = account.constellations;
  if (!Array.isArray(raw)) return null;
  const claimed: number[] = [];
  const progress: ConstellationProgress[] = [];
  for (const x of raw) {
    if (!isDict(x)) continue;
    const rawIndex = finite(x.rawIndex) ?? finite(x.mapIndex);
    if (rawIndex === null) continue;
    const letters = typeof x.completedChars === 'string' ? x.completedChars : '';
    if (x.done === true) claimed.push(rawIndex);
    else if (letters.length > 0)
      progress.push({ rawIndex, letterCount: letters.length, recorded: decodeLetters(letters) });
  }
  return { claimed: claimed.sort((a, b) => a - b), progress };
}

/** The game's StarSigns id of each sign: its position in Toolbox's `account.starSigns` (catalog order). */
function signIds(account: Dict): Map<string, number> | null {
  if (!Array.isArray(account.starSigns)) return null;
  const out = new Map<string, number>();
  account.starSigns.forEach((s, i) => {
    if (isDict(s) && typeof s.starName === 'string') out.set(s.starName, i);
  });
  return out;
}

/** The M16 account fields; also sets each character's `starSigns` and `telescopeRoute` on `states`. */
export function readStarSigns(i: StarSignsInputs, c: Collector): StarSignsAccountFields {
  const { account, characters, data, states, failedSections } = i;
  const ids = failedSections.includes('starSigns') ? null : signIds(account);

  for (const st of states) {
    const raw = characters[st.index];
    const at = `characters[${st.index}]`;
    if (!ids || !isDict(raw) || !Array.isArray(raw.starSigns)) {
      st.starSigns = null;
      c.unknown(`${at}.starSigns`);
    } else
      st.starSigns = raw.starSigns.flatMap((s) => {
        const id = isDict(s) && typeof s.starName === 'string' ? ids.get(s.starName) : undefined;
        return id === undefined ? [] : [id];
      });
    if (!c.checkRaw('characters[].telescopeRoute', `${at}.telescopeRoute`, st.index)) {
      st.telescopeRoute = null;
      continue;
    }
    const table = killsLeftTable(data, st.index);
    st.telescopeRoute = TELESCOPE_ROUTE.map(({ mapIndex, door }) => {
      const row = table?.[mapIndex];
      const v = Array.isArray(row) ? finite(row[door]) : null;
      return v === null ? null : Math.max(0, Math.ceil(v));
    });
  }

  if (!ids || failedSections.includes('constellations')) {
    c.unknown('account.starSigns');
    return { starSigns: null };
  }
  const starSigns = attempt((): StarSignsState | null => {
    const signs = account.starSigns as unknown[];
    const constellations = readConstellations(account);
    if (constellations === null) return null;
    const unlocked: number[] = [];
    let infiniteCount = 0;
    signs.forEach((s, id) => {
      if (!isDict(s) || s.unlocked !== true) return;
      unlocked.push(id);
      if (s.isInfiniteStar === true) infiniteCount++;
    });
    const options = Array.isArray(account.accountOptions) ? account.accountOptions : null;
    const pointsUnspent = c.checkRaw(
      'account.starSigns.pointsUnspent',
      'account.starSigns.pointsUnspent',
      null,
    )
      ? finite(options?.[STAR_POINTS_KEY])
      : null;
    const quests = states.filter((st) => st.quests != null);
    const telescopeQuestDone =
      quests.length === 0 ? null : quests.some((st) => st.quests?.Telescope?.['1'] === 1);
    return { unlocked, infiniteCount, pointsUnspent, telescopeQuestDone, ...constellations };
  });
  if (starSigns === null) c.unknown('account.starSigns');
  return { starSigns };
}
