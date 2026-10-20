// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-55: Poppy's two prestige buys are affordable. Toolbox's own Poppy alerts (utility/dashboard/
// account.js, `fisherooReset` / `greatestCatch`): the upgrade is open on this run and the fish held plus
// the bank (`totalFish`) cover its cost. `next` is the reset or Megafish the buy would give.

import type { PoppyState } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

/** A hand-made pond for the examples: one prestige buy open and covered by the fish. */
function pondWith(open: { reset?: boolean; catch?: boolean }): PoppyState {
  const names = [
    'Tasty Fishbait',
    'Quick Reeling',
    'Shiny Lure',
    'Bonuses from Poppy',
    'Fishy Discount',
    'Juicy Worm',
    'Fisheroo Reset',
    'Fishing Buddy',
    'Lightning Quickness',
    'Fisheroo Investing',
    'Multihook Fishing',
    'Greatest Catch',
  ];
  return {
    unlocked: true,
    pendingFish: 0,
    fish: 5e7,
    totalFish: 5e7,
    fisherooResets: open.catch ? 7 : 0,
    megafish: open.catch ? 5 : 0,
    upgrades: names.map((name, index) => ({
      index,
      name,
      level: 1,
      cost: 4e7,
      opensAt: 0,
      unlocked: index < 6 || (index === 6 && !!open.reset) || (index === 11 && !!open.catch),
    })),
  };
}

/** The upgrade each part reads, by Toolbox's `poppyBonuses` name (never a position). */
const UPGRADE = { 'fisheroo-reset': 'fisheroo reset', 'greatest-catch': 'greatest catch' } as const;

export default defineDetector({
  id: 'poppy/state',
  kind: 'check',
  system: 'poppy',
  params: z.strictObject({ part: z.enum(['fisheroo-reset', 'greatest-catch']) }),
  slots: z.strictObject({ next: z.number(), cost: z.number() }).partial(),
  reads: ['account.poppy', 'diagnostics'],
  examples: {
    // US-68 m:first-poppy: the Fisheroo Reset open and affordable on a first reset.
    fires: [
      {
        fixture: 'first',
        params: { part: 'fisheroo-reset' },
        mutate: (s) => withAccount(s, { poppy: pondWith({ reset: true }) }),
        expect: { slots: { next: 1 } },
      },
      {
        fixture: 'first',
        params: { part: 'greatest-catch' },
        mutate: (s) => withAccount(s, { poppy: pondWith({ catch: true }) }),
        expect: { slots: { next: 6 } },
      },
    ],
    silent: [
      { fixture: 'first', params: { part: 'fisheroo-reset' } },
      { fixture: 'highend', params: { part: 'fisheroo-reset' } },
      { fixture: 'highend', params: { part: 'greatest-catch' } },
    ],
    unknown: [
      {
        fixture: 'highend',
        params: { part: 'greatest-catch' },
        mutate: (s) => withAccount(s, { poppy: null }),
      },
    ],
  },
  run({ state }, { part }) {
    const p = state.account.poppy;
    if (!isKnown(state, 'account.poppy') || p == null || !p.upgrades || p.totalFish === undefined)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const u = p.upgrades.find((x) => x.name.toLowerCase() === UPGRADE[part]);
    if (!p.unlocked || !u?.unlocked || u.cost <= 0 || p.totalFish < u.cost) return [];
    const next = (part === 'fisheroo-reset' ? (p.fisherooResets ?? 0) : (p.megafish ?? 0)) + 1;
    return [
      {
        subject: accountSubject,
        slots: { next, cost: u.cost },
        result: 'fires' as const,
        urgency: 'banked' as const,
        doneKey: `poppy-${part}-${next}`,
      },
    ];
  },
});
