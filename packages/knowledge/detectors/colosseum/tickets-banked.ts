// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-8, TR-6: Colosseum tickets banked at the three ticket NPCs. Only reachable NPCs count (Typhoon
// always, Centurion once World 1 is finished, Lonely Hunter once World 2 is; Toolbox areKeysOverdue),
// one ticket a day each. The FR-7 rule decides whether a reachable NPC fires; when any does, one
// Account finding counts every reachable NPC's banked tickets, since they are collected in one trip.
import { countdownEnd, DAILY_RESET_PERIOD_MS as DAY_MS, resetsSinceSave } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'colosseum/tickets-banked',
  kind: 'check',
  system: 'colosseum',
  params: z.strictObject({
    fireAtDays: z.int().min(1).default(2),
    bankCapDays: z.int().min(1).default(3),
  }),
  slots: z.strictObject({ total: z.number(), cappedNpcs: z.number(), daysLost: z.number() }).partial(),
  reads: ['account.colosseumTickets', 'account.lastCloudSave', 'account.dailyResetInSeconds', 'diagnostics'],
  examples: {
    fires: [
      // W3-early: Lonely Hunter 3, Typhoon 1, Centurion 0; one NPC capped for 2 days.
      { fixture: 'scrubbed-w3', expect: { slots: { total: 4, daysLost: 2 }, urgency: 'losing-now' } },
      // W2-late: Typhoon 3 and Centurion 2; Lonely Hunter unreachable although its counter reads 4.
      { fixture: 'scrubbed-w2', expect: { slots: { total: 5, daysLost: 1 } } },
    ],
    silent: [
      {
        fixture: 'scrubbed-w2',
        mutate: (s) =>
          withAccount(s, {
            colosseumTickets: (s.account.colosseumTickets ?? []).map((t) => ({ ...t, daysSincePickup: 0 })),
          }),
      },
    ],
    unknown: [{ fixture: 'scrubbed-w2', mutate: (s) => withAccount(s, { colosseumTickets: null }) }],
  },
  run({ state, now, expectedReturnMs }, { fireAtDays, bankCapDays }) {
    const tickets = state.account.colosseumTickets;
    const unknown = [
      { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
    ];
    if (!isKnown(state, 'account.colosseumTickets') || tickets == null) return unknown;
    const resetsNow = resetsSinceSave(state, now);
    const resetsRet = resetsSinceSave(state, now + expectedReturnMs);
    const firstReset = countdownEnd(state, state.account.dailyResetInSeconds);
    if (resetsNow == null || resetsRet == null || firstReset == null) return unknown;

    const reachable = tickets.filter((t) => t.reachable && t.daysSincePickup != null);
    let fires = false;
    let urgency: 'losing-now' | 'lost-before-return' | 'banked' = 'banked';
    const deadlines: number[] = [];
    let total = 0;
    let capped = 0;
    let daysLost = 0;
    for (const t of reachable) {
      const saved = t.daysSincePickup as number;
      const days = saved + resetsNow;
      const atReturn = saved + resetsRet;
      total += Math.min(days, bankCapDays);
      if (days > bankCapDays) {
        capped += 1;
        daysLost = Math.max(daysLost, days - bankCapDays);
      }
      if (days < fireAtDays && atReturn <= bankCapDays) continue;
      fires = true;
      if (days > bankCapDays) urgency = 'losing-now';
      else if (atReturn > bankCapDays) {
        if (urgency === 'banked') urgency = 'lost-before-return';
        deadlines.push(firstReset + (bankCapDays - saved) * DAY_MS);
      }
    }
    if (!fires) return [];
    return [
      {
        subject: accountSubject,
        slots: { total, cappedNpcs: capped, daysLost },
        result: 'fires' as const,
        urgency,
        ...(urgency === 'lost-before-return' && deadlines.length ? { deadline: Math.min(...deadlines) } : {}),
        doneKey: 'colosseum-tickets',
        nextChangeAt: firstReset + resetsNow * DAY_MS,
      },
    ];
  },
});
