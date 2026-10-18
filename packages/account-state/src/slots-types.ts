// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 Skills, Parallel Slots and the Daily & Weekly Checklist: its Account State fields
// (docs/specs/M20-skills-parallel-slots.md TR-2, M1 TR-11). Read in slots.ts only; declared in
// slots-fields.ts. Optional so hand-built states need not spell them out; the adapter always sets each
// one, to a value or null (null = unknown, never "none").
//
// Privacy (TR-2): Toolbox's player cogs are named after characters ("Player_<name>"); the adapter maps
// them to character indices inside the worker and keeps indices only. The guild name and members, the
// tournament player name and leaderboard are never read.

/** The 9 W1–W3 skills, in game order (Toolbox `skillsInfo` keys). */
export const SKILL_IDS = [
  'mining',
  'smithing',
  'chopping',
  'fishing',
  'alchemy',
  'catching',
  'trapping',
  'construction',
  'worship',
] as const;
export type SkillId = (typeof SKILL_IDS)[number];

export interface SkillState {
  level: number;
  exp: number;
  expReq: number;
}

/** Where a character's player cog sits (F-d; Toolbox `SPARE_START_INDEX` 96). */
export interface CogPlace {
  /** 'board' squares 0–95, 'shelf' save slots 96–107, 'inventory' 108–227. */
  kind: 'board' | 'shelf' | 'inventory';
  slot: number;
}

export interface CharacterSlots {
  /** null when the character has no player cog (or the construction section failed). */
  cogPlace: CogPlace | null;
  /** Toolbox `character.constructionSpeed`: the build rate per hour the character adds on the board. */
  constructionSpeed: number | null;
  /** Toolbox `character.constructionExpPerHour`. */
  constructionExpPerHour: number | null;
  /** `tools[5].rawName` (a WORSHIP_SKULL), null when the slot is Blank. */
  skull: string | null;
  /** `tools[4].rawName` (a TRAP_BOX_SET), null when the slot is Blank. */
  trapSet: string | null;
  /** `questComplete.Lord_of_the_Hunt1 === 1`; null when the quest data is missing. */
  trappingStarted: boolean | null;
  /** `alchemy.activities[i].activity` (F-g): 0–3 the bubble cauldrons, 4–7 the liquids, ≥ 100 a sigil, −1 none. */
  cauldron: number | null;
}

/** A Cog Board square in game order (12 columns × 8 rows). */
export type CogSquare = 'locked' | 'open' | 'cog' | 'character';

export interface CogBoardState {
  /** 96 squares: 'locked' until its flag is finished (`currentAmount >= requiredAmount`). */
  squares: CogSquare[];
  /** Player cogs on the board or shelf or in the inventory, by save slot, mapped to the character index. */
  characterAt: Array<{ square: number; index: number }>;
  /** Toolbox `construction.totalBuildRate`, `totalExpRate` and `totalFlaggyRate`. */
  buildRate: number;
  expRate: number;
  flaggyRate: number;
}

export interface LiquidState {
  index: 0 | 1 | 2 | 3;
  /** Open at the account's highest Alchemy level 1 / 20 / 35 / 80 (F-g). */
  unlocked: boolean;
  current: number;
  max: number;
}

export type KillroyClass = 'Beginner' | 'Warrior' | 'Archer' | 'Mage';

export interface KillroyState {
  /** F-c: 1 once W2 is reached, 2 once World 3 is finished, 3 with the Skull Shop roll (OLA[227]). */
  roomsOpen: 1 | 2 | 3;
  /** OLA[113], a per-digit code: room r is done when the code's digits contain r (F-c). */
  doneCode: number;
  /** Room classes this account week and the next (Toolbox `getKillRoyClasses`, ignoring skips). */
  roomClasses: [KillroyClass[], KillroyClass[]];
  /** OLA[105]. */
  skulls: number;
  /** OLA[417]: Arcade ball packs bought this week (50 a week). */
  arcadePacksBought: number;
}

export interface RandomEventsState {
  /** OLA[137] === 1: today's Random Event is done. */
  doneToday: boolean;
  /** Toolbox `getRandomEvents` from the save's hour, at most 48 h ahead. */
  schedule: Array<{ at: number; map: string; event: string; world: number }>;
}

export interface PetTournamentState {
  /** OLA[511]: registering sets it to day + 1. */
  registeredThroughDay: number;
  /** Toolbox `getCurrentTournamentDay`: the newer of OLA[496] and the global doc's T. */
  day: number;
  /** The global tournament doc's `C` flag (M: read as "registration closed"). */
  registrationClosed: boolean;
  petsOwned: number;
}

export interface TaskBoardDaily {
  world: 1 | 2 | 3;
  /** That world's task board is open: Grasslands Gary, Desert Davey's quest, Iceland Irwin's quest (V7). */
  unlocked: boolean;
  /** The 9th task's name (Toolbox `tasksDescriptions[w][8].name`). */
  taskName: string;
  /** `Tasks[1][w][8] >= 1` (V4, N.js: the daily task counts for the guild only when it is 1). */
  done: boolean;
}

export interface GuildTasksState {
  /** The account is in a guild (Toolbox `guild.id`). */
  member: boolean;
  daily: Array<{ met: boolean }>;
  weekly: Array<{ met: boolean }>;
}

export interface WorshipTotem {
  /** Toolbox totem name ("Goblin_Gorefest") and its map's display name. */
  name: string;
  map: string;
  levelReq: number;
  maxWave: number;
  /** Toolbox `expReward` before the worshipper's multi. */
  expReward: number;
}

export interface SlotsAccountFields {
  cogBoard?: CogBoardState | null;
  liquids?: LiquidState[] | null;
  resets?: null | {
    /** OLA[39]: days from the next daily reset to the account's weekly reset. */
    weeklyOffsetDays: number | null;
    /** OLA[191]: the server week of the save's Weekly Battle state. */
    serverWeekOfSave: number | null;
  };
  killroy?: KillroyState | null;
  /** OLA[189] best difficulty beaten this server week, OLA[190] the daily raid reset is used. */
  weeklyBattle?: null | { bestDifficulty: number; raidResetUsedToday: boolean };
  ballot?: null | {
    /** OLA[309]: the ballot week the account last voted in. */
    votedWeek: number;
    /** The leading bonus (`voteBallot.selectedBonus`), in words; null when none. */
    winner: null | { index: number; text: string };
  };
  randomEvents?: RandomEventsState | null;
  petTournament?: PetTournamentState | null;
  taskBoardDailies?: TaskBoardDaily[] | null;
  guildTasks?: GuildTasksState | null;
  totems?: WorshipTotem[] | null;
}

export interface SlotsCharacterFields {
  skills?: Partial<Record<SkillId, SkillState>> | null;
  slots?: CharacterSlots | null;
}
