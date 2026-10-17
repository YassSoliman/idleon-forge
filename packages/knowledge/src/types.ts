// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Detector contract (M11 TR-4). A Detector is pure code that reads the Account State and returns
// findings; the entry that references it holds every word a player reads and every Source. Knowledge
// Base Detectors live in packages/knowledge/detectors/<system>/<name>.ts (one per file, default export,
// auto-discovered); engine Detectors (`kind: 'engine'`) live in packages/engine under the same id format.
import type { AccountState } from '@idleon-forge/account-state';
import type { z } from 'zod';
import type { Entry, FactTable } from './schema';

/**
 * One earlier save, as the engine and `DetectorContext.history` receive it (M1 TR-14):
 * `Pick<SaveRecord, 'lastCloudSave' | 'receivedAt' | 'state'>`. Declared here structurally until M1's
 * history store exports it from @idleon-forge/account-state; the two are the same shape.
 */
export interface HistoryEntry {
  /** epoch ms, from the save itself */
  lastCloudSave: number;
  /** epoch ms, local clock */
  receivedAt: number;
  state: AccountState;
}

/** Dot path into AccountState with [*] for arrays, e.g. "characters[*].afkType", "account.towers.data[*].level". */
export type FieldPath = string;
export type Subject = { kind: 'account' } | { kind: 'character'; index: number };
export type SlotValue = number | string;

export interface DetectorContext {
  readonly state: AccountState;
  /** Earlier saves, oldest first, at most 30 days (M1). Empty on the first save. */
  readonly history: readonly HistoryEntry[];
  /** Injected clock (epoch ms). Detectors never read the real clock. */
  readonly now: number;
  /** The player's Expected Return (ms), default 8 h. Only Checks with usesExpectedReturn should read it. */
  readonly expectedReturnMs: number;
  /** Read-only access to compiled entries and fact tables (TR-2a) by id, e.g. a generated ladder or a route table. */
  readonly facts: { get(id: string): Readonly<Entry | FactTable> | undefined };
}

/** 'engine': an engine Detector in packages/engine (M2 Stage/roster/pusher, M5 options, M7 spend lines), whose finding
 *  shape its module spec defines. Builds have no Detector kind: M9's Checks read Build entries. */
export type DetectorKind = 'check' | 'contribution' | 'progress' | 'milestone' | 'acquisition' | 'engine';
export const DETECTOR_KINDS: readonly DetectorKind[] = [
  'check',
  'contribution',
  'progress',
  'milestone',
  'acquisition',
  'engine',
];

export type UnknownReason = 'field-missing' | 'parser-section-failed' | 'not-applicable' | 'needs-history';

interface FindingBase {
  subject: Subject;
  /** Values for the entry's templates; must match the Detector's slots schema. */
  slots: Record<string, SlotValue>;
}
export type CheckFinding = FindingBase &
  (
    | {
        result: 'fires';
        /** epoch ms when the problem bites, for "fills in 3 h" (at <= now: already biting) */
        at?: number;
        /** M3 FR-7 (c): would the fix hold until the return? */
        fixHolds?: boolean;
        demotedBecause?: 'not-quick' | 'not-fillable' | 'fix-does-not-hold' | 'effect-next-action' | null;
        /** M6 TR-9: drives the by-urgency frame position and the urgency tie-break (M2 TR-14). */
        urgency?: 'losing-now' | 'lost-before-return' | 'banked';
        /** epoch ms the value starts to be lost (M6 TR-6). */
        deadline?: number;
        /** M6 TR-8: identifies the done check across saves. */
        doneKey?: string;
        /** M6 FR-28: the next moment this answer can change without a new save; the engine re-runs at the earliest. */
        nextChangeAt?: number;
      }
    /** Optional: a Detector may still return nothing for a silent subject. M3 FR-11 uses nextAt for first fill. */
    | {
        result: 'pass';
        /** epoch ms when it would start to fire, e.g. a cap after the return */
        nextAt?: number;
        nextChangeAt?: number;
      }
    | { result: 'unknown'; reason: UnknownReason }
  );
