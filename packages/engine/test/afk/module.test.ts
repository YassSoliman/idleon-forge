// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 through M10's engine core: the module composes the Verdicts, feeds the account stockpile
// blockers, first fill and alreadyFull, and turns off the "AFK safety isn't covered yet" gap.
import { describe, expect, it } from 'vitest';
import { AFK_SAFETY_NOT_COVERED, runEngine } from '../../src';
import { createAfkSafetyModule } from '../../src/afk';
import type { EngineInput } from '../../src/core/module';
import { kb, registry, W2, W3 } from './helpers';

const input = (state = W2(), hours = 8): EngineInput => ({
  state,
  history: { entries: [], sessionStartedAt: null, learnedExpectedReturnSeconds: null },
  knowledge: { version: 'test', coverage: () => [] },
  now: state.asOf,
  options: { expectedReturnSeconds: hours * 3600 },
});

describe('the afk-safety engine module', () => {
  const module = createAfkSafetyModule({ kb, registry });

  it('composes real Verdicts and removes the "not covered" gap', () => {
    const without = runEngine(input());
    expect(without.notCovered).toContainEqual(AFK_SAFETY_NOT_COVERED);
    const r = runEngine(input(), [module]);
    expect(r.notCovered).not.toContainEqual(AFK_SAFETY_NOT_COVERED);
    expect(r.characters.map((c) => c.verdict.kind)).toEqual(['fix', 'ready', 'ready', 'ready', 'ready']);
    expect(r.characters[0]?.verdict.blockerKeys).toContain('afk.check.dies-fixable-by-food@c0');
    expect(r.account.safety).toBe('unsafe');
    // Arcade only: Water at cap is an account line without history (R-PILL-2).
    expect(r.account.blockerKeys).toEqual(['arcade.check.balls-cap@account']);
  });

  it('carries first fill and alreadyFull on the W3-early account', () => {
    const r = runEngine(input(W3()), [module]);
    // Ready except the two characters on the wrong talent preset (M9 US-1).
    expect(r.characters.map((c) => c.verdict.kind)).toEqual([
      'ready',
      'ready',
      'fix',
      'ready',
      'fix',
      'ready',
    ]);
    expect(r.firstFill?.label).toBe("Bowman Lv 60's anvil");
    expect(r.alreadyFull).toBe(4);
  });

  it('#70 A1: a quiet "Anvil full in X" info line per character, never a Goal; none when full now', () => {
    const r = runEngine(input(), [module]);
    const lines = (c: (typeof r.characters)[number]) => (c.info ?? []).filter((i) => i.kind !== 'cap');
    expect(r.characters.map((c) => lines(c).map((i) => i.text))).toEqual([
      [],
      ['Anvil full in about 1h at current speed'],
      ['Anvil full in about 2h at current speed'],
      ['Anvil full in about 2h at current speed'],
      ['Anvil full in about 6h at current speed'],
    ]);
    expect(r.characters[1]?.info?.[0]?.key).toBe('anvil.check.fill-time@c1');
    for (const c of r.characters) expect(c.goals.map((g) => g.id)).not.toContain('anvil.check.fill-time');
    // #70 A5 and R-PILL-1: only the Barbarian Lv 60's full anvil shows, as a cap pill, never a Goal.
    for (const c of r.characters) expect(c.goals.filter((g) => g.system === 'anvil')).toEqual([]);
    const caps = r.characters.map((c) => (c.info ?? []).filter((i) => i.kind === 'cap').map((i) => i.label));
    expect(caps).toEqual([['Anvil full · collect'], [], [], [], []]);
    expect(r.characters[0]?.info?.[0]?.kind).toBe('cap');
  });

  it('declares itself the Verdict module that depends on the Expected Return', () => {
    expect(module.covers).toEqual(['afk-safety', 'verdict']);
    expect(module.dependsOnExpectedReturn).toBe(true);
    expect(module.affectsVerdict).toBe(true);
  });
});
