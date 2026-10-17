// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-22, FR-26, FR-27, TR-6: the Post Office, one part per entry.
// - `unlock`: the highest class level reaches `unlockLevel` and nobody has finished Postboy Pablob's
//   quest. On the character with the quest in progress (else the highest level, ties to the lowest
//   index); the slot counts the boxes already waiting on that character.
// - `orders`: unlocked, and a company has no order completed today. Urgency from the Post Office's own
//   refresh timer, not the shop restock.
// - `boxes`: unlocked, one finding per character with unspent boxes.
import { countdownEnd, eventsBetween, nextEventAfter } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, characterSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'post-office/state',
  kind: 'check',
  system: 'post-office',
  params: z.strictObject({
    part: z.enum(['unlock', 'orders', 'boxes']),
    // Leverage model / W1 dossier: Postboy Pablob offers the quest from class level 50.
    unlockLevel: z.int().positive().default(50),
  }),
  slots: z.strictObject({ boxes: z.number(), companies: z.number() }).partial(),
  reads: [
    'account.postOffice',
    'account.highestLevel',
    'account.lastCloudSave',
    'characters[*].index',
    'characters[*].level',
    'characters[*].postOfficeUnspent',
    'diagnostics',
  ],
  examples: {
    fires: [
      // W2-late: the Barbarian Lv 60 has the quest in progress.
      { fixture: 'scrubbed-w2', params: { part: 'unlock' }, subject: characterSubject(0) },
      // W3-early: the Squire Lv 85, with 4 boxes already waiting.
      {
        fixture: 'scrubbed-w3',
        params: { part: 'unlock' },
        subject: characterSubject(3),
        expect: { slots: { boxes: 4 } },
      },
      {
        fixture: 'scrubbed-w3',
        params: { part: 'boxes' },
        subject: characterSubject(0),
        mutate: (s) =>
          withAccount(s, { postOffice: s.account.postOffice && { ...s.account.postOffice, unlocked: true } }),
        expect: { slots: { boxes: 4 } },
      },
    ],
    silent: [
      // The Post Office is not unlocked on either account.
      { fixture: 'scrubbed-w3', params: { part: 'boxes' } },
      { fixture: 'scrubbed-w3', params: { part: 'orders' } },
      { fixture: 'scrubbed-w2', params: { part: 'unlock' }, subject: characterSubject(1) },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        params: { part: 'unlock' },
        mutate: (s) => withAccount(s, { postOffice: null }),
      },
    ],
  },
  run({ state, now, expectedReturnMs }, { part, unlockLevel }) {
    const po = state.account.postOffice;
    const highest = state.account.highestLevel;
    if (!isKnown(state, 'account.postOffice') || po === null || highest === null)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const boxesOn = (i: number) => {
      const c = state.characters.find((x) => x.index === i);
      return c && isKnown(state, `characters[${i}].postOfficeUnspent`) ? (c.postOfficeUnspent ?? 0) : 0;
    };
    if (part === 'unlock') {
      if (po.unlocked || highest < unlockLevel) return [];
      const holder =
        po.questInProgressOn[0] ??
        [...state.characters].sort((a, b) => b.level - a.level || a.index - b.index)[0]?.index;
      if (holder === undefined) return [];
      return [
        {
          subject: characterSubject(holder),
          slots: { boxes: boxesOn(holder) },
          result: 'fires' as const,
          urgency: 'banked' as const,
          doneKey: 'post-office-unlock',
        },
      ];
    }
    if (!po.unlocked) return [];
    if (part === 'boxes')
      return state.characters
        .filter((c) => boxesOn(c.index) > 0)
        .map((c) => ({
          subject: characterSubject(c.index),
          slots: { boxes: boxesOn(c.index) },
          result: 'fires' as const,
          urgency: 'banked' as const,
          doneKey: `post-office-boxes:${c.index}`,
        }));
    // orders: refreshed on the Post Office's own timer; after a refresh since the save, every company is open again.
    const first = countdownEnd(state, po.refreshInSeconds);
    const saved = state.account.lastCloudSave;
    if (first === null || saved === null)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const refreshed = eventsBetween(first, saved, now) >= 1;
    const companies = refreshed ? Math.max(po.companiesNotDoneToday, 1) : po.companiesNotDoneToday;
    if (companies <= 0) return [];
    const next = nextEventAfter(first, now);
    return [
      {
        subject: accountSubject,
        slots: { companies },
        result: 'fires' as const,
        urgency: next < now + expectedReturnMs ? ('lost-before-return' as const) : ('banked' as const),
        deadline: next,
        doneKey: 'post-office-orders',
        nextChangeAt: next,
      },
    ];
  },
});
