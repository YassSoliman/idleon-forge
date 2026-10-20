// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-6: a System with its own unlock fact says nothing while it is locked; the fact beats the world.
import type { AccountState } from '@idleon-forge/account-state';
import { unlocked } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { runEngine } from '../../src/core/engine';
import type { EngineModule } from '../../src/core/module';
import { goal, input, publicState } from './helpers';

const emits: EngineModule = {
  id: 'emits',
  covers: [],
  dependsOnExpectedReturn: false,
  affectsVerdict: false,
  run: () => ({
    account: {
      goals: ['breeding.check.x', 'lab.check.x', 'cooking.check.x', 'gem-shop.check.x'].map((id) => ({
        goal: goal(id, 'account'),
      })),
    },
  }),
};
const ids = (s: AccountState) =>
  runEngine(input(s), [emits])
    .account.goals.map((g) => g.system)
    .sort();

const base = () => publicState('first.json');
const patch = (s: AccountState, a: Partial<AccountState['account']>): AccountState => ({
  ...s,
  account: { ...s.account, ...a },
});

describe('unlock guards (M26 FR-6)', () => {
  it('the W4 public save has Breeding, Cooking and the Lab open: every Goal stays', () => {
    const s = base();
    expect(['breeding', 'cooking', 'lab'].map((x) => unlocked(x, s))).toEqual(['yes', 'yes', 'yes']);
    expect(ids(s)).toEqual(['breeding', 'cooking', 'gem-shop', 'lab']);
  });

  it('Breeding not started is locked even in World 4 (the fact beats currentWorld)', () => {
    const s = base();
    const b = s.account.breeding;
    if (!b) throw new Error('first.json has Breeding');
    const off = patch(s, { breeding: { ...b, level: 0, speciesBred: 0, started: false } });
    expect(unlocked('breeding', off)).toBe('no');
    expect(ids(off)).not.toContain('breeding');
  });

  it('a late-W3 save that already bred reads Breeding open (currentWorld 3 is only the fallback)', () => {
    expect(unlocked('breeding', patch(base(), { currentWorld: 3 }))).toBe('yes');
  });

  it('no fact (unread Lab and Kitchens) falls back to the world; no world either is unknown and keeps the Goal', () => {
    const w2 = patch(base(), { currentWorld: 2, lab: null, cooking: null });
    expect([unlocked('lab', w2), unlocked('cooking', w2)]).toEqual(['no', 'no']);
    expect(ids(w2)).toEqual(['breeding', 'gem-shop']);
    const blind = patch(base(), { currentWorld: null, lab: null });
    expect(unlocked('lab', blind)).toBe('unknown');
    expect(ids(blind)).toContain('lab');
  });

  it('Equinox keys off the Mirror or a Dream Upgrade, not currentWorld (M26 FR-8 reader)', () => {
    // first.json is in World 4 but holds no Mirror and has no Dream Upgrade level.
    expect(unlocked('equinox', base())).toBe('no');
    expect(unlocked('equinox', patch(base(), { equinoxUnlocked: true, currentWorld: 3 }))).toBe('yes');
    expect(unlocked('equinox', patch(base(), { equinoxUnlocked: null, currentWorld: 3 }))).toBe('yes');
  });

  it('Systems without a rule are never guarded', () => {
    expect(unlocked('gem-shop', patch(base(), { currentWorld: 1 }))).toBe('yes');
  });
});
