// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// R11 QA: the Spend Plan's "Bring first" reads as short steps, 12 words or fewer each (the Design Lab
// copy rule). The details are the scrubbed W2 and W3 saves' own lines.
import { describe, expect, it } from 'vitest';
import { bringSteps } from '../src/now/account-parts/AccountBody';

const DETAILS = [
  'Hatchet Stamp, Shield Stamp · carry 3.3k Thread on Barbarian Lv 60; carry 1.8k Iron Ore on Barbarian Lv 60, free space first',
  'Sword Stamp, Mana Stamp, Hatchet Stamp and 5 more · carry 1k Spore Cap on Wizard Lv 73; carry 36 Copper Ore on Wizard Lv 73; carry 281 Thread on Wizard Lv 73; carry 1.1k Goldfish on Squire Lv 85',
  'Bubble Money, Steel Guard, Vault Mastery and 1 more',
  'carry 25 Jungle Logs on Wizard Lv 73',
];

describe('Bring first steps (R11 QA)', () => {
  it('splits the names and each carry into their own step', () => {
    expect(bringSteps(DETAILS[0] as string)).toEqual([
      'Hatchet Stamp, Shield Stamp',
      'carry 3.3k Thread on Barbarian Lv 60',
      'carry 1.8k Iron Ore on Barbarian Lv 60, free space first',
    ]);
  });

  it('every step is 12 words or fewer', () => {
    for (const d of DETAILS)
      for (const step of bringSteps(d)) expect(step.split(/\s+/).length, step).toBeLessThanOrEqual(12);
  });
});
