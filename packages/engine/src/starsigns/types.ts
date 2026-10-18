// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16's view model on EngineResult.starSigns (the Signs tab and the Star Chart account section). Plain,
// structured-cloneable data: indices only, never a name (M16 FR-24). Every string is already rendered.
import type { SourceRef } from '../result';

/** One character's signs (FR-16, FR-18), for its Signs tab. */
export interface CharacterSigns {
  index: number;
  /** "Fighting", "Mining"; null when there is no sign advice for its activity. */
  activity: string | null;
  slots: number;
  /** The signs it wears now, displayed ("The Fuzzy Dice"). */
  worn: string[];
  /** The signs to wear for its AFK Target, from unlocked signs (and this run's unlock), displayed. */
  recommended: string[];
  /** While the account has 1 slot: what to wear once Chronus Cosmos is unlocked. */
  afterCosmos: string[] | null;
  /** "Pie Seas once unlocked", or null. */
  onceUnlocked: string | null;
  matches: boolean;
  /** Whether it can reach the Telescope now (F-e). null when its route can't be read. */
  canChange: boolean | null;
  /** Kills left on its tree doors when it can't (F-f); null otherwise. */
  killsToTelescope: number | null;
  /** The detail line ("Squire Lv 51 (Mining): wear The Fuzzy Dice …"), as in the Goal's details. */
  line: string;
}

/** One constellation to clear (FR-7), shown in the Star Chart section. */
export interface NextConstellation {
  name: string;
  /** "Winding Willows, AFK 2 h on 2 characters". */
  text: string;
  points: number;
  effortSeconds: number;
  /** A Goal on the Now screen this run (within the cap). */
  shown: boolean;
}

export interface StarSignsView {
  /** Unspent Star Chart Points. */
  points: number | null;
  /** Unlocked chart nodes (the four starters count) and the 24-node Hydron gate. */
  unlockedNodes: number;
  hydronAt: number;
  /** Sign slots per character (F-d). */
  slots: number;
  /** Whether the Telescope quest is handed in (constellations work account-wide, F-k). */
  questDone: boolean;
  /** The milestone line ("21 points ready, 19 needed for Chronus Cosmos …"); null past the covered legs. */
  milestone: string | null;
  /** "Bank your points: …" or the unlock action, or null. */
  plan: string | null;
  next: NextConstellation[];
  /** "Later" lines (FR-11) and the "If you have time" challenge, rendered. */
  later: string[];
  /** "Next character: pick The Fuzzy Dice when you create it", or null. */
  nextCharacter: string | null;
  characters: CharacterSigns[];
  sources: SourceRef[];
}
