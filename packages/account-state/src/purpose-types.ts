// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 Purpose & Milestones' Account State fields (M4 TR-2, M1 TR-11). Read in purpose.ts only; declared
// in purpose-fields.ts. Optional so hand-built states need not spell them out; the adapter always sets
// each one, to a value or null (null = unknown, never "none").
//
// M4 also reads fields other modules own: `targetMonster` and `cards` (M8), `mapIndex` and
// `skillLevels` (M14), `nextPortal`, `classIndex` and `buildings.deathNote` (M2), `spend.stamps` (M7).

/** A level with its EXP toward the next one (Toolbox `skillsInfo.<skill>`). */
export interface LevelExp {
  level: number;
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
  classExp?: LevelExp | null;
  /** Gathering skills with EXP (Toolbox `skillsInfo`): mining, chopping, fishing, catching. */
  skills?: Record<string, LevelExp> | null;
  /** Set in the parse worker (Toolbox's functions); null unless `afkType === 'FIGHTING'` or when unknown. */
  fighting?: FightingRate | null;
  /** Equipped tools' item rawNames (Toolbox `tools`), 'Blank' removed. */
  tools?: string[] | null;
  /**
   * Raw `KillsLeft2Advance[mapIndex]` (`KLA_<i>`) on the current map, one value per door, unfloored
   * (negative past an open door). Door kills are the door's requirement minus this. null off a map.
   */
  portalKillsLeft?: number[] | null;
}

/** One world page of the Death Note (Toolbox `account.deathNote[<world index>]`). */
export interface DeathNotePage {
  mobs: { rawName: string; kills: number }[];
}

/** The Upgrade Vault's kill totals and row levels (Toolbox `account.upgradeVault`). */
export interface VaultKills {
  /**
   * Toolbox `vaultTotalKills` (the game's VaultKillzTOT), by slot. Read only through the generated map →
   * slot table `upgrade-vault.fact.kill-slots`, never by a hard-coded index.
   */
  killTotals: number[];
  /** Every row's Toolbox `name`, `level` and `maxLevel`, in Vault order. */
  rows: { name: string; level: number; maxLevel: number }[];
}

export interface PurposeAccountFields {
  /** Toolbox `account.deathNote`, keyed by world index ('0' = World 1); mini-bosses are left out. */
  deathNote?: Record<string, DeathNotePage> | null;
  vault?: VaultKills | null;
}
