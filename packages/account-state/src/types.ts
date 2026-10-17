// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Account State (see GLOSSARY.md): a normalized snapshot of one player's account at the moment of
// a cloud save. This first slice is deliberately minimal; it grows as the advice engine needs more.
// String identifiers (class, map, AFK target, food) are Toolbox's, e.g. "Siege_Breaker"; use
// `humanize()` to display them.

/** The AFK types Toolbox's monster data uses, plus its two "no rate" values. */
export const KNOWN_AFK_TYPES = [
  'FIGHTING',
  'MINING',
  'CHOPPIN',
  'FISHING',
  'CATCHING',
  'COOKING',
  'LABORATORY',
  'DIVINITY',
  'SPELUNKING',
  'Nothing',
  'Paying_Respect',
] as const;
export type KnownAfkType = (typeof KNOWN_AFK_TYPES)[number];

export interface FoodStack {
  /** Toolbox item name, e.g. "Golden_Jam". */
  item: string;
  amount: number;
}

export interface CharacterState {
  /** Position in the save (0-based), stable across saves. */
  index: number;
  name: string;
  /** Toolbox class name, e.g. "Blood_Berserker". */
  class: string;
  level: number;
  /** The AFK type of the character's AFK Target; usually a `KnownAfkType`, kept open for new types. */
  afkType: KnownAfkType | (string & {});
  /** What the character fights or gathers (monster or resource name); null when it has no AFK Target. */
  afkTarget: string | null;
  /** Toolbox map name, e.g. "Spirit_Village". */
  currentMap: string | null;
  /** Equipped food, non-empty slots only, in slot order. */
  foodStacks: FoodStack[];
  /** Seconds between this character's last save and `AccountState.asOf` (never negative). */
  secondsSinceLastSave: number | null;
}

export interface AccountSummary {
  /** The world the account is working on (1-based): one past the highest finished world (Toolbox's rule). */
  currentWorld: number | null;
  /** Worlds whose exit has been used (a character met the gatekeeper past it), ascending. */
  finishedWorlds: number[];
  /** When the account last cloud-saved (epoch ms), from the save's own clock. */
  lastCloudSave: number | null;
  /** Seconds between `lastCloudSave` and `AccountState.asOf` (never negative). */
  secondsSinceLastSave: number | null;
  gameVersion: {
    /** The game server's build number (`_vars.GameVERSION`), when the side read was available. */
    serverBuild: number | null;
    /** The save format version (`CSver`). */
    saveVersion: number | null;
    /** The game version the parser pin targets, e.g. "2.3.540". */
    parserTarget: string;
  };
}

export interface AccountState {
  /** The `now` the save was parsed at (epoch ms). All "seconds since" fields are relative to it. */
  asOf: number;
  account: AccountSummary;
  characters: CharacterState[];
  /** Non-fatal problems: parser sections that fell back, characters skipped for lack of data. */
  warnings: string[];
}
