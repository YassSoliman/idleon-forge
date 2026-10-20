// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-55: Poppy's pond (`account.poppy`, Toolbox `kangaroo`), widened from M6's unlock-and-pending
// read. Read in poppy.ts only (M1 TR-11). Every number is Toolbox's own (`parsers/world-2/kangaroo.ts`);
// the save indices are `accountOptions[267..305]`.

export interface PoppyUpgrade {
  /** Position in Toolbox `poppyBonuses` (0 Tasty Fishbait .. 11 Greatest Catch). */
  index: number;
  /** "Fisheroo Reset" (Toolbox's name with the underscores turned to spaces). */
  name: string;
  level: number;
  /** Fish for the next level (Toolbox `cost`, every cheapener applied). */
  cost: number;
  /** Open on this run: progress past its threshold (upgrade 0 always). */
  unlocked: boolean;
  /** Run progress it opens at (Toolbox `x3`). */
  opensAt: number;
}

export interface PoppyTarUpgrade {
  index: number;
  name: string;
  level: number;
  cost: number;
  unlocked: boolean;
}

export interface PoppyState {
  /** Fish caught, or an upgrade bought: Poppy's pond has been reached. */
  unlocked: boolean;
  /** Fish banked since the last visit (they convert when the pond is opened; Toolbox `pendingFish`). */
  pendingFish: number;
  /** Fish held (`accountOptions[267]`). */
  fish?: number;
  /** Held plus banked (Toolbox `totalFish`): what an upgrade's price is checked against. */
  totalFish?: number;
  /** Bluefin per minute (Toolbox `fishRate`). */
  fishPerMinute?: number;
  /** This run's progress (`accountOptions[280]`), which opens the upgrades. */
  progress?: number;
  /** Fisheroo Resets done (`accountOptions[274]`). */
  fisherooResets?: number;
  /** Megafish caught by Greatest Catch (`accountOptions[279]`). */
  megafish?: number;
  upgrades?: PoppyUpgrade[];
  /** The five reset spirals: points in each (`accountOptions[291..295]`) and their multiplier text. */
  spirals?: Array<{ level: number; multi: number }>;
  /** Tartar fish held plus banked; the Tar Pit's upgrades (open by Megafish). */
  tar?: { fish: number; upgrades: PoppyTarUpgrade[] };
  /** The six shiny fish: how many caught (`accountOptions[281..286]`) and the multiplier each gives. */
  shiny?: Array<{ caught: number; multi: number }>;
  /** Bonuses from Poppy (Toolbox `bonuses`, without Fish/minute): name and value. */
  bonuses?: Array<{ name: string; value: number; percent: boolean }>;
}
