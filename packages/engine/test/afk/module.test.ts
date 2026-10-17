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

  it('declares itself the Verdict module that depends on the Expected Return', () => {
    expect(module.covers).toEqual(['afk-safety', 'verdict']);
    expect(module.dependsOnExpectedReturn).toBe(true);
    expect(module.affectsVerdict).toBe(true);
  });
});
