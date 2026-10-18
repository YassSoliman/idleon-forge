// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// A floor on each tab's points left, from the game's own `_customBlock_TotalTalentPoints` (N.js,
// GAME_SOURCES.totalTalentPoints). The formula itself is ported once, term by term, in
// @idleon-forge/account-state (talent-points-formula.ts, ADR 0010); here it runs with the terms the raw
// save holds directly (class level, skill levels, `CYTalentPoints`, achievements) and every
// Toolbox-computed term at 0. Every term left out is a bonus, never subtracted, so the true value is at
// least ours. This floor stays independent of the Toolbox parse: it is what catches a misread.
import { type RawPointTerms, skillTerms, starRawFloor, tabTotal } from '@idleon-forge/account-state';
import { CLASS_NAMES } from '../game-data';

export { skillTerms };

export interface PointInputs {
  /** `Lv0_<i>`: [class level, then skill levels]. */
  lv0: readonly number[];
  classId: number;
  /** `CYTalentPoints` (CurrenciesOwned.TalentPoints), 6 entries. */
  cy: readonly number[];
  /** `AchieveReg`: an achievement is done when its entry is -1 (`AchieveStatus`). */
  achieveReg: readonly number[];
}

const raw = (i: PointInputs): RawPointTerms => ({
  lv0: i.lv0,
  classId: i.classId,
  cy: i.cy,
  achieveReg: i.achieveReg,
});

/** The floor on tab index `t`'s total (0-4, 5 = star) before spending, raw terms only. */
function totalFloor(i: PointInputs, t: number): number {
  return t >= 5 ? starRawFloor(raw(i)) : tabTotal((t + 1) as 1 | 2 | 3 | 4 | 5, raw(i));
}

/** The floor on points left in tab index `t` (0–4, 5 = star) after `spent`: never below 0. */
export function unspentFloor(i: PointInputs, t: number, spent: number): number {
  return Math.max(0, Math.floor(totalFloor(i, t) - spent));
}

/** The floor on the star tab's total (the game's star points before spending), never below 0. */
export function starTotalFloor(i: PointInputs): number {
  return Math.max(0, Math.floor(totalFloor(i, 5)));
}

/**
 * `_customBlock_ReturnClasses(class)`: the class ids whose talent tabs a class has, in tab order
 * (the family's basics class, its first class, its subclass, elite, master). Classes below 6 are the
 * Beginner line: 1..class.
 */
export function returnClasses(d: number): number[] {
  const out: number[] = [];
  if (d < 6) {
    for (let e = 0; e < d; e++) out.push(e + 1);
    return out;
  }
  const base = 6 + 12 * Math.floor((d - 6) / 12);
  const n = d - 6 - 12 * Math.floor((d - 6) / 12);
  if (n > 7) out.push(base, base + Math.ceil(n / 12), base + Math.ceil((n - 5) / 2), base + (n - 4));
  else if (n > 3) out.push(base, base + Math.ceil(n / 12), base + Math.ceil((n - 1) / 2));
  else if (n > 1) out.push(base, base + Math.ceil(n / 12));
  else if (n > 0) out.push(base);
  out.push(d);
  return out;
}

export const classNameOf = (id: number): string | null => {
  const n = CLASS_NAMES[id];
  return n && n !== 'NOPE' && n !== 'FILLER' && n !== '0' ? n : null;
};
