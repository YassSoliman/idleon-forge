// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The truth checks' plain-data types (M22). Everything here crosses the worker boundary by
// structuredClone, so no functions, Maps or class instances. Characters are named by slot only.

/** A talent preset slot as the game numbers it (`PlayerStuff_<i>[1]` is the live one). */
export type PresetSlot = 0 | 1;

/** One talent tab of one preset, read straight from the raw save. */
export interface RawTab {
  /** 1–5 in tab order (`ReturnClasses`), 6 is never used: the star tab is `RawPreset.star`. */
  tab: number;
  /** The game class id whose talents fill this tab. */
  classId: number;
  /** Talent id -> points bought, for the tab's 15 talents (`TalentOrder`); absent ids are 0. */
  levels: Record<number, number>;
  /** The game's own sum over the tab's 15 talents (what `TotalTalentPoints` subtracts). */
  spent: number;
  /**
   * A floor on the points left in this tab: the game's `TotalTalentPoints` with only the terms the raw
   * save holds directly (class level, skill levels, `CYTalentPoints`, achievements). Every term left
   * out is a bonus, never a cost, so the real value is at least this. Never below 0.
   */
  unspentAtLeast: number;
}

export interface RawPreset {
  slot: PresetSlot;
  /** Read from `SL_<i>` (live) or `SLpre_<i>` (other). */
  key: string;
  live: boolean;
  tabs: RawTab[];
  star: { spent: number; totalAtLeast: number; unspentAtLeast: number; levels: Record<number, number> };
}

export interface RawCharacter {
  index: number;
  classId: number;
  /** `CLASS_NAMES[classId]`, upper case; null for an id the table doesn't name. */
  className: string | null;
  level: number;
  selectedPreset: PresetSlot | null;
  /** Talent id -> max level (`SM_<i>`, character-wide). */
  maxLevels: Record<number, number>;
  /** Both presets; the other one is absent when the save has no `SLpre_<i>`. */
  presets: RawPreset[];
  /** `Money_<i>`. */
  coins: number | null;
  /** Bag item counts by raw item name (`InventoryOrder_<i>` + `ItemQTY_<i>`). */
  bag: Record<string, number>;
}

export interface RawFacts {
  characters: RawCharacter[];
  /** `MoneyBANK`. */
  bankCoins: number | null;
  /** `UpgVault`: each Upgrade Vault row's level, by row index; null when unreadable. */
  vaultLevels: number[] | null;
  /** Chest item counts by raw item name (`ChestOrder` + `ChestQuantity`). */
  chest: Record<string, number>;
  /** Raw keys that were missing or unreadable, e.g. `SLpre_3`. */
  unreadable: string[];
}

/** Where a value was read. `raw` is the save itself; the rest are what the app derived or shows. */
export type Surface =
  | 'raw'
  | 'state'
  | 'build'
  | 'build-row'
  | 'build-path'
  | 'character'
  | 'spend'
  /** A Goal's own number for the fact (the "points left behind on a preset" card). */
  | 'goal';

/** One fact and every value it has across the surfaces that carry it. */
export interface FactRow {
  /** Stable key, e.g. `c3.p1.t1.spent`, `c3.p1.talent.281`, `c3.level`, `bank.coins`. */
  key: string;
  /** "Slot 3 · preset 2 · tab 1 · points spent". Class and slot only, never a name. */
  label: string;
  values: Partial<Record<Surface, number | string | null>>;
  /** True when every surface that has a value agrees. */
  agree: boolean;
}

/** What a violation casts doubt on; the suppression step maps it to advice items. */
export interface ViolationScope {
  kind: 'talents' | 'character' | 'coins' | 'items' | 'spend-line' | 'vault-plan';
  /** CharacterState.index; null for account-wide facts (the bank, the chest). */
  character: number | null;
  slot?: PresetSlot;
  tab?: number;
  /** A specific advice item's key, when the rule knows it (a Build next point, a spend line). */
  itemKey?: string;
}

export interface Violation {
  /** The rule's id, e.g. `raw-agrees`, `next-not-at-target`. */
  rule: string;
  /** The fact key, or the advice item key, it is about. */
  key: string;
  /** Plain words, class and slot only: "Slot 6 Hunter · preset 1 · tab 1: the Build says no points waiting, the save has at least 70". */
  message: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  scope: ViolationScope;
  /** The values that disagree, by surface or name. */
  evidence: Record<string, number | string | null>;
  /** false: reported, but the advice stays (the line claims nothing false, it misses a known fact). */
  hold?: false;
}

/** One advice item replaced with "Can't be sure of this one right now". */
export interface Suppression {
  /** "build-next", "build-status", "goal", "spend-line". */
  kind: string;
  /** The item's key (BuildNextPoint.key, Goal key, SpendLine key), with its character when it has one. */
  key: string;
  character: number | null;
  /** The rule ids that caused it. */
  rules: string[];
}

export interface TruthReport {
  /** The parse clock (epoch ms). */
  asOf: number;
  /** Rule ids that ran, in order. */
  rules: string[];
  violations: Violation[];
  suppressed: Suppression[];
  facts: FactRow[];
  raw: RawFacts | null;
  /** Set when the checks themselves threw; nothing is suppressed then. */
  error: string | null;
  /** How long the checks took in the worker (ms), for the budget. */
  ms: number;
}
