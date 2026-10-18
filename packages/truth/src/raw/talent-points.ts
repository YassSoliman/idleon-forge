// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// A floor on each tab's points left, from the game's own `_customBlock_TotalTalentPoints` (N.js,
// GAME_SOURCES.totalTalentPoints). The game sums about twenty bonuses per tab (bubbles, vials, star
// signs, stamps, the Flurbo shop, companions, ...). We keep only the terms the raw save holds
// directly: class level, skill levels, `CYTalentPoints` and achievements. Every term left out is
// added, never subtracted, so the true value is at least ours. This is a check, never advice
// (ADR 0005): it is only ever used to doubt a "no points waiting" line, never shown as a number.
import { CLASS_NAMES } from '../game-data';

export interface PointInputs {
  /** `Lv0_<i>`: [class level, then skill levels]. */
  lv0: readonly number[];
  classId: number;
  /** `CYTalentPoints` (CurrenciesOwned.TalentPoints), 6 entries. */
  cy: readonly number[];
  /** `AchieveReg`: an achievement is done when its entry is -1 (`AchieveStatus`). */
  achieveReg: readonly number[];
}

const at = (a: readonly number[], i: number) => {
  const v = a[i];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
};

/** `_customBlock_AchieveStatus(n)` for the achievements TotalTalentPoints reads (none of them pays 5, 10 or 20). */
const ach = (reg: readonly number[], n: number) => (reg[n] === -1 ? 1 : 0);

/**
 * `TalentDL` (the first block of TotalTalentPoints): [-3 + the 9 first skill levels, half of each
 * floored, a fifth of each floored]. The round(GetTalentNumber(1, 275)) bonus on the first is left out.
 */
export function skillTerms(lv0: readonly number[]): [number, number, number] {
  let a = -3;
  let b = 0;
  let c = 0;
  for (let e = 0; e < 9; e++) {
    const v = at(lv0, e + 1);
    a += v;
    b += Math.floor(v / 2);
    c += Math.floor(v / 5);
  }
  return [a, b, c];
}

/**
 * The floor on each tab's TOTAL points (before spending), tab index 0–4 then the star tab (5), as
 * TotalTalentPoints builds `TalentDL2` with `d = 0`. Tabs 4 and 5 are wrapped in max(0, ·) by the
 * game, so for them the floor is only meaningful together with the spent points: use `unspentFloor`.
 */
function totalFloor(i: PointInputs, t: number): number {
  const L = at(i.lv0, 0);
  const [dl0, dl1, dl2] = skillTerms(i.lv0);
  const cy = (k: number) => at(i.cy, k);
  const A = (n: number) => ach(i.achieveReg, n);
  switch (t) {
    case 0:
      return 3 * (L - 1) + dl0 + cy(0) + 5 * A(54) + 6 * A(216);
    case 1:
      return 3 * (L - 6) + dl1 + cy(1) + 2 * A(76) + 3 * A(78) + 8 * A(230);
    case 2:
      return 3 * (L - 29) + dl1 + cy(2) + 5 * A(166) + 10 * A(170) + 8 * A(219);
    case 3:
      if (i.classId === 4) return 1;
      return (
        3 * Math.min(L - 89, 100) +
        Math.max(0, 2 * (L - 189)) +
        dl2 +
        cy(3) +
        Math.floor(at(i.lv0, 14) / 2) +
        10 * A(292) +
        10 * A(295) +
        10 * A(239) +
        15 * A(240) +
        12 * A(241)
      );
    case 4:
      if (i.classId === 12 || i.classId === 16) return 1;
      return 3 * (L - 249) + dl2 + cy(4);
    default:
      return L - 1 + dl0 + cy(5) + 10 * A(212) + 20 * A(289) + 20 * A(305);
  }
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
