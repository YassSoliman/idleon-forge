// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The M21 Redesign fields (M21 TR-3, FR-F10): door kills on every map, statue levels, and (in
// talent-types.ts) each preset's star talent point total. Read in redesign.ts; sources in
// redesign-fields.ts. Nothing here is a name.

/** One statue (Toolbox `account.statues`, raw `StuG`, raw `StatueLevels_<i>`). */
export interface StatueState {
  /** Toolbox `statueIndex` (the game's statue slot). */
  index: number;
  /** Toolbox's statue name, e.g. "Power_Statue". */
  name: string;
  /** The highest level any character has (Toolbox's `level`). */
  level: number;
  /** Raw `StuG[index]`: 0 none, 1 Gold, 2 Onyx, 3 Zenith. */
  grade: number;
  /**
   * Each character's own level, in `AccountState.characters` order (raw `StatueLevels_<i>[index][0]`,
   * the per-character table Toolbox takes its highest level from). null when any character's table is
   * missing or unreadable.
   */
  byCharacter: number[] | null;
}

export interface RedesignCharacterFields {
  // ---- M21 Redesign (M21 TR-3). Set by the adapter; optional only so hand-built states stay valid. ----
  /**
   * Raw `KillsLeft2Advance` (`KLA_<i>`) for every map, indexed by map index (a dense array; a map with
   * no row reads []): one value per door, in door order, ceiled like M4's `portalKillsLeft` and clamped
   * at 0 (a cleared door reads 0). Door kills done = requirement - value. null when the key is missing
   * or unparseable.
   */
  doorKillsLeft?: Record<number, number[]> | null;
}

export interface RedesignAccountFields {
  // ---- M21 Redesign (M21 TR-3). Set by the adapter; optional only so hand-built states stay valid. ----
  /** Every named statue, in Toolbox order; null when the statues section failed or `StuG` is missing. */
  statues?: StatueState[] | null;
}
