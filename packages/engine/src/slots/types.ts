// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 F2 Parallel Slots and F3 the Skills tab (docs/specs/M20-skills-parallel-slots.md TR-5, TR-6): plain
// data on EngineResult.skills, .slotPictures and .skillGrid. Names are joined only in the UI (M4 TR-9).
import type { SkillId } from '@idleon-forge/account-state';

export type { SkillId };
export type SlotKind = 'cog' | 'worship' | 'trap' | 'cauldron' | 'printer';
/** `not-covered`: the account is past ActiveOn's coverage and the save shows nothing for this slot. */
export type SlotState =
  | 'filled'
  | 'fillable'
  | 'unfillable'
  | 'capped'
  | 'locked'
  | 'unknown'
  | 'not-covered';

/** FR-18: one Parallel Slot of one character. */
export interface SlotPip {
  kind: SlotKind;
  state: SlotState;
  /** "builds on the Cog Board", "no skull (max 50)", "Opens in W3". */
  text: string;
  /** The NextAction key of the Goal that fills it, or null. */
  linkKey: string | null;
}

export interface SkillRow {
  skill: SkillId;
  level: number | null;
  /** exp / expReq, 0..1. */
  progress: number | null;
  /** Toolbox skill efficiency (Mining, Choppin, Fishing, Catching). */
  efficiency: number | null;
  accountBest: { level: number; index: number } | null;
  /** M2 Role that owns this skill: active, or dormant ("Role from W3"). */
  role: null | { id: string; active: boolean; from: string | null };
  specialty: boolean;
  locked: null | { text: string };
  nextGate: null | { label: string; atLevel: number; levelsLeft: number; scope: 'character' | 'account' };
}

/** FR-33–FR-38: one character's Skills tab. */
export interface CharacterSkills {
  index: number;
  rows: SkillRow[];
  /** FR-37: "Train: Construction · trains while it sits on the Cog Board"; null for no line. */
  train: null | {
    skill: SkillId;
    text: string;
    via: 'parallel-slot' | 'afk-target' | 'role' | 'specialty';
    linkKey: string | null;
  };
  slots: SlotPip[];
}

/** A picture element (TR-6): `actionKey` is the NextAction key it fixes, for M17's highlight. */
export interface PictureElement {
  id: string;
  actionKey: string | null;
}

export type StationId = 'power' | 'quicc' | 'high-iq' | 'kazam' | 'water' | 'nitrogen' | 'trench' | 'mercury';

export type SystemPicture =
  | {
      systemId: 'construction';
      kind: 'cog-board';
      cols: 12;
      rows: 8;
      squares: Array<
        PictureElement & { state: 'locked' | 'open' | 'cog' | 'character'; characterIndex?: number }
      >;
      shelf: Array<PictureElement & { index: number }>;
      inventory: Array<PictureElement & { index: number }>;
      buildRate: number;
      expRate: number;
      bestConstructor: null | {
        index: number;
        level: number;
        nextTier: null | { name: string; atLevel: number };
      };
      /** FR-21: "Board full: place a flag to open more squares", or null. */
      note: string | null;
    }
  | {
      systemId: 'worship';
      kind: 'worship';
      tanks: Array<
        PictureElement & {
          index: number;
          charge: number;
          max: number;
          fullAt: number | null;
          skull: string | null;
          spendAt: string | null;
        }
      >;
      totems: Array<
        PictureElement & { name: string; map: string; levelReq: number; maxWave: number; usableBy: number[] }
      >;
    }
  | {
      systemId: 'trapping';
      kind: 'traps';
      returnAt: number;
      rows: Array<
        PictureElement & {
          index: number;
          started: boolean;
          set: string | null;
          allowed: number | null;
          traps: Array<{ critter: string; endsAt: number }>;
        }
      >;
    }
  | {
      systemId: 'alchemy';
      kind: 'cauldron-seats';
      stations: Array<
        PictureElement & {
          station: StationId;
          locked: boolean;
          liquid: null | { current: number; max: number };
          brewers: number[];
        }
      >;
      unassigned: number[];
    };

/** FR-31: the Skill Grid for M17's Characters overview (`#skills`). */
export interface SkillGrid {
  skills: SkillId[];
  rows: Array<
    PictureElement & {
      index: number;
      cells: Record<SkillId, { level: number | null; best: boolean; specialty: boolean; role: boolean }>;
      afkSkill: SkillId | null;
      slots: SlotPip[];
    }
  >;
  /** The one highlighted cell (`cell-<index>-<skill>`): the top M20 slot Goal's target; null when none. */
  highlight: string | null;
  totals: Record<SkillId, number>;
}
