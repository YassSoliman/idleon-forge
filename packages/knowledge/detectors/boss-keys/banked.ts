// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-7, TR-6: boss keys banked at their NPC. Each key type with keys a day fires when its counter is
// at `fireAtDays` or more, or when the resets before the player's return push it past the bank cap
// (the counter is never capped; only the banked amount is). Key types firing for the same character
// merge into one finding, placed on a character who can collect (TR-7): the last-played character if
// eligible, else the highest-level eligible one, ties to the lowest index.
import { countdownEnd, DAILY_RESET_PERIOD_MS as DAY_MS, resetsSinceSave } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, characterSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'boss-keys/banked',
  kind: 'check',
  system: 'boss-keys',
  params: z.strictObject({
    fireAtDays: z.int().min(1).default(2),
    bankCapDays: z.int().min(1).default(3),
  }),
  slots: z
    .strictObject({
      total: z.number(),
      forestVilla: z.number(),
      efaunt: z.number(),
      chizoar: z.number(),
      daysLost: z.number(),
    })
    .partial(),
  reads: [
    'account.keys',
    'account.lastCloudSave',
    'account.dailyResetInSeconds',
    'lastPlayedCharacterIndex',
    'characters[*].index',
    'characters[*].level',
    'diagnostics',
  ],
  examples: {
    fires: [
      // W3-early: Forest Villa 2 days (2 a day) and Efaunt 2 days (1 a day) on the Squire Lv 85.
      { fixture: 'scrubbed-w3', subject: characterSubject(3), expect: { slots: { total: 6 } } },
    ],
    silent: [
      // W2-late: Forest Villa 1 day banked; Efaunt and Chizoar earn nothing.
      { fixture: 'scrubbed-w2' },
      { fixture: 'scrubbed-w3', subject: characterSubject(5) },
    ],
    unknown: [{ fixture: 'scrubbed-w2', mutate: (s) => withAccount(s, { keys: null }) }],
  },
  run({ state, now, expectedReturnMs }, { fireAtDays, bankCapDays }) {
    const { keys } = state.account;
    if (!isKnown(state, 'account.keys') || keys === null)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const resetsNow = resetsSinceSave(state, now);
    const ret = now + expectedReturnMs;
    const resetsRet = resetsSinceSave(state, ret);
    const firstReset = countdownEnd(state, state.account.dailyResetInSeconds);
    if (resetsNow === null || resetsRet === null || firstReset === null)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const nextReset = firstReset + resetsNow * DAY_MS;

    const level = (i: number) => state.characters.find((c) => c.index === i)?.level ?? 0;
    const place = (collectors: number[]): number | null => {
      const last = state.lastPlayedCharacterIndex;
      if (last !== null && collectors.includes(last)) return last;
      const sorted = [...collectors].sort((a, b) => level(b) - level(a) || a - b);
      return sorted[0] ?? null;
    };

    type Hit = {
      id: string;
      amount: number;
      lost: number;
      urgency: 'losing-now' | 'lost-before-return' | 'banked';
      deadline?: number;
    };
    const byCharacter = new Map<number, Hit[]>();
    for (const k of keys) {
      if (k.perDay <= 0 || k.daysSincePickup === null) continue;
      const days = k.daysSincePickup + resetsNow;
      const daysAtReturn = k.daysSincePickup + resetsRet;
      if (days < fireAtDays && daysAtReturn <= bankCapDays) continue;
      const who = place(k.collectors);
      if (who === null) continue;
      const hit: Hit =
        days > bankCapDays
          ? { id: k.id, amount: 0, lost: days - bankCapDays, urgency: 'losing-now' }
          : daysAtReturn > bankCapDays
            ? {
                id: k.id,
                amount: 0,
                lost: 0,
                urgency: 'lost-before-return',
                // The reset that takes the counter past the cap.
                deadline: firstReset + (bankCapDays - k.daysSincePickup) * DAY_MS,
              }
            : { id: k.id, amount: 0, lost: 0, urgency: 'banked' };
      hit.amount = Math.min(days, bankCapDays) * k.perDay;
      byCharacter.set(who, [...(byCharacter.get(who) ?? []), hit]);
    }

    const rank = { 'losing-now': 0, 'lost-before-return': 1, banked: 2 } as const;
    return [...byCharacter.entries()]
      .sort(([a], [b]) => a - b)
      .map(([index, hits]) => {
        const urgency = hits.reduce<Hit['urgency']>(
          (u, h) => (rank[h.urgency] < rank[u] ? h.urgency : u),
          'banked',
        );
        const deadlines = hits.flatMap((h) => (h.deadline === undefined ? [] : [h.deadline]));
        const amount = (id: string) => hits.find((h) => h.id === id)?.amount ?? 0;
        return {
          subject: characterSubject(index),
          slots: {
            total: hits.reduce((s, h) => s + h.amount, 0),
            forestVilla: amount('forest-villa'),
            efaunt: amount('efaunt'),
            chizoar: amount('chizoar'),
            daysLost: Math.max(0, ...hits.map((h) => h.lost)),
          },
          result: 'fires' as const,
          urgency,
          ...(urgency === 'lost-before-return' && deadlines.length
            ? { deadline: Math.min(...deadlines) }
            : {}),
          doneKey: hits
            .map((h) => h.id)
            .sort()
            .join(','),
          nextChangeAt: nextReset,
        };
      });
  },
});
