// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-25: smelting Forge slots that empty before the Expected Return, where topping up changes the
// outcome (#70 A5): the slot has room for at least one more bar of its ore under the capacity, and the
// account holds that ore. A pill, never a blocker. The run times are Toolbox's `timeTillEmpty`.
import { z } from 'zod';
import { accountSubject, isKnown, withAccount, withUnknown } from '../../src/helpers';
import { type CheckFinding, defineDetector } from '../../src/types';

export default defineDetector({
  id: 'forge/runs-out-before-return',
  kind: 'check',
  system: 'forge',
  params: z.strictObject({}),
  slots: z
    .strictObject({ slots: z.number(), emptyIn: z.number(), capacity: z.number(), fullRun: z.number() })
    .partial(),
  reads: ['account.forge', 'diagnostics'],
  examples: {
    fires: [
      // fourth.json with each slot down to 2 bars of Godshard (empties within the 8 h return).
      {
        fixture: 'fourth',
        mutate: (s) => {
          const f = s.account.forge;
          if (!f) return s;
          return withAccount(s, {
            forge: {
              ...f,
              slots: f.slots.map((x) =>
                x.ore
                  ? { ...x, ore: { ...x.ore, amount: 12000 }, emptyInSeconds: x.emptyInSeconds * (2 / 3) }
                  : x,
              ),
            },
          });
        },
        expect: { slots: { slots: 16, capacity: 20669 } },
      },
    ],
    // fourth.json: every slot is at capacity, so topping up changes nothing.
    silent: [{ fixture: 'fourth' }],
    unknown: [{ fixture: 'fourth', mutate: (s) => withUnknown(s, 'account.forge') }],
  },
  run({ state, expectedReturnMs }) {
    if (!isKnown(state, 'account.forge'))
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const f = state.account.forge;
    if (!f) return [];
    const heldOf = (raw: string) => f.oresHeld.find((o) => o.rawName === raw)?.amount ?? 0;
    const dry = f.slots.filter(
      (s) =>
        s.unlocked &&
        s.smelting &&
        s.ore !== null &&
        s.emptyInSeconds * 1000 < expectedReturnMs &&
        s.ore.amount + s.ore.perBar <= f.oreCapacity &&
        heldOf(s.ore.rawName) >= s.ore.perBar,
    );
    const first = [...dry].sort((a, b) => a.emptyInSeconds - b.emptyInSeconds)[0];
    if (!first?.ore) return [];
    const cycles = Math.max(1, Math.floor(first.ore.amount / first.ore.perBar));
    const perBarMs = (first.emptyInSeconds * 1000) / cycles;
    const out: CheckFinding = {
      subject: accountSubject,
      slots: {
        slots: dry.length,
        emptyIn: Math.round(first.emptyInSeconds * 1000),
        capacity: f.oreCapacity,
        fullRun: Math.round(Math.floor(f.oreCapacity / first.ore.perBar) * perBarMs),
      },
      result: 'fires',
      doneKey: `forge-dry-${dry.length}`,
    };
    return [out];
  },
});
