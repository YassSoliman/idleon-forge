// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-16: the Tome's Account State block (`account.tome`). Read in tome.ts only (M1 TR-11). Metrics are
// keyed by name (Toolbox `tomeData`), never by position: the list grew from 122 to 124 rows between pins.

export type TomeTier = 'bronze' | 'silver' | 'gold' | 'blue';

export interface TomeMetric {
  /** Toolbox `tomeData` name, "Account_LV". */
  name: string;
  /** The game's display order (`ninjaExtraInfo[32]`), which also sets the Account LV it counts from. */
  order: number;
  /** Account LV from which it counts (game `TomeLvReq`: 350 + 40 per row, more past rows 35/60/80/100). */
  lvReq: number;
  /** The quantity the game scores (Toolbox `calcTomeQuantity`). */
  quantity: number;
  /** PTS the quantity is worth (whether or not it counts yet), and the most it can be worth. */
  points: number;
  maxPoints: number;
  tier: TomeTier;
  /** The quantity each colour needs (Toolbox `requiredQuantities`); for a lower-is-better row, the most allowed. */
  needs: { silver: number | null; gold: number | null; blue: number | null };
  /** Lower is better (curve 3: kill times, crystal odds). */
  lowerIsBetter: boolean;
}

export interface TomeState {
  /** PTS that count now (Toolbox `totalPoints`: only metrics at or under the Account LV). */
  totalPoints: number;
  accountLevel: number;
  metrics: TomeMetric[];
  /** Toolbox `getTomeBonus`: +% damage, +% skill efficiency, +% drop rate (the latter two need the pages). */
  damagePct: number;
  skillEffPct: number;
  dropRatePct: number;
  /** The Blue (Skill Efficiency past 4,000 PTS) and Red (Drop Rate past 8,000 PTS) pages, `accountOptions[196/197]`. */
  pages: { blue: boolean; red: boolean };
  /** This month's rank tier (Toolbox `top`, 0 = Top 0.1% .. 11; -1 below every tier) and nametags to claim. */
  rank: number;
  nametags: { available: number; claimed: number };
}

export interface TomeAccountFields {
  tome?: TomeState | null;
}
