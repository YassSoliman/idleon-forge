// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 as an engine module (M10 TR-6, `EngineModule`): turns `evaluateAfkSafety` into what the engine
// core merges. It is the one module that composes Verdicts (`covers: ['afk-safety', 'verdict']`), and
// it depends on the Expected Return, so the core re-runs it when a chip changes.
// The core's DEFAULT_MODULES and the parse worker register modules; this file only builds it, from
// the compiled Knowledge Base and the Detector registry the worker loads.
import type { AccountState } from '@idleon-forge/account-state';
import type { DetectorRegistry } from '@idleon-forge/knowledge';
import type { EngineModule, ModuleGoal, ModuleOutput } from '../core/module';
import { type AfkSafetyInput, evaluateAfkSafety } from './evaluate';
import { HOUR_MS } from './expected-return';
import type { AfkSafetyResult, ExpectedReturn, PurposeStatus, SafetyFinding, StageLike } from './types';
import { composeVerdict } from './verdict';

export interface AfkSafetyModuleDeps {
  kb: AfkSafetyInput['kb'];
  registry: DetectorRegistry;
  /** The Stage, from M2's `runMetaPath(...).stage`; without it `appliesTo.stages` is not filtered. */
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
): ModuleOutput {
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

/** The Expected Return M10 resolved (its chips, TR-8), labelled with where it came from. */
export function expectedReturnOf(usedSeconds: number, learnedSeconds: number | null): ExpectedReturn {
  const usedMs = Math.round(usedSeconds * 1000);
  const learnedMs = learnedSeconds === null ? null : Math.max(HOUR_MS, Math.round(learnedSeconds * 1000));
  return { usedMs, learnedMs, source: learnedMs === usedMs ? 'learned' : 'player' };
}

export function createAfkSafetyModule(deps: AfkSafetyModuleDeps): EngineModule {
  return {
    id: 'afk-safety',
    covers: ['afk-safety', 'verdict'],
    dependsOnExpectedReturn: true,
    affectsVerdict: true,
    run(input) {
      const result = evaluateAfkSafety({
        state: input.state,
        history: input.history.entries,
        now: input.now,
        expectedReturn: expectedReturnOf(
          input.options.expectedReturnSeconds,
          input.history.learnedExpectedReturnSeconds,
        ),
        kb: deps.kb,
        registry: deps.registry,
        stage: deps.stage?.(input.state) ?? null,
      });
      return toModuleOutput(result, deps.kb, deps.purpose);
    },
  };
}
