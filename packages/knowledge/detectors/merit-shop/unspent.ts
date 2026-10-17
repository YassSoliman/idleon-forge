// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-19, TR-6: unspent merits in one world. A world fires when its unspent merits cover the
// cheapest unmaxed real row (null-cost rows are placeholders). The authored order (`order`, by
// generated row id from merit-shop.fact.rows, R6) names what to buy first: the first item that is
// below its target and that the merits cover. One entry per order row sets `row`, and fires only when
// that row is the one to buy; the world's generic entry (no `row`) fires when the order names nothing
// (an unmapped world, or no order row affordable).
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

/**
 * Row id -> row index within its world, from merit-shop.fact.rows at the pin (`slot`). Kept here
 * because Detectors run without the compiled facts in tests; test/m6-facts.test.ts checks it against
 * the generated table, so a re-sync that moves a row fails CI.
 */
export const ROW_INDEX: Readonly<Record<string, number>> = {
  'w1-task-sa1': 0,
  'w1-task-sa2': 1,
  'w1-task-sb5': 2,
  'w1-task-sbb1': 3,
  'w1-task-sb4': 4,
  'w1-smithing-recipes1': 5,
  'w1-talent-book1': 6,
  'w2-task-sb3': 0,
  'w2-task-sb2': 1,
  'w2-task-sa3': 2,
  'w2-task-sb1': 3,
  'w2-task-sa4': 4,
  'w2-smithing-recipes2': 5,
  'w2-talent-book1': 6,
  'w2-task-sbb2': 7,
  'w3-task-sc1': 0,
  'w3-task-sc2': 1,
  'w3-task-sc3': 2,
  'w3-task-sc5': 3,
  'w3-task-sc4': 4,
  'w3-smithing-recipes3': 5,
  'w3-task-sc6': 6,
  'w4-task-sbd2': 0,
  'w4-task-sbd1': 1,
  'w4-task-sbd4': 2,
  'w4-task-sbd5': 3,
  'w4-task-sbd3': 4,
  'w4-smithing-recipes4': 5,
  'w4-task-sbd6': 6,
};

const OrderItem = z.strictObject({
  /** A row id of merit-shop.fact.rows, e.g. "w2-task-sb2". */
  row: z.string().regex(/^w[1-7]-[a-z0-9-]+$/),
  /** Buy up to this level; `characters` = the number of characters on the account. Default: max. */
  upTo: z.union([z.int().positive(), z.literal('characters')]).optional(),
});

export default defineDetector({
  id: 'merit-shop/unspent',
  kind: 'check',
  system: 'merit-shop',
  params: z.strictObject({
    world: z.int().min(1).max(4),
    order: z.array(OrderItem).default([]),
    /** Set on a row entry: fire only when this row is the one to buy first. */
    row: z.string().optional(),
  }),
  slots: z.strictObject({ unspent: z.number(), world: z.number() }).partial(),
  reads: ['account.merits', 'characters', 'diagnostics'],
  examples: {
    fires: [
      // W2-late: 12 W1 merits; W1's order is not mapped yet (R6), so the generic entry fires.
      { fixture: 'scrubbed-w2', params: { world: 1 }, expect: { slots: { unspent: 12, world: 1 } } },
      // W3-early: 1 W2 merit; Obol and AFK gains are maxed, so respawn is next (PV 7.2).
      {
        fixture: 'scrubbed-w3',
        params: {
          world: 2,
          row: 'w2-task-sb2',
          order: [
            { row: 'w2-task-sb3', upTo: 1 },
            { row: 'w2-task-sa3', upTo: 'characters' },
            { row: 'w2-task-sb2' },
          ],
        },
        expect: { slots: { unspent: 1 } },
      },
    ],
    silent: [
      { fixture: 'scrubbed-w2', params: { world: 2 } },
      {
        fixture: 'scrubbed-w3',
        params: { world: 2, order: [{ row: 'w2-task-sb2' }] },
      },
    ],
    unknown: [
      { fixture: 'scrubbed-w2', params: { world: 1 }, mutate: (s) => withAccount(s, { merits: null }) },
    ],
  },
  run({ state }, { world, order, row }) {
    const merits = state.account.merits;
    if (!isKnown(state, 'account.merits') || merits == null)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const w = merits.find((m) => m.world === world);
    if (!w || w.unspent <= 0) return [];
    const real = w.rows.filter((r) => r.cost != null && r.level < r.max);
    if (real.length === 0) return [];
    const cheapest = Math.min(...real.map((r) => r.cost as number));
    if (w.unspent < cheapest) return [];
    // The first order item below its target that the merits cover (Account State rows are by index).
    let first: string | null = null;
    for (const item of order) {
      const i = ROW_INDEX[item.row];
      const r = i === undefined ? undefined : w.rows[i];
      if (!r || r.cost == null) continue;
      const target = item.upTo === 'characters' ? state.characters.length : (item.upTo ?? r.max);
      if (r.level >= Math.min(target, r.max)) continue;
      if (w.unspent >= r.cost) {
        first = item.row;
        break;
      }
    }
    if (row !== undefined ? first !== row : first != null) return [];
    return [
      {
        subject: accountSubject,
        slots: { unspent: w.unspent, world },
        result: 'fires' as const,
        urgency: 'banked' as const,
        doneKey: `merits-w${world}`,
      },
    ];
  },
});
