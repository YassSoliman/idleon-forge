// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Test helpers for M18: a save parsed the way the worker parses it, and the engine with the worker's
// modules (M2, M3, M6, M14) plus M18's. Fixtures are named by class and level only (TR-9).
import type { AccountState } from '@idleon-forge/account-state';
import { runEngine } from '../../src/core/engine';
import { createGearModule } from '../../src/gear';
import type { EngineResult, Goal } from '../../src/result';
import { kb, modules, workerState } from '../walkthrough/helpers';

export { hasPrivate, privateFile, scrubbedFile } from '../walkthrough/helpers';
export { kb, workerState };

/** The engine with the worker's modules and M18, at the save's own clock (the golden clock). */
export function run(state: AccountState, expectedReturnHours = 8): EngineResult {
  const base = modules();
  const at = base.findIndex((m) => m.id === 'walkthroughs');
  const mods = [...base.slice(0, at), createGearModule({ kb }), ...base.slice(at)];
  return runEngine(
    {
      state,
      history: { entries: [], sessionStartedAt: null, learnedExpectedReturnSeconds: null },
      knowledge: { version: 'test', coverage: () => [], kb },
      now: state.asOf,
      options: { expectedReturnSeconds: expectedReturnHours * 3600 },
    },
    mods,
  );
}

/** Every M18 Goal on a result, with its subject. */
export function gearGoals(r: EngineResult): Array<{ subject: string; goal: Goal }> {
  const mine = (g: Goal) => g.id.startsWith('gear.') || g.id.startsWith('armor-smithy.');
  return [
    ...r.account.goals.filter(mine).map((goal) => ({ subject: 'account', goal })),
    ...r.characters.flatMap((c) => c.goals.filter(mine).map((goal) => ({ subject: `c${c.index}`, goal }))),
  ];
}

/** The index of the character with this class and level. */
export function slotOf(state: AccountState, cls: string, level: number): number {
  const c = state.characters.find((x) => x.class === cls && x.level === level);
  if (!c) throw new Error(`no ${cls} Lv ${level}`);
  return c.index;
}

/** "c3" -> "Bowman 60". */
export const label = (state: AccountState, subject: string) => {
  const m = /^c(\d+)$/.exec(subject);
  const c = m ? state.characters.find((x) => x.index === Number(m[1])) : undefined;
  return c ? `${c.class} ${c.level}` : subject;
};
