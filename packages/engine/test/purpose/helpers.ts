// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Test helpers for M4: saves parsed the way the worker parses them (frontier, supply rates, Toolbox
// functions; M14's helper), the compiled Knowledge Base and its Detector registry, and an engine run
// with M2, M3 and M4 the way the worker registers them.
import type { AccountState } from '@idleon-forge/account-state';
import { createAfkSafetyModule } from '../../src/afk';
import { cardList } from '../../src/collections/cards';
import { runEngine } from '../../src/core/engine';
import type { EngineHistory, EngineInput, EngineModule } from '../../src/core/module';
import { detectStage, lookupOf, runMetaPath } from '../../src/metapath';
import { metaPathModule } from '../../src/metapath/module';
import {
  bestExpPerHour,
  createPurposeModule,
  type Derived,
  type DeriveInput,
  derive,
  purposeStatusFor,
  suggestionFor,
} from '../../src/purpose';
import type { EngineResult } from '../../src/result';
import { kb, registry } from '../afk/helpers';
import { hasPrivate, privateFile, scrubbedFile, workerState } from '../walkthrough/helpers';

export { hasPrivate, kb, privateFile, registry, scrubbedFile, workerState };

export const W2 = () => workerState(scrubbedFile('scrubbed-w2'));
export const W3 = () => workerState(scrubbedFile('scrubbed-w3'));

export const deps = { kb, registry };

/** The DeriveInput the engine module builds, for direct `derive` tests. */
export function inputOf(
  state: AccountState,
  over: Partial<Omit<DeriveInput, 'state' | 'kb' | 'registry'>> = {},
): DeriveInput {
  return {
    state,
    history: { sessionStart: null },
    kb,
    registry,
    meta: runMetaPath(state, kb, state.asOf),
    bestExpPerHour: bestExpPerHour(state, lookupOf(kb)),
    expectedReturnHours: 8,
    now: state.asOf,
    ...over,
  };
}

export const derived = (state: AccountState, over: Parameters<typeof inputOf>[1] = {}): Derived =>
  derive(inputOf(state, over), (cls, stage) => cardList(lookupOf(kb), cls, stage));

export const purposeOf = (d: Derived, index: number) => {
  const p = d.purposes.find((x) => x.characterIndex === index);
  if (!p) throw new Error(`no Purpose for character ${index}`);
  return p;
};

export function modules(): EngineModule[] {
  const facts = lookupOf(kb);
  return [
    metaPathModule,
    createAfkSafetyModule({
      kb,
      registry,
      stage: (s) => detectStage(s, facts),
      purpose: purposeStatusFor(deps),
      purposeSuggestion: suggestionFor(deps),
    }),
    createPurposeModule(deps),
  ];
}

export function engineOf(
  state: AccountState,
  opts: { expectedReturnHours?: number; now?: number; history?: EngineHistory } = {},
): EngineResult {
  const input: EngineInput = {
    state,
    history: opts.history ?? { entries: [], sessionStartedAt: null, learnedExpectedReturnSeconds: null },
    knowledge: { version: 'test', coverage: () => [], kb },
    now: opts.now ?? state.asOf,
    options: { expectedReturnSeconds: (opts.expectedReturnHours ?? 8) * 3600 },
  };
  return runEngine(input, modules());
}
