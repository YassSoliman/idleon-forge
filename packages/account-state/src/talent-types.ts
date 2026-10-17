// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The M9 Builds fields (M9 TR-3, TR-4): both talent presets of every character, their attack bars,
// and the talent reset items the account owns. Read in talents.ts; sources in talent-fields.ts.

export interface TalentLevel {
  /** Toolbox talentId / skillIndex. */
  id: number;
  /** Points bought (`baseLevel`; `level` for star talents, which have no baseLevel). */
  base: number;
  /** Max level in this save (`maxLevel`), including book and bubble raises. */
  max: number;
}

export interface PresetTalents {
  /** Tabs 1–5 in class order (5 only for master classes); from Toolbox `talents` (active) or `talentPreset.talents` (other). */
  tabs: { tab: 1 | 2 | 3 | 4 | 5; tabName: string; talents: TalentLevel[] }[];
  /** Star tab levels, from `flatStarTalents` / `talentPreset.flatStarTalents`. */
  star: TalentLevel[];
  /**
   * Talent ids on the attack bar, rows 0–1, "Null" dropped, in bar order. Read from the raw save's
   * `AttackLoadout_<i>` (active) and `AttackLoadoutpre_<i>` (other; Toolbox does not parse it). Null when unreadable.
   */
  attackBar: number[] | null;
}

export interface CharacterTalents {
  classIndex: number;
  /** `selectedTalentPreset` (0 or 1). */
  selectedPreset: 0 | 1;
  active: PresetTalents;
  /** Null below class Lv 15 or when the save has no preset data. */
  other: PresetTalents | null;
}

/** Talent Point Reset Potions (`ResetCompleted`) and Fragments (`ResetFrag`), summed over storage and inventories. */
export interface ResetItems {
  potions: number;
  fragments: number;
}

export interface TalentCharacterFields {
  // ---- M9 Builds (M9 TR-3). Set by the adapter; optional only so hand-built states stay valid. ----
  /** Both presets; null when the talent keys are missing or unreadable (see diagnostics.unknownFields). */
  talents?: CharacterTalents | null;
}

export interface TalentAccountFields {
  // ---- M9 Builds (M9 TR-4). Set by the adapter; optional only so hand-built states stay valid. ----
  /** null when the storage section failed. */
  resetItems?: ResetItems | null;
}
