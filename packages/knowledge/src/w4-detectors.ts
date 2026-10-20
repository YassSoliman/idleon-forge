// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Shared by the World 4 Cooking and Lab Detectors (M26 FR-12, FR-14), exported through helpers.ts.
import type { CookingState, LabState, Meal } from '@idleon-forge/account-state';

/** A meal found at least once: a level or copies (Toolbox lists every meal, found or not). */
export const mealFound = (m: Meal): boolean => m.level > 0 || m.amount > 0;

/**
 * The found meal below the max level that is fastest to its next level: the fewest copies still to cook
 * times the progress one copy takes (every kitchen cooks any meal at its own speed, so this ranks them).
 */
export function fastestMeal(c: CookingState, exclude: string | null = null): Meal | null {
  let best: Meal | null = null;
  let bestCost = Number.POSITIVE_INFINITY;
  for (const m of c.meals) {
    if (!mealFound(m) || m.level >= c.mealMaxLevel || m.name === exclude) continue;
    const cost = Math.max(0, m.levelCost - m.amount) * m.cookReq;
    if (cost < bestCost) {
      best = m;
      bestCost = cost;
    }
  }
  return best;
}

/** The Lab prism's board position (Toolbox lab.ts `getPrismPlayerConnection`: distance from (43, 229)). */
export const LAB_PRISM = { x: 43, y: 229 } as const;

/** The game's board distance (Toolbox lab.ts `getDistance`: 0.9604339 x max + 0.397824735 x min of |dx|, |dy|). */
export const labDist = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return 0.9604339 * Math.max(dx, dy) + 0.397824735 * Math.min(dx, dy);
};

/**
 * Pixels a character in a tube must move to connect (Toolbox lab.ts: it connects when its distance to
 * the prism, or to a connected character, is under its own Line Width, strictly). 0 when it reaches.
 */
export function labGap(lab: LabState, index: number): number | null {
  const c = lab.characters.find((x) => x.index === index);
  if (!c?.uploaded || c.lineWidth <= 0) return null;
  const anchors = [LAB_PRISM, ...lab.characters.filter((x) => x.connected && x.index !== index)];
  const nearest = Math.min(...anchors.map((a) => labDist(a.x, a.y, c.x, c.y)));
  return nearest < c.lineWidth ? 0 : Math.floor(nearest - c.lineWidth) + 1;
}
