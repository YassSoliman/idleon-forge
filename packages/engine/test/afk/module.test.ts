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
    expect(r.account.blockerKeys).toHaveLength(2);
  });

  it('carries first fill and alreadyFull on the W3-early account', () => {
    const r = runEngine(input(W3()), [module]);
    expect(r.characters.every((c) => c.verdict.kind === 'ready')).toBe(true);
    expect(r.firstFill?.label).toBe("Bowman Lv 60's anvil");
    expect(r.alreadyFull).toBe(4);
  });

  it('#70 A1: a quiet "Anvil full in X" info line per character, never a Goal; none when full now', () => {
    const r = runEngine(input(), [module]);
    expect(r.characters.map((c) => (c.info ?? []).map((i) => i.text))).toEqual([
      [],
      ['Anvil full in 1 h at current speed'],
      ['Anvil full in 2 h at current speed'],
      ['Anvil full in 2 h at current speed'],
      ['Anvil full in 6 h at current speed'],
    ]);
    expect(r.characters[1]?.info?.[0]?.key).toBe('anvil.check.fill-time@c1');
    for (const c of r.characters) expect(c.goals.map((g) => g.id)).not.toContain('anvil.check.fill-time');
    // #70 A5: only the Barbarian Lv 60's full anvil is a per-character anvil item.
    const anvilGoals = r.characters.map((c) => c.goals.filter((g) => g.system === 'anvil').length);
    expect(anvilGoals).toEqual([1, 0, 0, 0, 0]);
  });

  it('declares itself the Verdict module that depends on the Expected Return', () => {
    expect(module.covers).toEqual(['afk-safety', 'verdict']);
    expect(module.dependsOnExpectedReturn).toBe(true);
    expect(module.affectsVerdict).toBe(true);
  });
});
