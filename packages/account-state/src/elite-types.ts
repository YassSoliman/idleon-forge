// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-17: each character's step toward its elite class at Eliteus (`characters[].eliteStep`). Read in
// elite.ts only (M1 TR-11). Never a name: the step is keyed by the character's save slot.

/**
 * Where a character stands at Eliteus (V8 and V44, settled from the game client and raw saves):
 * `none` not on a subclass Eliteus serves (Beginner line, a first class, or a class the account can't
 * promote here); `gang` its first quest is open: defeat the Greenie Gang, 10 kills; `pick` the Gang is
 * beaten, the elite is one click at Eliteus; `done` it is an elite or a class an elite promotes to.
 */
export type EliteStepKind = 'none' | 'gang' | 'pick' | 'done';

export interface EliteStep {
  step: EliteStepKind;
  /** The elite its subclass becomes ("Divine_Knight"); null on `none`. */
  elite: string | null;
  /** Greenie Gang kills toward the 10 (raw `QuestStatus_i.Eliteus1[0]`, capped at 10); null unless `gang`. */
  gangKills: number | null;
}

export interface EliteCharacterFields {
  /** M26 FR-17: the Eliteus step; null when the save's quest records can't be read. */
  eliteStep?: EliteStep | null;
}
