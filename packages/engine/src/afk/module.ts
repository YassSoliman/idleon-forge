// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 as an engine module: turns `evaluateAfkSafety` into what the engine core merges (M10 TR-6).
// It is the one module that composes Verdicts (`covers: ['afk-safety', 'verdict']`).
//
// TODO(M10): `EngineInput`, `ModuleOutput` and `EngineModule` below are minimal structural copies of
// M10's `packages/engine/src/core/module.ts`; swap them for imports when M10 merges.
import type { AccountState } from '@idleon-forge/account-state';
import type { CompiledKnowledge, DetectorRegistry, HistoryEntry } from '@idleon-forge/knowledge';
import { type AfkSafetyInput, evaluateAfkSafety } from './evaluate';
import { HOUR_MS } from './expected-return';
import type {
  AfkSafetyResult,
  ExpectedReturn,
  Fill,
  Goal,
  PurposeStatus,
  Safety,
  SafetyFinding,
  StageLike,
  Verdict,
} from './types';
import { composeVerdict } from './verdict';

/** TODO(M10): M10 `EngineInput` (the fields this module reads). */
export interface EngineInputLike {
  state: AccountState;
  history: {
    entries: readonly HistoryEntry[];
    sessionStartedAt: number | null;
    learnedExpectedReturnSeconds: number | null;
  };
  now: number;
  options: { expectedReturnSeconds: number };
}

interface ModuleGoal {
  goal: Goal;
}

/** TODO(M10): M10 `ModuleOutput` (the fields this module sets). */
export interface ModuleOutputLike {
  characters: Array<{ index: number; verdict: Verdict; goals: ModuleGoal[]; firstFill: Fill | null }>;
  account: { goals: ModuleGoal[]; blockerKeys: string[]; safety: Safety };
  alreadyFull: number;
  firstFill: Fill | null;
}

/** TODO(M10): M10 `EngineModule`. */
export interface EngineModuleLike {
  id: string;
  covers: readonly ('afk-safety' | 'verdict' | 'stage')[];
  dependsOnExpectedReturn: boolean;
  affectsVerdict: boolean;
  run(input: EngineInputLike): ModuleOutputLike;
}

export interface AfkSafetyModuleDeps {
  kb: AfkSafetyInput['kb'] & Pick<CompiledKnowledge, 'entries'>;
  registry: DetectorRegistry;
  /** TODO(M2): the Stage, from M2's module output. */
  stage?: (state: AccountState) => StageLike | null;
  /** TODO(M4): a character's Purpose status; until M4 ships, 'not-implemented' (D4). */
  purpose?: (index: number) => PurposeStatus | 'not-implemented';
}

const goalOf = (f: SafetyFinding, kb: AfkSafetyModuleDeps['kb']): ModuleGoal => {
  const entry = kb.entries[f.entryId];
  return {
    goal: {
      id: f.entryId,
      title: entry?.title ?? f.entryId,
      system: entry?.system ?? f.entryId.split('.')[0] ?? '',
      category: f.role === 'blocker' ? 'blocker' : 'nice',
      nextAction: f.nextAction,
      milestone: null,
    },
  };
};

/** The engine output for one evaluation, Verdicts composed (FR-9). */
export function toModuleOutput(
  result: AfkSafetyResult,
  kb: AfkSafetyModuleDeps['kb'],
  purpose: AfkSafetyModuleDeps['purpose'] = () => 'not-implemented',
): ModuleOutputLike {
  return {
    characters: result.characters.map((c) => {
      const blockerKeys = c.findings.filter((f) => f.role === 'blocker').map((f) => f.key);
      return {
        index: c.index,
        verdict: composeVerdict(c.safety, purpose(c.index), blockerKeys),
        goals: c.findings.map((f) => goalOf(f, kb)),
        firstFill: c.firstFill,
      };
    }),
    account: {
      goals: result.account.findings.map((f) => goalOf(f, kb)),
      blockerKeys: result.account.findings.filter((f) => f.role === 'blocker').map((f) => f.key),
      safety: result.account.safety,
    },
    alreadyFull: result.alreadyFull,
    firstFill: result.firstFill,
  };
}

export function createAfkSafetyModule(deps: AfkSafetyModuleDeps): EngineModuleLike {
  return {
    id: 'afk-safety',
    covers: ['afk-safety', 'verdict'],
    dependsOnExpectedReturn: true,
    affectsVerdict: true,
    run(input) {
      const learnedS = input.history.learnedExpectedReturnSeconds;
      const usedMs = Math.round(input.options.expectedReturnSeconds * 1000);
      const learnedMs = learnedS === null ? null : Math.max(HOUR_MS, Math.round(learnedS * 1000));
      // M10 resolves the chip choice (TR-8); the source only labels where the value came from.
      const expectedReturn: ExpectedReturn = {
        usedMs,
        learnedMs,
        source: learnedMs === usedMs ? 'learned' : 'player',
      };
      const result = evaluateAfkSafety({
        state: input.state,
        history: input.history.entries,
        now: input.now,
        expectedReturn,
        kb: deps.kb,
        registry: deps.registry,
        stage: deps.stage?.(input.state) ?? null,
      });
      return toModuleOutput(result, deps.kb, deps.purpose);
    },
  };
}
