// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-21, D2, Final rulings RT2: unspent gems. Three forms, one entry each:
// - `printer-progress` (nice, a Milestone): the Infinity Hammer is owned, or the account reached
//   World 3, the Crystal 3D Printer is not owned and gems are short of its price;
// - `printer-buy`: the same, with gems covering the price;
// - `contested`: otherwise (before both, or once the printer is owned), "N gems unspent" with both
//   PV 7.5 sides; the entry is contested, so it is never position 1 or the first Account Goal.
// Prices and GemItemsPurchased indices are params whose defaults match gem-shop.fact.items at the pin
// (test/m6-unspent.test.ts checks them against the generated table).
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'gem-shop/unspent',
  kind: 'check',
  system: 'gem-shop',
  params: z.strictObject({
    form: z.enum(['contested', 'printer-progress', 'printer-buy']),
    // gem-shop.fact.items: INFINITY_HAMMER (GemP1) and CRYSTAL_3D_PRINTER (GemQ1).
    hammerIndex: z.int().min(0).default(103),
    printerIndex: z.int().min(0).default(111),
    printerPrice: z.int().positive().default(875),
    /** World 3 entry: from this world on, the printer form applies without the hammer (RT2). */
    printerWorld: z.int().min(1).default(3),
  }),
  slots: z.strictObject({ gems: z.number(), price: z.number() }).partial(),
  reads: ['account.gems', 'account.gemPurchases', 'account.currentWorld', 'diagnostics'],
  examples: {
    fires: [
      // W2-late: 628 gems, nothing bought, no Infinity Hammer: the contested count.
      { fixture: 'scrubbed-w2', params: { form: 'contested' }, expect: { slots: { gems: 628 } } },
      // W3-early: 365 gems, no printer.
      {
        fixture: 'scrubbed-w3',
        params: { form: 'printer-progress' },
        expect: { slots: { gems: 365, price: 875 } },
      },
      // A W2-late account that owns the Infinity Hammer.
      {
        fixture: 'scrubbed-w2',
        params: { form: 'printer-progress' },
        mutate: (s) =>
          withAccount(s, { gemPurchases: (s.account.gemPurchases ?? []).map((n, i) => (i === 103 ? 1 : n)) }),
        expect: { slots: { gems: 628 } },
      },
      // A W3 account with 900 gems.
      {
        fixture: 'scrubbed-w3',
        params: { form: 'printer-buy' },
        mutate: (s) => withAccount(s, { gems: 900 }),
      },
    ],
    silent: [
      { fixture: 'scrubbed-w2', params: { form: 'printer-progress' } },
      { fixture: 'scrubbed-w3', params: { form: 'contested' } },
      { fixture: 'scrubbed-w3', params: { form: 'printer-buy' } },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        params: { form: 'contested' },
        mutate: (s) => withAccount(s, { gems: null }),
      },
    ],
  },
  run({ state }, { form, hammerIndex, printerIndex, printerPrice, printerWorld }) {
    const { gems, gemPurchases, currentWorld } = state.account;
    const known =
      isKnown(state, 'account.gems') &&
      isKnown(state, 'account.gemPurchases') &&
      isKnown(state, 'account.currentWorld') &&
      gems != null &&
      gemPurchases != null &&
      currentWorld != null;
    if (!known)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    if (gems <= 0) return [];
    const hammer = (gemPurchases[hammerIndex] ?? 0) > 0;
    const printer = (gemPurchases[printerIndex] ?? 0) > 0;
    const printerForm = !printer && (hammer || currentWorld >= printerWorld);
    const which = !printerForm ? 'contested' : gems >= printerPrice ? 'printer-buy' : 'printer-progress';
    if (which !== form) return [];
    return [
      {
        subject: accountSubject,
        slots: { gems, price: printerPrice },
        result: 'fires' as const,
        urgency: 'banked' as const,
        doneKey: 'gems',
      },
    ];
  },
});
