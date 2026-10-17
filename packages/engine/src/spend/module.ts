// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M7 Spend Plan as an engine module (M10 `EngineModule`), built like M3's `createAfkSafetyModule` and M6's
// `createUnspentModule`: one `SpendPlan` per successful parse (FR-1), no Verdict, so a throw drops only the
// plan. It doesn't depend on the Expected Return. The worker and the golden harness register it.
import type { AccountState } from '@idleon-forge/account-state';
import type { StageId } from '@idleon-forge/knowledge';
import type { EngineModule } from '../core/module';
import { lookupOf } from '../metapath/knowledge';
import { detectStage } from '../metapath/stage';
import type { NotCoveredItem } from '../result';
import { combatGate } from './detectors';
import type { SpendKnowledge } from './knowledge';
import { buildSpendPlan, CHECK } from './plan';
import type { SpendPlan } from './types';

export interface SpendModuleDeps {
  kb: SpendKnowledge & { facts: Readonly<Record<string, unknown>> };
  /** The Stage, from M2; without it the module detects it from the facts. */
  stage?: (state: AccountState) => { id: StageId | null; coverage?: 'covered' | 'beyond' } | null;
}

/** "Not covered yet" for the plan's gaps (FR-20, M6 Final rulings RT1), labelled by the not-ready Check. */
export function notCoveredOf(plan: SpendPlan, kb: SpendKnowledge): NotCoveredItem[] {
  const values = (kb.entries[CHECK.stampNotReady]?.values ?? {}) as Record<string, string>;
  const label: Record<string, NotCoveredItem> = {
    'forge.upgrades': { systemId: 'forge', label: values.forge ?? 'Forge upgrades' },
    'stamps.raise-material': { systemId: 'stamps.raise', label: values.raise ?? 'Stamp cap raises' },
    'stamps.raise-carry': { systemId: 'stamps.raise', label: values.raise ?? 'Stamp cap raises' },
    'statues.guilding-tools': {
      systemId: 'statues.guilding-tools',
      label: values.guilding ?? 'Guilding Tools',
    },
  };
  return plan.notCovered.flatMap((k) => (label[k] ? [label[k]] : []));
}

export function createSpendModule(deps: SpendModuleDeps): EngineModule {
  const facts = lookupOf(deps.kb as Parameters<typeof lookupOf>[0]);
  return {
    id: 'spend-plan',
    covers: [],
    dependsOnExpectedReturn: false,
    affectsVerdict: false,
    run({ state }) {
      const detected = deps.stage ? deps.stage(state) : detectStage(state, facts);
      const stage = detected?.id ?? null;
      // Scope (section 2): W1-W3 plus W4 entry. An account past W4 gets no plan rather than W4 advice.
      if (!stage || detected?.coverage === 'beyond') return { account: { spendPlan: null } };
      const plan = buildSpendPlan({ state, kb: deps.kb, stage, gate: combatGate(state, facts) });
      return { account: { spendPlan: plan }, notCovered: plan ? notCoveredOf(plan, deps.kb) : [] };
    },
  };
}
