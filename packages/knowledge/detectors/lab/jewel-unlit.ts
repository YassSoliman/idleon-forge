// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-12: a jewel bought at the Jewel Spinner sits dark, with no connected character in its reach
// (Toolbox lab.ts `checkConnection`). Only while the Lab has a connected character; one finding, the
// first such jewel, with the count.
import { z } from 'zod';
import { accountSubject, isKnown, withAccount, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'lab/jewel-unlit',
  kind: 'check',
  system: 'lab',
  params: z.strictObject({}),
  slots: z.strictObject({ jewel: z.string(), dark: z.number() }).partial(),
  reads: ['account.lab', 'diagnostics'],
  examples: {
    // fourth.json: 8 jewels owned, none lit.
    fires: [{ fixture: 'fourth', expect: { slots: { dark: 8 } } }],
    silent: [
      { fixture: 'first' },
      // Nobody connected: first-upload says what to do first.
      {
        fixture: 'fourth',
        mutate: (s) =>
          s.account.lab
            ? withAccount(s, {
                lab: {
                  ...s.account.lab,
                  characters: s.account.lab.characters.map((c) => ({ ...c, connected: false })),
                },
              })
            : s,
      },
    ],
    unknown: [{ fixture: 'first', mutate: (s) => withUnknown(s, 'account.lab') }],
  },
  run({ state }) {
    if (!isKnown(state, 'account.lab'))
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const lab = state.account.lab;
    if (!lab || !lab.characters.some((c) => c.connected)) return [];
    const dark = lab.jewels.filter((j) => j.owned && !j.lit);
    const first = dark[0];
    if (!first) return [];
    return [
      {
        subject: accountSubject,
        slots: { jewel: first.name, dark: dark.length },
        result: 'fires' as const,
        doneKey: `jewel-${first.index}`,
      },
    ];
  },
});
