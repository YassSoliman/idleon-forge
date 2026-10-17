// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-31, TR-6, D6: a Refinery salt unlocked but switched off. Off salts merge into one Account
// finding, in Refinery order, with the first one's Next Action: `switch-on` when Toolbox reports no
// missing fuel at its rank (hasMissingMats, which covers the previous salt it burns), else `fuel`, for
// its first short input. One entry per form. The entries apply from W3-early; the Detector also needs
// the account in World 3 (`minWorld`), since the save lists the first salt as unlocked on every
// account. The why slot says when the first off salt is Explosive and the Death Note is still at Lv 0.
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'refinery/salt-off',
  kind: 'check',
  system: 'refinery',
  params: z.strictObject({
    form: z.enum(['switch-on', 'fuel']),
    minWorld: z.int().min(1).default(3),
  }),
  slots: z
    .strictObject({ salt: z.string(), material: z.string(), more: z.number(), offSalts: z.number() })
    .partial(),
  reads: ['account.salts', 'account.currentWorld', 'diagnostics'],
  examples: {
    fires: [
      // W3-early: Explosive is off and short 1 Bullfrog Horn (9 of 10).
      {
        fixture: 'scrubbed-w3',
        params: { form: 'fuel' },
        expect: { slots: { salt: 'Explosive_Salts', material: 'Bullfrog_Horn', more: 1, offSalts: 1 } },
      },
      {
        fixture: 'scrubbed-w3',
        params: { form: 'switch-on' },
        mutate: (s) =>
          withAccount(s, { salts: (s.account.salts ?? []).map((x) => ({ ...x, missingFuel: [] })) }),
        expect: { slots: { salt: 'Explosive_Salts' } },
      },
    ],
    silent: [
      { fixture: 'scrubbed-w3', params: { form: 'switch-on' } },
      // W2-late lists Redox as unlocked and off, but the account has not reached World 3.
      { fixture: 'scrubbed-w2', params: { form: 'switch-on' } },
      { fixture: 'scrubbed-w2', params: { form: 'fuel' } },
    ],
    unknown: [
      { fixture: 'scrubbed-w3', params: { form: 'fuel' }, mutate: (s) => withAccount(s, { salts: null }) },
    ],
  },
  run({ state }, { form, minWorld }) {
    const { salts, currentWorld } = state.account;
    if (!isKnown(state, 'account.salts') || salts == null || currentWorld == null)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    if (currentWorld < minWorld) return [];
    // M6's part of each shared salt entry (SaltState) is set by the adapter; without it, unknown.
    if (salts.some((s) => s.active === undefined || s.missingFuel === undefined || s.name === undefined))
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const off = salts.filter((s) => s.unlocked && !s.active);
    const first = off[0];
    if (!first) return [];
    const short = first.missingFuel?.[0];
    if ((form === 'fuel') !== (short !== undefined)) return [];
    return [
      {
        subject: accountSubject,
        slots: {
          salt: first.name ?? '',
          offSalts: off.length,
          ...(short ? { material: short.name, more: short.need - short.have } : {}),
        },
        result: 'fires' as const,
        urgency: 'losing-now' as const,
        doneKey: off.map((s) => s.rawName).join(','),
      },
    ];
  },
});
