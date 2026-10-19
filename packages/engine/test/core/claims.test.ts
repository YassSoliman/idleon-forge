// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-5 "claimed by": one card per claimed thing, owned by the claiming System's own entry.
import { describe, expect, it } from 'vitest';
import { applyClaims, type ClaimRef, type TaggedGoal } from '../../src/core/rank';
import { goal } from './helpers';

const tagged = (entryId: string, why = `why ${entryId}`): TaggedGoal => ({
  goal: goal(entryId, 'account', {}, { why }),
  moduleId: entryId.split('.')[0] as string,
});
const golden: ClaimRef[] = [{ system: 'food', key: 'golden-in-storage' }];
const claims: Record<string, ClaimRef[]> = {
  'afk.check.golden-food-idle': golden,
  'food.check.golden-unequipped': golden,
  'coins.check.golden-bread': golden,
};
const run = (gs: TaggedGoal[]) => applyClaims(gs, (id) => claims[id], 'account');

describe('applyClaims (M26 FR-5)', () => {
  it("keeps the owning System's card and adds the others' reasons as detail lines", () => {
    const out = run([
      tagged('afk.check.golden-food-idle', 'Your AFK fighter eats worse food'),
      tagged('stamps.check.other'),
      tagged('food.check.golden-unequipped'),
      tagged('coins.check.golden-bread', 'Golden Bread adds coins'),
    ]);
    expect(out.map((g) => g.goal.nextAction.entryId)).toEqual([
      'stamps.check.other',
      'food.check.golden-unequipped',
    ]);
    expect(out[1]?.goal.details).toEqual([
      { subject: 'account', text: 'Your AFK fighter eats worse food' },
      { subject: 'account', text: 'Golden Bread adds coins' },
    ]);
  });

  it('without the owner firing, the first claimer keeps the card; a lone claimer is untouched', () => {
    const out = run([tagged('coins.check.golden-bread'), tagged('afk.check.golden-food-idle')]);
    expect(out.map((g) => g.goal.nextAction.entryId)).toEqual(['coins.check.golden-bread']);
    expect(out[0]?.goal.details).toHaveLength(1);
    const lone = tagged('afk.check.golden-food-idle');
    expect(run([lone])).toEqual([lone]);
  });
});
