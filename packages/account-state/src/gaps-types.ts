// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 2, the W2/W3 gaps: the Account State blocks the wave adds, one file so its PRs touch only
// their own lines. Read in gaps.ts (and the per-System readers it calls) only (M1 TR-11).

/** M26 FR-21b: one Salt Lick upgrade (Toolbox `account.saltLick[i]`, the game's `SaltLick` array). */
export interface SaltLickUpgrade {
  /** Position in the game's list (0..10); the spec's "#6" is index 5. */
  index: number;
  /** The salt it costs ("Refinery3"). */
  salt: string;
  level: number;
  maxLevel: number;
  /** Shown by the Salt Lick building: index < its level (`TowerInfo[3]`). */
  unlocked: boolean;
  /** The bonus per level (`baseBonus`) and what the level gives now (Toolbox `getSaltLickBonus`). */
  perLevel: number;
  bonus: number;
}

export interface SaltLickState {
  /** The Salt Lick building's level (`TowerInfo[3]`): how many upgrades it shows. */
  buildingLevel: number;
  upgrades: SaltLickUpgrade[];
  /**
   * Game client, not Toolbox (X4): the liquid regen percent the game's `LiquidHRrate` adds for Salt Lick
   * #6 (`SaltLick(5)`, +1% per level on every liquid, Bleach or not). Toolbox models only its capacity half.
   */
  liquidRatePct: number;
}

/** Optional so hand-built states need not spell them out; the adapter sets each, to a value or null. */
export interface GapsAccountFields {
  /** M26 FR-21b: the Salt Lick's upgrades and its liquid-rate term. */
  saltLick?: SaltLickState | null;
}
