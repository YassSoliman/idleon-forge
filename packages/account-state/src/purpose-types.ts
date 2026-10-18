// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 Purpose & Milestones' Account State fields (M4 TR-2, M1 TR-11). Read in purpose.ts only; declared
// in purpose-fields.ts. Optional so hand-built states need not spell them out; the adapter always sets
// each one, to a value or null (null = unknown, never "none").
//
// M4 also reads fields other modules own: `targetMonster` and `cards` (M8), `mapIndex` and
// `skillLevels` (M14), `nextPortal`, `classIndex` and `buildings.deathNote` (M2), `spend.stamps` (M7).

/** Class EXP toward the next class level (Toolbox `skillsInfo.character`), fighters only; the level is `CharacterState.level`. */
export interface ClassExp {
  exp: number;
  expReq: number;
}

/**
 * The one current-map fighting shape (M4 owns it, M4 TR-2). Toolbox `getMaxDamage(character)` on the
 * saved map, which is Toolbox's Stats page (#16). Every survivability and hit chance is % 0..100.
 */
export interface FightingRate {
  /** Toolbox `getMaxDamage().finalKillsPerHour`. */
  finalKillsPerHour: number;
  /** Unfloored, for ordering only. */
  killsPerHour: number;
  /** `monsters[target].ExpGiven × getClassExpMulti(character)`; null when either is unknown. */
  expPerKill: number | null;
  /** Toolbox `getClassExpMulti(character).value`, map-independent; for the EXP of other maps. null when unknown. */
  classExpMulti: number | null;
  /** % 0..100. */
  survivability: number;
  /** % 0..100. */
  hitChance: number;
}

export interface PurposeCharacterFields {
  /** Class level with its EXP (Toolbox `skillsInfo.character`, raw `Exp0_<i>[0]` / `ExpReq0_<i>[0]`). */
  classExp?: ClassExp | null;
  /** Set in the parse worker (Toolbox's functions), for a fighter only; null when unknown. */
  fighting?: FightingRate | null;
  /** Equipped gathering tools' item rawNames (Toolbox `tools`: pickaxe, hatchet, rod, net). */
  tools?: string[] | null;
  /**
   * Raw `KillsLeft2Advance[mapIndex]` (`KLA_<i>`) on the current map, one value per door, unfloored
   * (negative past an open door). Door kills are the door's requirement minus this. null off a map.
   */
  portalKillsLeft?: number[] | null;
}

/** The Upgrade Vault's kill totals and row levels (Toolbox `account.upgradeVault`). */
export interface VaultKills {
  /**
   * Toolbox `vaultTotalKills` (the game's VaultKillzTOT), by slot, floored. Read only through the
   * generated map → slot table `upgrade-vault.fact.kill-slots`, never by a hard-coded index.
   */
  killTotals: number[];
  /** The kill rows' levels by Toolbox `name` ("Dirty_Money"): only rows that grow per power of 10 of kills. */
  rowLevels: Record<string, number>;
}

export interface PurposeAccountFields {
  /**
   * Death Note kills by monster rawName, summed over characters (Toolbox `account.deathNote[world].mobs`,
   * mini-bosses left out), floored. Only monsters a character is AFK fighting are kept, so the history
   * stays under its cap (M1 TR-16).
   */
  deathNote?: Record<string, number> | null;
  /** null when the Vault can't be read; absent from a save made before the Vault existed: `killTotals` empty. */
  vault?: VaultKills | null;
}
