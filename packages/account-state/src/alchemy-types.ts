// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M19 Alchemy (docs/specs/M19-alchemy.md TR-2): the Account State fields the Bubble Plan, the vial order,
// the Pay 2 Win order and the Liquid Shop read. Levels and counters only: bubble costs are never stored
// (TR-1), they come from Toolbox's own cost function at engine time. Read in alchemy.ts only (M1 TR-11).
// M19 also reads M6's `account.alchemy` (cauldrons, unlocked counts, vial attempts), M20's
// `account.liquids`, M8's `account.storageItems` and M7's `account.spend.p2w`.
import type { CauldronId } from './unspent-types';

export interface AlchemyPlanState {
  /**
   * Every bubble's level, by cauldron and bubble index (Toolbox `alchemy.bubbles[c][i].level`). Levels only,
   * as arrays to keep the save history small (M1 TR-16): names, curves and materials are game data in
   * `alchemy-bubbles.fact.curves`, and the rawName is `aUpgrades<letter><index>`.
   */
  bubbleLevels: Record<CauldronId, number[]>;
  /** The 42 W1-W3 vials' levels by catalogue index (0 = not unlocked yet); the rest is `alchemy-vials.fact.catalogue`. */
  vialLevels: number[];
  /** Today's Liquid Shop purchases by shop index (Toolbox `alchemy.multiplierArray`, raw CauldronInfo[10]). */
  liquidShopBought: number[];
  /** Toolbox `alchemy.p2w.player`: the Player Alchemy Speed and Extra EXP levels. */
  p2wPlayer: { speedLv: number; extraExpLv: number };
  /** The highest Alchemy level of any character (caps the Player upgrades, wiki Alchemy, Pay 2 Win). */
  bestAlchemyLevel: number;
}

export interface AlchemyAccountFields {
  /** M19 TR-2; null when the alchemy section or a character's Alchemy level can't be read. */
  alchemyPlan?: AlchemyPlanState | null;
}
