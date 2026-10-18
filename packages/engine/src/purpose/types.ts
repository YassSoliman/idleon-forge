// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 Purpose & Milestones' engine API (docs/specs/M4-purpose-milestones.md TR-3). Plain data, so it
// crosses the worker boundary. Outputs carry character indices, never names (TR-9).
import type { AccountState, FightingRate } from '@idleon-forge/account-state';
import type { CompiledKnowledge, DetectorRegistry } from '@idleon-forge/knowledge';
import type { MetaPathResult } from '../metapath/types';
import type { Provenance } from '../result';

export type { FightingRate };

export type SkillKey = 'mining' | 'chopping' | 'fishing' | 'catching';

export type ActivityRef =
  | { kind: 'afk'; afkType: string; mapIndex: number | null; target: string | null; skill: SkillKey | null }
  | { kind: 'parallel'; slot: 'cauldron' | 'cog' | 'traps' | 'worship' | 'printer'; detail: string }
  | { kind: 'none' };

export type Eta =
  | {
      kind: 'time';
      seconds: number;
      ratePerHour: number;
      feeders: number[];
      bound: 'estimate' | 'mean-at-base-rate';
    }
  | { kind: 'yesno' }
  | { kind: 'none'; reason: 'zero-rate' | 'beyond-cap' | 'complete' | 'reached-unconfirmed' };

export type NotWorthwhileReason = 'horizon' | 'zero-rate' | 'rule' | 'usefulness-contested' | 'complete';

/** A rendered line: the headline and, when there is one, a short detail ("banked: …"). */
export interface RenderedTemplate {
  headline: string;
  detail: string | null;
}

export interface GoalInstance {
  /** Generated Goal entry, e.g. 'upgrade-vault.goal.kill-row-map-8'. */
  goalId: string;
  /** Concrete Contribution, e.g. 'upgrade-vault.contribution.kill-row-kill-row-map-8'. */
  contributionId: string;
  characterIndex: number;
  scope: 'character' | 'account';
  unit: 'kills' | 'copies' | 'level' | 'items' | 'yesno';
  saved: number;
  projected: number;
  reached: number | null;
  next: number | null;
  following: number | null;
  eta: Eta;
  etaFollowing: Eta | null;
  worthwhile: boolean;
  notWorthwhileReason?: NotWorthwhileReason;
  badges: ('contested' | 'stale' | 'parser-behind')[];
  text: RenderedTemplate;
  provenance: Provenance;
}

export type PurposeStatus = 'serving' | 'exhausted' | 'none' | 'not-covered' | 'no-activity' | 'cannot-tell';

export interface StopHere {
  contributionId: string;
  goalId: string;
  at: number;
  etaAt: Eta;
  following: number;
  etaFollowing: Eta;
  provenance: Provenance;
}

export interface MilestoneCrossing {
  goalId: string;
  milestone: number;
  provenance: Provenance;
}

export interface Purpose {
  characterIndex: number;
  activity: ActivityRef;
  status: PurposeStatus;
  /** All, ranked (FR-10): worthwhile first, then M2's comparator. */
  goals: GoalInstance[];
  headline: GoalInstance | null;
  stopHere: StopHere | null;
  prompt: { kind: 'what-for' | 'not-covered'; reason: RenderedTemplate; afkType?: string } | null;
  /** For M3 FR-12 when status is 'no-activity', and the FR-14 fallback. */
  suggestedTarget: ActivityRef | null;
  reached: MilestoneCrossing[];
}

/** What M4 reads from M2 (M2 TR-4a). */
export type MetaPathInput = Pick<MetaPathResult, 'stage' | 'list' | 'pusher' | 'pushGoal' | 'roles'>;

export interface DeriveInput {
  state: AccountState;
  /** M1 SaveHistory.sessionStart, resolved by the caller; null on the first save or in paste mode. */
  history: { sessionStart: AccountState | null };
  kb: CompiledKnowledge;
  /** The Knowledge Base Detector registry the Contributions name (M11). */
  registry: DetectorRegistry;
  meta: MetaPathInput;
  /** Best class EXP/h per character index (M5's sweep, TR-6); null where unknown. */
  bestExpPerHour: (number | null)[];
  expectedReturnHours: number;
  now: number;
  /** M1 FR-29: the game is newer than the parser pin; every Goal gets the parser-behind badge. */
  parserBehind?: boolean;
}