export type ContributionFinding = FindingBase & {
  advances: 'yes' | 'no' | 'unknown';
  /** Only for eta: kills-per-hour; ms to the next Milestone, from Toolbox kills/h (ADR 0005 arithmetic). */
  etaMs?: number | null;
};
export type ProgressFinding = FindingBase & ({ value: number } | { value: null; reason: UnknownReason });
export type MilestoneFinding = FindingBase & { reached: 'yes' | 'no' | 'unknown' };
/** An engine Detector's output; its shape is fixed by its module spec (M2 StageResult/MetaPathResult, M5 HigherLeverageOption, M7 spend facts). */
export type EngineFinding = unknown;
export type AcquisitionFinding = FindingBase & {
  owned: 'yes' | 'no' | 'unknown';
  requirementsMet: 'yes' | 'no' | 'unknown';
  missing: string[]; // requirement entry ids or text keys
};

export interface FindingByKind {
  check: CheckFinding;
  contribution: ContributionFinding;
  progress: ProgressFinding;
  milestone: MilestoneFinding;
  acquisition: AcquisitionFinding;
  engine: EngineFinding;
}
export type AnyFinding = FindingByKind[DetectorKind];

export interface FixtureExample {
  /** A public id (e.g. 'highend'), a scrubbed id (e.g. 'scrubbed-w2'), or 'private:<id>' (local only). */
  fixture: string;
  /** Default: any subject. */
  subject?: Subject;
  /** Optional state mutation for edge cases, e.g. (s) => withCharacter(s, 0, { afkType: 'Nothing' }). */
  mutate?: (s: AccountState) => AccountState;
  /** Params to run with (validated against the Detector's params schema). Default: `{}` parsed. */
  params?: Record<string, unknown>;
  /** Expected values for kinds without fires/silent, e.g. { value: 13021 } for progress. */
  expect?: Record<string, unknown>;
}

export interface Detector<
  K extends DetectorKind,
  P extends z.ZodType,
  S extends z.ZodType<Record<string, SlotValue>>,
> {
  /** "<system>/<name>", unique across the Knowledge Base and engine registries. */
  id: string;
  kind: K;
  system: string;
  /** Params an entry may pass (thresholds that are judgment). The entry's `params` are validated against it. */
  params: P;
  /** Slots each finding provides to templates. Templates may use only these, plus built-ins and `values`. */
  slots: S;
  /** Every Account State path the Detector may read. Enforced in tests by a recording proxy. */
  reads: readonly FieldPath[];
  examples: {
    /** check `fires`, milestone `reached: yes`, contribution `advances: yes`, acquisition `owned: yes`, progress `value` set. */
    fires: readonly FixtureExample[];
    silent: readonly FixtureExample[];
    unknown?: readonly FixtureExample[];
  };
  /** Pure. Returns one finding per subject it has an opinion on. An empty array means silent everywhere. */
  run(ctx: DetectorContext, params: z.infer<P>): readonly FindingByKind[K][];
}

export type AnyDetector = Detector<DetectorKind, z.ZodType, z.ZodType<Record<string, SlotValue>>>;
export type DetectorRegistry = Record<string, AnyDetector>;

/** Identity helper that gives a Detector literal its types. Every Detector file default-exports one. */
export function defineDetector<
  K extends DetectorKind,
  P extends z.ZodType,
  S extends z.ZodType<Record<string, SlotValue>>,
>(d: Detector<K, P, S>): Detector<K, P, S> {
  return d;
}

/** Which Detector kind each entry field needs (TR-4 table). Engine Detectors may stand in where noted. */
export const DETECTOR_KIND_FOR: Readonly<Record<string, readonly DetectorKind[]>> = {
  'goal.progress': ['progress', 'engine'],
  'contribution.detector': ['contribution'],
  'check.detector': ['check', 'engine'],
  'acquisition.detector': ['acquisition'],
  'metapath.milestones': ['milestone'],
  'metapath.detector': ['engine'],
  'system.unlocked': ['milestone'],
};
