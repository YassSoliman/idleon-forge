// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 4: the World 1 core System pages' pictures (w1.ts). Read-only facts, advice-free.

/** One of Orion's 9 upgrades. */
export interface OwlUpgradeView {
  index: number;
  /** "Feather Generation". */
  name: string;
  level: number;
  /** "5.3e54". */
  cost: string;
  /** "750K": the feathers this run that open it. */
  unlockAt: string;
  unlocked: boolean;
  /** Open and the feathers held pay for its next level. */
  affordable: boolean;
}

export interface OwlBonusView {
  /** "Drop Rate". */
  name: string;
  /** "+4,504.5%", "+45,045". */
  value: string;
  /** The Bonuses of Orion level that next raises it. */
  nextAt: number;
}

export interface OwlMegaView {
  n: number;
  /** "feathers x10". */
  words: string;
  owned: boolean;
}

export interface OwlPicture {
  systemId: 'owl';
  kind: 'owl';
  /** False until Orion has made a feather. */
  started: boolean;
  feathers: string;
  /** Feathers a second, "2.1e47". */
  rate: string;
  /** Feathers made this run (the unlock gauge). */
  progress: string;
  megafeathers: number;
  restarts: number;
  shiny: number;
  bonusesLevel: number;
  /** Orion's bonus multiplier, "x7". */
  multiplier: string;
  /** The next locked upgrade and what it needs, or null when all 9 are open. */
  nextUnlock: { name: string; at: string } | null;
  /** What the next Bonuses of Orion level adds ("+10 Base DMG"). */
  nextBonus: string | null;
  upgrades: OwlUpgradeView[];
  bonuses: OwlBonusView[];
  /** The 10 named Megafeathers. */
  megas: OwlMegaView[];
}

export type W1Picture = OwlPicture;
