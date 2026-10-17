// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-32, TR-6, D6: the Death Note building still at Lv 0 once Explosive Salt is unlocked, so
// multikill pays nothing. Two forms, one entry each: `slot` when it is not in a Construction build
// slot; `salts` when it is in one and the account holds fewer of its level-1 cost (Explosive Salts)
// than needed. In a slot with the salts held, it finishes on its own: silent. Applies from W3-early;
// the Detector also needs the account in World 3 (`minWorld`).
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'death-note/build',
  kind: 'check',
  system: 'death-note',
  params: z.strictObject({
    form: z.enum(['slot', 'salts']),
    minWorld: z.int().min(1).default(3),
    /** The salt whose unlock opens this Check: Explosive (refinery.fact.salts order 1). */
    saltRawName: z.string().default('Refinery2'),
  }),
  slots: z.strictObject({ cost: z.number(), held: z.number() }).partial(),
  reads: [
    'account.deathNoteBuilding',
    'account.buildings',
    'account.salts',
    'account.currentWorld',
    'diagnostics',
  ],
  examples: {
    fires: [
      // W3-early: Lv 0, in a build slot, 0 of 10 Explosive Salts.
      { fixture: 'scrubbed-w3', params: { form: 'salts' }, expect: { slots: { cost: 10, held: 0 } } },
      {
        fixture: 'scrubbed-w3',
        params: { form: 'slot' },
        mutate: (s) =>
          withAccount(s, {
            deathNoteBuilding: s.account.deathNoteBuilding && {
              ...s.account.deathNoteBuilding,
              inBuildSlot: false,
            },
          }),
      },
    ],
    silent: [
      { fixture: 'scrubbed-w3', params: { form: 'slot' } },
      {
        fixture: 'scrubbed-w3',
        params: { form: 'salts' },
        mutate: (s) =>
          withAccount(s, {
            deathNoteBuilding: s.account.deathNoteBuilding && { ...s.account.deathNoteBuilding, held: 10 },
          }),
      },
      { fixture: 'scrubbed-w2', params: { form: 'slot' } },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w3',
        params: { form: 'salts' },
        mutate: (s) => withAccount(s, { deathNoteBuilding: null }),
      },
    ],
  },
  run({ state }, { form, minWorld, saltRawName }) {
    const { deathNoteBuilding: dn, salts, currentWorld } = state.account;
    // The level is M2's `buildings.deathNote` (the one building-level field).
    const level = state.account.buildings?.deathNote;
    const known =
      isKnown(state, 'account.deathNoteBuilding') &&
      isKnown(state, 'account.buildings') &&
      isKnown(state, 'account.salts') &&
      dn != null &&
      salts != null &&
      level != null &&
      currentWorld != null;
    if (!known)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    if (currentWorld < minWorld || level >= 1) return [];
    if (!salts.some((s) => s.rawName === saltRawName && s.unlocked)) return [];
    if (form === 'slot') {
      if (dn.inBuildSlot) return [];
      return [
        {
          subject: accountSubject,
          slots: {},
          result: 'fires' as const,
          urgency: 'losing-now' as const,
          doneKey: 'death-note',
        },
      ];
    }
    if (!dn.inBuildSlot || !dn.nextCost || dn.held >= dn.nextCost.amount) return [];
    return [
      {
        subject: accountSubject,
        slots: { cost: dn.nextCost.amount, held: dn.held },
        result: 'fires' as const,
        urgency: 'losing-now' as const,
        doneKey: 'death-note',
      },
    ];
  },
});
