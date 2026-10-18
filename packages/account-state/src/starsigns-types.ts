// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 Star Signs and constellations' Account State fields (docs/specs/M16-star-signs.md TR-2, M1 TR-11).
// Read in starsigns.ts only; declared in starsigns-fields.ts. Optional so hand-built states need not spell
// them out; the adapter always sets each one, to a value or null (null = unknown, never "none").
//
// Compact on purpose (M1 TR-16's history cap): signs are the game's StarSigns ids (Toolbox `starSigns`
// catalog order; `star-signs.fact.chart` names them), constellations their `StarSignProg` index. The raw
// letters string of a constellation is never kept (TR-2, TR-8): only its length and the decoded slots.

/** An unclaimed constellation with progress (Toolbox `account.constellations[]`, game `StarSignProg`). */
export interface ConstellationProgress {
  /** `StarSignProg` index (Toolbox `constellations[].rawIndex`). */
  rawIndex: number;
  /** `completedChars.length`, the game's progress count (letters for empty slots count too, US-6). */
  letterCount: number;
  /** Character slots decoded from the letters: '_' = 0, 'a' = 1, 'b' = 2, … (M16 V4). Unknown letters dropped. */
  recorded: number[];
}

export interface StarSignsState {
  /** Unlocked signs, as StarSigns ids (Toolbox `account.starSigns[i].unlocked`), ascending. */
  unlocked: number[];
  /** How many unlocked signs count as Infinite Stars (Toolbox `isInfiniteStar`, W4+). */
  infiniteCount: number;
  /** Unspent Star Chart Points: raw `OptLacc[40]` (M16 F-a); null when OptLacc can't be read. */
  pointsUnspent: number | null;
  /** The Telescope quest "I'm Seeing Stars!" (Telescope1) is completed on any character; null when no quest data. */
  telescopeQuestDone: boolean | null;
  /** Claimed constellations (points paid), as `StarSignProg` indices, ascending. */
  claimed: number[];
  /** Unclaimed constellations with at least one letter. One with no entry here and not claimed has no progress. */
  progress: ConstellationProgress[];
}

export interface StarSignsAccountFields {
  starSigns?: StarSignsState | null;
}

export interface StarSignsCharacterFields {
  /** The signs this character wears, as StarSigns ids (Toolbox `characters[].starSigns`, empty slots dropped). */
  starSigns?: number[] | null;
  /**
   * Kills left on the three tree doors to Where the Branches End, in TELESCOPE_ROUTE order (M16 F-f): raw
   * `KillsLeft2Advance[map][door]` floored at 0 (0 = open); null for a map the character has never been on
   * (then the door's full requirement is left; the engine reads it from `maps.fact.maps`).
   */
  telescopeRoute?: (number | null)[] | null;
}
