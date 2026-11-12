// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-25: bars waiting in the Forge's output slots (Toolbox `forge.list[].bar`, owner "forge"): the
// Anvil, stamps and vials only use bars in storage or a bag.
import { z } from 'zod';
import { accountSubject, isKnown, withAccount, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'forge/collect-bars',
  kind: 'check',
  system: 'forge',
  params: z.strictObject({ atLeast: z.number().default(1) }),
  slots: z.strictObject({ bars: z.number(), bar: z.string(), kinds: z.number() }).partial(),
  reads: ['account.forge', 'diagnostics'],
  examples: {
    fires: [{ fixture: 'fourth', expect: { slots: { bars: 16, bar: 'Godshard_Bar', kinds: 1 } } }],
    silent: [
      {
        fixture: 'fourth',
        mutate: (s) =>
          s.account.forge
            ? withAccount(s, {
                forge: { ...s.account.forge, slots: s.account.forge.slots.map((x) => ({ ...x, bar: null })) },
              })
            : s,
      },
    ],
    unknown: [{ fixture: 'fourth', mutate: (s) => withUnknown(s, 'account.forge') }],
  },
  run({ state }, { atLeast }) {
    if (!isKnown(state, 'account.forge'))
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const f = state.account.forge;
    if (!f) return [];
    const byBar = new Map<string, number>();
    for (const s of f.slots) if (s.bar) byBar.set(s.bar.name, (byBar.get(s.bar.name) ?? 0) + s.bar.amount);
    const bars = [...byBar.values()].reduce((n, x) => n + x, 0);
    if (bars < atLeast) return [];
    const top = [...byBar.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    return [
      {
        subject: accountSubject,
        slots: { bars, bar: top?.[0] ?? '', kinds: byBar.size },
        result: 'fires' as const,
        doneKey: `forge-bars-${bars}`,
      },
    ];
  },
});
