// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 1: the World 4 core pages' pictures (`EngineResult.slotPictures`), built in w4.ts from the
// Account State. Every word and number is computed in the worker; the pages lay them out. They add no
// advice: the page's answer is its System's first Next Action (the Check entries), as on every page.

/** One Rift level in the "Coming up" strip. */
export interface RiftLevelView {
  /** The level as the game shows it (`riftLabel`). */
  shown: number;
  /** `riftText()` of it, the words a player reads. */
  label: string;
  /** "AFK kills", "Score", "On 4 characters", "Played", "Done". */
  kind: string;
  /** The task in words ("Defeat 500 monsters within 5 min"). */
  task: string;
  /** The game's monster face sprite ("Mface11"). */
  icon: string;
  /** The elite a score task needs ("Divine Knight"), with whether the account has one. */
  gate: { elite: string; owned: boolean } | null;
  /** The bonus reaching this level opens ("Skill Mastery"), else null. */
  bonus: string | null;
}

export interface RiftBonusView {
  /** "Skill Mastery". */
  name: string;
  /** The game's bonus icon index (`Rift_<n>`). */
  icon: number;
  /** The level that opens it, as the game shows it: `riftLabel` of the `Rift[0]` it needs. */
  shown: number;
  label: string;
  unlocked: boolean;
  /** The next one to open. */
  next: boolean;
  /** What it does, in one line. */
  what: string;
  /** The System page it feeds, or null, and that page's name ("Trapping"). */
  system: string | null;
  page: string | null;
  /** A World 5+ bonus: drawn grey, "later". */
  later: boolean;
}

export interface RiftPicture {
  systemId: 'rift';
  kind: 'rift';
  unlocked: boolean;
  /** The level being played, as the game shows it, and its words. */
  shown: number;
  label: string;
  /** Levels done (`Rift[0]`) and the last level (65). */
  done: number;
  max: number;
  /** This level's task; null past the last level. */
  current:
    | (RiftLevelView & {
        progress: number;
        quota: number;
        complete: boolean;
        /** Characters counted toward a per-character task. */
        counted: number;
      })
    | null;
  /** Characters AFK on The Rift now (save slots). */
  afk: number[];
  /** The next bonus and how many levels to it; null once all are open. */
  nextBonus: { name: string; shown: number; label: string; levelsToGo: number } | null;
  upcoming: RiftLevelView[];
  bonuses: RiftBonusView[];
  /** The Rift Ripper's items while locked: held (chest and bags) against what the quest takes. */
  quest: { rawName: string; name: string; have: number; need: number }[];
}

/** One elite at Eliteus: who holds it, and who is on the way. */
export interface EliteView {
  /** Toolbox class name ("Divine_Knight") and its words. */
  elite: string;
  name: string;
  /** The subclass it comes from ("Squire"). */
  from: string;
  /** Characters who hold it or a class it promotes to (save slots). */
  holders: number[];
  /** Characters on its subclass: the Gang (kills of 10) or the pick. */
  onTheWay: { index: number; step: 'gang' | 'pick'; kills: number }[];
  /** The Rift score levels it plays, in the game's numbers (`riftText`). */
  riftGates: string[];
}

export interface ElitePicture {
  systemId: 'elite-classes';
  kind: 'elite';
  elites: EliteView[];
  /** Characters still to promote, and characters done, over the six lines. */
  pending: number;
  done: number;
}

export type W4Picture = RiftPicture | ElitePicture;
