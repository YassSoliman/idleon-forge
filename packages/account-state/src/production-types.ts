// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C (docs/specs/M26-crafting-guidance.md section 6, Wave C): the per-character anvil reads the
// Production Plan needs. Kept in one block so other modules' additions don't collide with them. Read in
// production.ts only (M1 TR-11).

/** The terms of one character's anvil speed (Toolbox `getPlayerAnvil`, `getAnvilSpeed`'s arguments). */
export interface AnvilSpeedParts {
  /** Anvil Zoomer stamp (`StampB3`) bonus, added to 2 x speed points inside one factor. */
  stamp: number;
  speedPoints: number;
  /** Blacksmith Box (Post Office), bonus 1. */
  box: number;
  /** Anvil Statue (statue 11). */
  statue: number;
  /** Upgrade Vault row 24. */
  vault: number;
  /** Hammer Hammer bonus as Toolbox counts it (equipped, or through companion bonus 4). */
  hammerHammer: number;
  agility: number;
  /** "Speed in Town" star signs. */
  starSign: number;
  /** Broken Time talent. */
  brokenTime: number;
}

export interface AnvilProduction {
  /**
   * One entry per hammer, in save order (raw `AnvilPAselect_i`, never Toolbox's `anvilSelected`, which
   * `getPlayerAnvil` sorts in place, V33): the product index it works on, or -1 for a free hammer. A
   * bare number in the save (single-hammer saves) reads as one hammer.
   */
  hammers: number[];
  /** On-anvil stock of products 0-10 (Toolbox `anvilProduction[p][0]`, V-C1). */
  stock: number[];
  /** Toolbox `stats.anvilCapacity`: the cap of every product on this anvil. */
  capacity: number | null;
  /** The speed terms; null when Toolbox could not compute them. */
  speedParts: AnvilSpeedParts | null;
  /** Anvil speed per hour with the Anvil Zoomer stamp one level higher (Toolbox `getAnvilSpeed`). */
  speedStampNext: number | null;
  /** Hammer Hammer counts without being equipped (companion bonus 4). */
  hammerHammerByCompanion: boolean;
  /** Toolbox `calcAnvilExp` (percent) with this character's Exp points; weighs characters (US-C6). */
  expBonus: number | null;
}

export interface ProductionCharacterFields {
  /** M26 F-C: the anvil's hammers, stock and speed terms; null when the save doesn't hold them. */
  anvil?: AnvilProduction | null;
}
