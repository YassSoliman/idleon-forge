// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-11: the Rift's Account State block (`account.rift`). Read in rift.ts only (M1 TR-11). Levels are
// stored as the save does, `Rift[0]` = levels completed; anything a player reads goes through the
// engine's `riftLabel()` (FR-4), which adds one. Character names never enter it: characters are save slots.

/**
 * What a Rift level's task needs (V1, game client `RiftStuff[0]/[4]/[5]` and Toolbox `riftInfo`):
 * `afk` AFK kills on The Rift (tasks 1, 10, 11); `score` a best score on one elite class (Orb, Pirate Flag,
 * Wormhole: tasks 6-8); `characters` the same feat on N different characters (tasks 3-5, 14, 15);
 * `active` a played feat (500 kills in 5 minutes, Rift Tears, skull points: tasks 0, 2, 12, 13);
 * `end` the "you cannot progress further" rows past the last level.
 */
export type RiftTaskKind = 'afk' | 'score' | 'characters' | 'active' | 'end';

export interface RiftTask {
  /** The `Rift[0]` this task is played at. */
  level: number;
  kind: RiftTaskKind;
  /** The number to reach (kills, score, characters, skull points, tears); null on `end`. */
  quota: number | null;
  /** The elite class a `score` task is played on (Toolbox class name, "Divine_Knight"); else null. */
  elite: string | null;
  /** Toolbox `riftInfo[level].task` with its progress clause cut ("DEFEAT_500_MONSTERS_WITHIN_5_MIN"). */
  text: string;
  /** Toolbox `riftInfo[level].monsterName` ("Mr_Blueberry"). */
  monster: string;
  /** Toolbox `riftInfo[level].icon`, the monster's face sprite ("Mface11"). */
  icon: string;
}

export interface RiftBonus {
  /** Toolbox `riftBonus` ("Skill_Mastery"). */
  name: string;
  /** The `Rift[0]` that unlocks it (its `riftInfo` index: 5, 10, ... 60). */
  level: number;
  unlocked: boolean;
}

export interface RiftQuestItem {
  rawName: string;
  /** Toolbox item name ("Purple_Mush_Cap"). */
  name: string;
  amount: number;
}

export interface RiftState {
  /** The Rift Ripper's quest "Entering The Rift..." is done on a character, or a level is completed. */
  unlocked: boolean;
  /** What the Rift Ripper's quest asks for (Toolbox `quests`, `Rift_Ripper1.itemReq`); the quest consumes them. */
  questItems: RiftQuestItem[];
  /** `Rift[0]`: levels completed, 0..65. */
  level: number;
  /** `Rift[1]`: progress on this level's task. */
  progress: number;
  /**
   * The task's quota is met (game `RiftStuff("RiftCompleted")`: `Rift[1] >= quota`). The level only
   * advances when a character walks through the portal in The Rift (V1); progress past the quota is lost.
   */
  complete: boolean;
  /** Characters already counted toward a per-character task (`Rift[2]`, a comma list; only the count is kept). */
  countedChars: number;
  /** Save slots of the characters whose AFK target is The Rift (raw `AFKtarget_i` = `riftAll`). */
  afkOnRift: number[];
  /** This level's task; null past the table. */
  task: RiftTask | null;
  /** The next ten levels' tasks, in order (the "Coming up" strip). */
  upcoming: RiftTask[];
  /** The twelve bonuses, by unlock level (the placeholder "Rift Guy" is left out). */
  bonuses: RiftBonus[];
  /** Save slots of characters on each elite class line a score task needs, by elite ("Divine_Knight"). */
  elites: Record<string, number[]>;
}

/** Optional so states built by hand need not spell it out; the adapter always sets it, to a value or null. */
export interface RiftAccountFields {
  rift?: RiftState | null;
}
