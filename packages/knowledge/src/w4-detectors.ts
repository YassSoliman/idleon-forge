// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Shared by the World 4 Cooking Detectors (M26 FR-14), exported through helpers.ts.
import type { CookingState, Meal } from '@idleon-forge/account-state';

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
