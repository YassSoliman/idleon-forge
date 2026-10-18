// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Test helpers for M20: a save parsed the way the worker parses it, and the engine with the worker's
// modules (M2, M3, M6, M14) plus M20's two. Fixtures are named by class and level only (TR-8).
import type { AccountState } from '@idleon-forge/account-state';
import { runEngine } from '../../src/core/engine';
import type { EngineHistoryEntry } from '../../src/core/module';
import type { EngineResult, Goal } from '../../src/result';
import { createM20Modules } from '../../src/slots';
import { kb, modules, workerState } from '../walkthrough/helpers';

export { hasPrivate, privateFile, scrubbedFile } from '../walkthrough/helpers';
export { kb, workerState };

export const HOUR = 3_600_000;

export interface RunOptions {
  now?: number;
  expectedReturnHours?: number;
  history?: EngineHistoryEntry[];
}

/** The engine with the worker's modules and M20, at the save's own clock unless `now` is given. */
export function run(state: AccountState, o: RunOptions = {}): EngineResult {
  return runEngine(
    {
      state,
      history: { entries: o.history ?? [], sessionStartedAt: null, learnedExpectedReturnSeconds: null },
      knowledge: { version: 'test', coverage: () => [], kb },
      now: o.now ?? state.asOf,
      options: { expectedReturnSeconds: (o.expectedReturnHours ?? 8) * 3600 },
    },
    [...modules(), ...createM20Modules({ kb })],
  );
}

export const m20Goals = (r: EngineResult): Goal[] =>
  r.account.goals.filter((g) =>
    [
      'construction.check.cog-seat-free',
      'worship.check.no-skull',
      'trapping.check.start',
      'trapping.check.no-trap-set',
      'alchemy.check.liquid-unstaffed',
      'random-events.check.today',
      'killroy.check.skulls',
    ].includes(g.id),
  );

export const row = (r: EngineResult, id: string) => r.checklist?.rows.find((x) => x.id === id);

/** The index of the character with this class and level. */
export function slotOf(state: AccountState, cls: string, level: number): number {
  const c = state.characters.find((x) => x.class === cls && x.level === level);
  if (!c) throw new Error(`no ${cls} Lv ${level}`);
  return c.index;
}

/** A deep copy, so a mutation never leaks into the cached state. */
export const copy = (s: AccountState): AccountState => structuredClone(s);
