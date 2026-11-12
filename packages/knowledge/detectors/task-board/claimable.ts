// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-26 (US-21): task tiers whose goal is met but not claimed, on the open boards of Worlds 1-4. A tier
// pays its merits and task points only when tapped on the board. A reset-on-claim task holds at most one
// tier, and its progress past the goal is lost, so it is named first.
import { z } from 'zod';
import { accountSubject, isKnown, withAccount, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'task-board/claimable',
  kind: 'check',
  system: 'task-board',
  params: z.strictObject({}),
  slots: z
    .strictObject({
      count: z.number(),
      merits: z.number(),
      points: z.number(),
      one: z.number(),
      reset: z.number(),
      task: z.string(),
      world: z.number(),
    })
    .partial(),
  reads: ['account.taskBoard', 'diagnostics'],
  examples: {
    // fourth.json: Maximum Efficiency (W2, level 7, x 11, resets on claim) has its tier met.
    fires: [
      {
        fixture: 'fourth',
        expect: {
          slots: { count: 1, merits: 2, points: 25, one: 1, reset: 1, task: 'Maximum_Efficiency', world: 2 },
        },
      },
    ],
    // highend.json: nothing waiting.
    silent: [
      { fixture: 'highend' },
      // The same tier on a board that isn't open: nothing to claim.
      {
        fixture: 'fourth',
        mutate: (s) =>
          s.account.taskBoard
            ? withAccount(s, {
                taskBoard: {
                  ...s.account.taskBoard,
                  worlds: s.account.taskBoard.worlds.map((w) => ({ ...w, open: w.world !== 2 })),
                },
              })
            : s,
      },
    ],
    unknown: [{ fixture: 'fourth', mutate: (s) => withUnknown(s, 'account.taskBoard') }],
  },
  run({ state }) {
    if (!isKnown(state, 'account.taskBoard'))
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const tb = state.account.taskBoard;
    if (!tb) return [];
    const ready = tb.worlds
      .filter((w) => w.open)
      .flatMap((w) => w.tasks.filter((t) => t.ready > 0).map((t) => ({ world: w.world, t })));
    if (ready.length === 0) return [];
    const count = ready.reduce((n, r) => n + r.t.ready, 0);
    const first = [...ready].sort(
      (a, b) =>
        Number(b.t.resetsOnClaim) - Number(a.t.resetsOnClaim) || b.t.ready - a.t.ready || a.world - b.world,
    )[0];
    return [
      {
        subject: accountSubject,
        slots: {
          count,
          merits: ready.reduce((n, r) => n + r.t.merits, 0),
          points: ready.reduce((n, r) => n + r.t.points, 0),
          one: count === 1 ? 1 : 0,
          reset: first?.t.resetsOnClaim ? 1 : 0,
          task: first?.t.name ?? '',
          world: first?.world ?? 0,
        },
        result: 'fires' as const,
        doneKey: `task-claim-${ready.map((r) => `${r.world}.${r.t.index}.${r.t.level}`).join('-')}`,
      },
    ];
  },
});
