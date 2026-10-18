// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-4, TR-5 the stamps material Contribution: a skiller gathering the material an owned stamp's next
// cap raise needs, while storage holds less than the raise costs, is gathering for it. Yes or no
// (FR-6). The price is M7's worker re-evaluation at the current discount (`spend.stamps[].raise`),
// never the parsed save's own price, which is the Gilded one (×0.05, M7 FR-10).
import { z } from 'zod';
import {
  characterSubject,
  GATHERING,
  isKnown,
  PURPOSE_ENGINE_SLOTS,
  purposeGoalParam,
  withAccount,
  withUnknown,
} from '../../src/helpers';
import { type ContributionFinding, defineDetector } from '../../src/types';

const NODES = 'skills.fact.nodes';

export default defineDetector({
  id: 'stamps/material',
  kind: 'contribution',
  system: 'stamps',
  params: z.strictObject({
    afkType: z.enum(['MINING', 'CHOPPIN', 'FISHING', 'CATCHING']),
    ...purposeGoalParam,
  }),
  slots: z
    .strictObject({
      saved: z.number(),
      rule: z.number(),
      target: z.string(),
      stamp: z.string(),
      short: z.number(),
      ...PURPOSE_ENGINE_SLOTS,
    })
    .partial(),
  reads: [
    'characters[*].index',
    'characters[*].afkType',
    'characters[*].afkTarget',
    'characters[*].targetMonster',
    'account.spend',
    'diagnostics',
  ],
  examples: {
    // W2-late Squire Lv 43 mines Copper: Mana Stamp's next raise costs 1,371 Copper Ore, 1,294 in storage.
    fires: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(1),
        params: { afkType: 'MINING' },
        expect: { slots: { stamp: 'Mana_Stamp', short: 77 } },
      },
    ],
    silent: [
      // The W3-early Squire Lv 51 mines Gold, which no owned stamp's next raise is short of.
      { fixture: 'scrubbed-w3', subject: characterSubject(1), params: { afkType: 'MINING' } },
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(1),
        params: { afkType: 'MINING' },
        mutate: (s) =>
          withAccount(s, {
            spend: s.account.spend && {
              ...s.account.spend,
              stamps: (s.account.spend.stamps ?? []).map((x) =>
                x.raise ? { ...x, raise: { ...x.raise, ownedInStorage: 1e9 } } : x,
              ),
            },
          }),
      },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(1),
        params: { afkType: 'MINING' },
        mutate: (s) => withUnknown(s, 'account.spend.stamps'),
      },
    ],
  },
  run(ctx, { afkType }) {
    const { state } = ctx;
    const nodes =
      (ctx.facts.get(NODES) as { rows?: { target: string; item: string }[] } | undefined)?.rows ?? [];
    return state.characters.flatMap((c): ContributionFinding[] => {
      if (c.afkType !== afkType || !(GATHERING as readonly string[]).includes(afkType) || !c.targetMonster)
        return [];
      const subject = characterSubject(c.index);
      const stamps = state.account.spend?.stamps;
      if (!isKnown(state, 'account.spend.stamps') || !stamps)
        return [{ subject, slots: {}, advances: 'unknown' as const }];
      const item = nodes.find((n) => n.target === c.targetMonster)?.item ?? c.targetMonster;
      const short = stamps
        .flatMap((s) => (s.raise && s.raise.material === item ? [{ s, r: s.raise }] : []))
        .map(({ s, r }) => ({ name: s.name, short: Math.ceil(r.atDiscount.cost - r.ownedInStorage) }))
        .filter((x) => x.short > 0)
        .sort((a, b) => b.short - a.short || (a.name < b.name ? -1 : 1))[0];
      if (!short)
        return [{ subject, slots: { rule: 0, target: c.afkTarget ?? '' }, advances: 'no' as const }];
      return [
        {
          subject,
          slots: {
            saved: short.short,
            rule: 1,
            target: c.afkTarget ?? '',
            stamp: short.name,
            short: short.short,
          },
          advances: 'yes' as const,
        },
      ];
    });
  },
});
